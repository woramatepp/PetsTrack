package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
)

type PetAlert struct {
	PetID   string `json:"pet_id"`
	PetName string `json:"pet_name"`
	OwnerID string `json:"owner_id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

type ClientManager struct {
	clients map[*websocket.Conn]string
	mutex   sync.RWMutex
}

var manager = ClientManager{clients: make(map[*websocket.Conn]string)}
var tracer = otel.Tracer("notification-service")

// --- Tracing Setup ---
func initTracer(serviceName string) func(context.Context) error {
	exporter, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpoint("jaeger:4318"),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		log.Fatal(err)
	}
	res, _ := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceNameKey.String(serviceName)),
	)
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))
	return tp.Shutdown
}

// --- AMQP Carrier สำหรับ Extract Trace ID ---
type AMQPHeadersCarrier map[string]interface{}

func (a AMQPHeadersCarrier) Get(key string) string {
	if v, ok := a[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func (a AMQPHeadersCarrier) Set(key string, value string) {}

// 1️⃣ แก้ไข Keys() ให้ส่งคืนรายชื่อ Key ทั้งหมดที่มีใน Headers
func (a AMQPHeadersCarrier) Keys() []string {
	keys := make([]string, 0, len(a))
	for k := range a {
		keys = append(keys, k)
	}
	return keys
}

// --- WebSocket ---
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// ... (โค้ดเดิมของคุณ ไม่มีการเปลี่ยนแปลง) ...
	ownerID := r.URL.Query().Get("owner_id")
	if ownerID == "" {
		log.Println("Connection rejected: missing owner_id")
		http.Error(w, "Missing owner_id", http.StatusBadRequest)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket Upgrade Error: %v", err)
		return
	}
	defer ws.Close()

	manager.mutex.Lock()
	manager.clients[ws] = ownerID
	manager.mutex.Unlock()

	log.Printf("New Web Client Connected: OwnerID = %s", ownerID)

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			manager.mutex.Lock()
			delete(manager.clients, ws)
			manager.mutex.Unlock()
			log.Printf("Client Disconnected: OwnerID = %s", ownerID)
			break
		}
	}
}

func sendAlertToOwner(ctx context.Context, alert PetAlert) {
	_, span := tracer.Start(ctx, "send-websocket", trace.WithAttributes(
		attribute.String("target_owner_id", alert.OwnerID),
	))
	defer span.End()

	manager.mutex.RLock()
	defer manager.mutex.RUnlock()
	for client, ownerID := range manager.clients {
		if ownerID == alert.OwnerID {
			client.WriteJSON(alert)
		}
	}
}

// 2️⃣ แยกฟังก์ชันจัดการข้อความ 1 ชิ้นออกมา เพื่อให้ใช้ defer span.End() ได้ง่ายขึ้น
func processRabbitMQMessage(d amqp.Delivery) {
	// Extract Trace ID ออกมาจาก RabbitMQ Header
	ctx := otel.GetTextMapPropagator().Extract(context.Background(), AMQPHeadersCarrier(d.Headers))

	// สร้าง Span รับช่วงต่อ
	ctx, span := tracer.Start(ctx, "process-pet-alert")
	defer span.End()

	var alert PetAlert
	if err := json.Unmarshal(d.Body, &alert); err == nil {
		span.SetAttributes(
			attribute.String("pet_id", alert.PetID),
			attribute.String("owner_id", alert.OwnerID),
		)

		log.Printf("Alert received for pet: %s", alert.PetName)
		sendAlertToOwner(ctx, alert) // ส่ง ctx ไปต่อที่ WebSocket sender
	} else {
		span.RecordError(err)
		span.SetStatus(codes.Error, "JSON unmarshal failed")
		log.Printf("Error decoding JSON: %v", err)
	}
}

func main() {
	time.Sleep(15 * time.Second) // รอ RabbitMQ บูท (ถ้าใช้ depends_on ใน docker-compose เอาตรงนี้ออกได้ครับ)
	shutdown := initTracer("notification-service")
	defer shutdown(context.Background())

	http.HandleFunc("/ws", handleConnections)
	go func() {
		log.Println("WebSocket Server running on :8080")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Fatal(err)
		}
	}()

	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		log.Fatalf("Failed to open a channel (conn): %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel (ch): %v", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare("pet_alerts", true, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	log.Println("Waiting for out-of-zone alerts...")

	forever := make(chan bool)
	go func() {
		for d := range msgs {
			// เรียกใช้ฟังก์ชันที่แยกออกมา
			processRabbitMQMessage(d)
		}
	}()

	<-forever
}