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
	var conn *amqp.Connection
	var err error

	// 1. วนลูปพยายามเชื่อมต่อ RabbitMQ จนกว่าจะสำเร็จ
	for {
		conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
		if err == nil {
			log.Println("✅ LocationWorker เชื่อมต่อ RabbitMQ สำเร็จแล้ว")
			break // เชื่อมต่อสำเร็จ ออกจากลูป
		}
		log.Printf("⏳ LocationWorker กำลังรอ RabbitMQ พร้อมใช้งาน... (%v)", err)
		time.Sleep(5 * time.Second) // รอ 5 วินาทีแล้วลองเชื่อมต่อใหม่
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("❌ LocationWorker Channel Error: %v", err)
		return
	}

	// 2. ประกาศ Exchange ให้ตรงกับที่ tracking-service สร้างไว้
	err = ch.ExchangeDeclare(
		"system_events_exchange", // name
		"topic",                  // type
		true,                     // durable
		false,                    // auto-deleted
		false,                    // internal
		false,                    // no-wait
		nil,                      // arguments
	)
	if err != nil {
		log.Printf("❌ Exchange Declare Error: %v", err)
		return
	}

	// 3. ประกาศ Queue สำหรับรับพิกัด
	q, err := ch.QueueDeclare(
		"pet_location_updates", // queue name
		true,                   // durable
		false,                  // delete when unused
		false,                  // exclusive
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		log.Printf("❌ Queue Declare Error: %v", err)
		return
	}

	// 4. ผูก Queue เข้ากับ Exchange ด้วย Routing Key
	err = ch.QueueBind(
		q.Name,                   // queue name
		"pet.location.updated",   // routing key
		"system_events_exchange", // exchange
		false,
		nil,
	)
	if err != nil {
		log.Printf("❌ Queue Bind Error: %v", err)
		return
	}

	// 5. เริ่มรับข้อความจาก Queue
	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		log.Printf("❌ Consume Error: %v", err)
		return
	}

	log.Println("🛰️  Pet Management: Location Worker is standby...")

	go func() {
		for d := range msgs {
			var msg LocationMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				log.Printf("❌ Unmarshal Error: %v", err)
				continue
			}

			// อัปเดตพิกัดลงในตาราง pets
			result := database.DB.Model(&models.Pet{}).Where("id = ?", msg.PetID).Updates(models.Pet{
				Latitude:  msg.Latitude,
				Longitude: msg.Longitude,
			})

			if result.Error != nil {
				log.Printf("❌ อัปเดตพิกัดล้มเหลว: %v", result.Error)
			} else {
				log.Printf("✅ อัปเดตพิกัดใหม่ให้สัตว์เลี้ยง ID: %d เรียบร้อย", msg.PetID)
			}
		}
	}()
}
