package workers

import (
	"encoding/json"
	"log"
	"pet-management/database"
	"pet-management/models"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type LocationMessage struct {
	PetID     uint    `json:"pet_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func StartLocationUpdateWorker() {
	time.Sleep(10 * time.Second) // รอ RabbitMQ พร้อม

	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		log.Printf("❌ LocationWorker Connect Error: %v", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("❌ LocationWorker Channel Error: %v", err)
		return
	}

	// รับจากคิวชื่อเดียวกับที่ tracking-service ส่งมา
	q, err := ch.QueueDeclare("pet_alerts", true, false, false, false, nil)

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)

	log.Println("🛰️  Pet Management: Location Worker is standby...")

	go func() {
		for d := range msgs {
			var msg LocationMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				continue
			}

			// อัปเดตพิกัดลงในตาราง pets ของ Pet Management
			database.DB.Model(&models.Pet{}).Where("id = ?", msg.PetID).Updates(models.Pet{
				Latitude:  msg.Latitude,
				Longitude: msg.Longitude,
			})

			log.Printf("✅ อัปเดตพิกัดใหม่ให้สัตว์เลี้ยง ID: %d", msg.PetID)
		}
	}()
}
