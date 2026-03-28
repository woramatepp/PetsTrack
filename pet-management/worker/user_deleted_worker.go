package workers

import (
	"log"
	"pet-management/database"
	"pet-management/models"

	amqp "github.com/rabbitmq/amqp091-go"
)

// ฟังก์ชันนี้จะทำงานอยู่เบื้องหลัง (Background) ตลอดเวลาเพื่อรอรับคำสั่งลบ User
func StartUserDeletedWorker() {
	conn, err := amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
	if err != nil {
		log.Fatalf("Worker: Failed to connect to RabbitMQ: %v", err)
	}
	// ไม่ปิด conn ทันที เพราะต้องให้มันทำงานไปตลอด

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Worker: Failed to open a channel: %v", err)
	}

	// ประกาศ Exchange (ตัวเดียวกับระบบหลัก เพื่อให้ใช้ร่วมกันได้)
	err = ch.ExchangeDeclare("pet_events_exchange", "topic", true, false, false, false, nil)

	// สร้าง Queue สำหรับจัดการ Data Consistency โดยเฉพาะ
	q, err := ch.QueueDeclare("pet_consistency_queue", true, false, false, false, nil)

	// ผูก Queue ด้วย Routing Key "user.deleted"
	err = ch.QueueBind(q.Name, "user.deleted", "pet_events_exchange", false, nil)

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
