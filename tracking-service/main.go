package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
	amqp "github.com/rabbitmq/amqp091-go"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

type amqpHeadersCarrier amqp.Table

func (c amqpHeadersCarrier) Get(key string) string {
	if v, ok := c[key]; ok {
		return fmt.Sprint(v)
	}
	return ""
}

func (c amqpHeadersCarrier) Set(key string, value string) {
	c[key] = value
}

func (c amqpHeadersCarrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for k := range c {
		keys = append(keys, k)
	}
	return keys
}

// โครงสร้างข้อมูลพิกัดที่รับเข้ามา
type LocationPayload struct {
	PetID     string  `json:"pet_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

var rmqChannel *amqp.Channel
var db *sql.DB

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

func main() {
	shutdown := initTracer("tracking-service")
	defer shutdown(context.Background())

	var err error
	// ตั้งค่าการเชื่อมต่อ PostgreSQL
	connStr := os.Getenv("DB_DSN")
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("ไม่สามารถเชื่อมต่อฐานข้อมูลได้: %v", err)
	}
	defer db.Close()

	// ตรวจสอบการเชื่อมต่อ
	if err = db.Ping(); err != nil {
		log.Fatalf("ฐานข้อมูลไม่ตอบสนอง: %v", err)
	}

	// สร้างตารางอัตโนมัติ
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS pet_locations (
		id SERIAL PRIMARY KEY,
		pet_id VARCHAR(50) NOT NULL,
		latitude DOUBLE PRECISION NOT NULL,
		longitude DOUBLE PRECISION NOT NULL,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Fatalf("ไม่สามารถสร้างตารางได้: %v", err)
	}

	// ---> จุดที่ 1: เชื่อมต่อ RabbitMQ ทันทีที่ระบบเริ่มทำงาน <---
	initRabbitMQ()

	// เพิ่ม Endpoint
	// http.HandleFunc("/", serveFrontend)
	// http.HandleFunc("/tracking/location", handleLocation)
	http.Handle("/", otelhttp.NewHandler(http.HandlerFunc(serveFrontend), "serveFrontend"))
	http.Handle("/tracking/location", otelhttp.NewHandler(http.HandlerFunc(handleLocation), "handleLocation"))

	fmt.Println("Tracking Service กำลังรันอยู่ที่พอร์ต 8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

func initRabbitMQ() {
	rabbitURL := os.Getenv("RABBIT_URL")
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Printf("RabbitMQ connection failed: %v", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("RabbitMQ channel failed: %v", err)
		return
	}

	_, err = ch.QueueDeclare("pet_alerts", true, false, false, false, nil)
	if err != nil {
		log.Printf("Queue declaration failed: %v", err)
		return
	}
	rmqChannel = ch
	fmt.Println("RabbitMQ Initialized Successfully")
}

func publishToRabbitMQ(ctx context.Context, alert map[string]interface{}) {
	ctx, span := otel.Tracer("tracking-service").Start(ctx, "RabbitMQ Publish: pet_alerts")
	defer span.End()

	if rmqChannel == nil {
		err := fmt.Errorf("RabbitMQ channel ไม่พร้อมใช้งาน")
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		log.Println(err)
		log.Println("RabbitMQ channel ไม่พร้อมใช้งาน")
		return
	}
	headers := amqp.Table{}

	otel.GetTextMapPropagator().Inject(ctx, amqpHeadersCarrier(headers))

	body, _ := json.Marshal(alert)
	err := rmqChannel.Publish(
		"",           // exchange
		"pet_alerts", // routing key (ชื่อคิว)
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			Headers:     headers,
			ContentType: "application/json",
			Body:        body,
		})

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to publish message")
		log.Printf("ส่งข้อมูลเข้า RabbitMQ ไม่สำเร็จ: %v", err)
	} else {
		fmt.Println("--> Auto Publish:", string(body))
	}
}

func serveFrontend(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "tracker.html")
		return
	}
	http.NotFound(w, r)
}

func handleLocation(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	ctx := r.Context()

	ctx, span := otel.Tracer("tracking-service").Start(ctx, "process_location")
	defer span.End()

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "รองรับเฉพาะ POST request", http.StatusMethodNotAllowed)
		return
	}

	var payload LocationPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "รูปแบบข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	jsonData, _ := json.MarshalIndent(payload, "", "  ")
	fmt.Println("ได้รับพิกัดใหม่:\n", string(jsonData))

	insertQuery := `INSERT INTO pet_locations (pet_id, latitude, longitude) VALUES ($1, $2, $3)`
	_, err = db.ExecContext(ctx, insertQuery, payload.PetID, payload.Latitude, payload.Longitude)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to insert location")
		log.Printf("เกิดข้อผิดพลาดในการบันทึกข้อมูล: %v", err)
		http.Error(w, "ข้อผิดพลาดเซิร์ฟเวอร์ภายใน", http.StatusInternalServerError)
		return
	}

	ownerID := r.Header.Get("X-User-Id")

	if ownerID != "" {
		status := "Savezone"
		message := "อัปเดตพิกัดล่าสุด"

		if payload.Latitude > 14 {
			status = "Out of savezone"
			message = "สัตว์เลี้ยงออกนอก Savezone!"
		}

		alert := map[string]interface{}{
			"pet_id":    payload.PetID,
			"pet_name":  "สัตว์เลี้ยงของคุณ",
			"owner_id":  ownerID,
			"status":    status,
			"message":   message,
			"latitude":  payload.Latitude,
			"longitude": payload.Longitude,
		}
		publishToRabbitMQ(ctx, alert)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "บันทึกพิกัดสำเร็จ",
	})
}
