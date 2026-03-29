package workers

import (
	"log"
	"pet-management/database"
	"pet-management/models"
	"time" // <-- อย่าลืม import time

	amqp "github.com/rabbitmq/amqp091-go"
)

func StartUserDeletedWorker() {
	// 🌟 1. หน่วงเวลาให้ RabbitMQ บูทเสร็จก่อน 10 วินาที
	time.Sleep(10 * time.Second)

	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		// 🌟 2. เปลี่ยนจาก log.Fatalf เป็น log.Printf เพื่อไม่ให้แอปหลักดับ
		return // จบการทำงานของ Worker แค่นี้ แต่ API ปกติยังทำงานต่อได้
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("❌ Worker: Failed to open a channel: %v", err)
		return
	}

	// ... (โค้ดส่วนที่เหลือด้านล่างปล่อยไว้เหมือนเดิมได้เลยครับ)
	err = ch.ExchangeDeclare("system_events_exchange", "topic", true, false, false, false, nil)

	// สร้าง Queue สำหรับจัดการ Data Consistency โดยเฉพาะ
	q, err := ch.QueueDeclare("pet_consistency_queue", true, false, false, false, nil)

	// ผูก Queue ด้วย Routing Key "user.deleted"
	err = ch.QueueBind(q.Name, "user.deleted", "system_events_exchange", false, nil)

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)

	go func() {
		for d := range msgs {
			deletedUserID := string(d.Body) // สมมติว่าส่ง ID ของ User มาใน Body ตรงๆ
			log.Printf("Worker received user.deleted event for OwnerID: %s", deletedUserID)

			// ลบข้อมูลสัตว์เลี้ยงทั้งหมดที่เป็นของ User คนนี้ (Data Consistency)
			result := database.DB.Where("owner_id = ?", deletedUserID).Delete(&models.Pet{})
			if result.Error != nil {
				log.Printf("Worker Failed to delete pets for OwnerID %s: %v", deletedUserID, result.Error)
			} else {
				log.Printf("Worker successfully deleted %d pets for OwnerID %s", result.RowsAffected, deletedUserID)
			}
		}
	}()
}
