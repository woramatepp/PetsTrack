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
	PetID     int     `json:"pet_id"`
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

// ฟังก์ชันสำหรับดึงพิกัดล่าสุดของสัตว์เลี้ยง
func getLatestLocation(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	petID := r.URL.Query().Get("pet_id")

	if petID == "" {
		http.Error(w, `{"error":"pet_id is required"}`, http.StatusBadRequest)
		return
	}

	var payload LocationPayload
	// Query หาแถวล่าสุดของสัตว์เลี้ยงตัวนั้น
	err := db.QueryRowContext(r.Context(),
		"SELECT pet_id, latitude, longitude FROM pet_locations WHERE pet_id = $1 ORDER BY timestamp DESC LIMIT 1",
		petID).Scan(&payload.PetID, &payload.Latitude, &payload.Longitude)

	if err != nil {
		http.Error(w, `{"error":"no data found"}`, http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(payload)
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
		pet_id INT NOT NULL,
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
	http.Handle("/tracking/latest", otelhttp.NewHandler(http.HandlerFunc(getLatestLocation), "getLatestLocation"))

	fmt.Println("Tracking Service กำลังรันอยู่ที่พอร์ต 8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

// --- แก้ไข initRabbitMQ ---
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

	// 🌟 เปลี่ยนจาก QueueDeclare เป็น ExchangeDeclare ชนิด topic
	err = ch.ExchangeDeclare("system_events_exchange", "topic", true, false, false, false, nil)
	if err != nil {
		log.Printf("Exchange declaration failed: %v", err)
		return
	}
	rmqChannel = ch
	fmt.Println("RabbitMQ Initialized Successfully (Exchange: system_events_exchange)")
}

// --- แก้ไข publishToRabbitMQ ---
// เปลี่ยน parameter มารับ routingKey ด้วย
func publishToRabbitMQ(ctx context.Context, routingKey string, payload map[string]interface{}) {
	ctx, span := otel.Tracer("tracking-service").Start(ctx, "RabbitMQ Publish: "+routingKey)
	defer span.End()

	if rmqChannel == nil {
		log.Println("RabbitMQ channel ไม่พร้อมใช้งาน")
		return
	}
	headers := amqp.Table{}
	otel.GetTextMapPropagator().Inject(ctx, amqpHeadersCarrier(headers))

	body, _ := json.Marshal(payload)
	err := rmqChannel.Publish(
		"system_events_exchange", // 🌟 ส่งเข้า Exchange แทน
		routingKey,               // 🌟 ใช้ Routing Key ที่ส่งมา
		false,
		false,
		amqp.Publishing{
			Headers:     headers,
			ContentType: "application/json",
			Body:        body,
		})

	if err != nil {
		log.Printf("ส่งข้อมูลเข้า RabbitMQ ไม่สำเร็จ: %v", err)
	} else {
		fmt.Println("--> Auto Publish [", routingKey, "]:", string(body))
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

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "รองรับเฉพาะ POST request", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	ctx, span := otel.Tracer("tracking-service").Start(ctx, "process_location")
	defer span.End()

	// 1. รับค่าและ Decode JSON ก่อน
	var payload LocationPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "รูปแบบข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	jsonData, _ := json.MarshalIndent(payload, "", "  ")
	fmt.Println("ได้รับพิกัดใหม่:\n", string(jsonData))

	// 2. บันทึกลง Database ของ Tracking
	insertQuery := `INSERT INTO pet_locations (pet_id, latitude, longitude) VALUES ($1, $2, $3)`
	_, err = db.ExecContext(ctx, insertQuery, payload.PetID, payload.Latitude, payload.Longitude)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to insert location")
		log.Printf("เกิดข้อผิดพลาดในการบันทึกข้อมูล: %v", err)
		http.Error(w, "ข้อผิดพลาดเซิร์ฟเวอร์ภายใน", http.StatusInternalServerError)
		return
	}

	// 3. ส่งข้อมูลไปให้ Pet Management อัปเดตพิกัด (ฟีเจอร์ใหม่)
	locationUpdate := map[string]interface{}{
		"pet_id":    payload.PetID,
		"latitude":  payload.Latitude,
		"longitude": payload.Longitude,
	}
	publishToRabbitMQ(ctx, "pet.location.updated", locationUpdate)

	// 4. ตรวจสอบและส่ง Notification (ฟีเจอร์เดิม)
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

		// 🌟 เติม Routing Key "pet.alerts" ลงไปเพื่อให้ตรงกับโครงสร้างใหม่
		publishToRabbitMQ(ctx, "pet.alerts", alert)
	}

	// 5. ส่ง Response กลับไปให้ Client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "บันทึกพิกัดสำเร็จ",
	})
}
