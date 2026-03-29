package main

import (
	"context"
	"os"
	"pet-management/controllers"
	"pet-management/database"
	"pet-management/initializers"
	"pet-management/models"
	"pet-management/tracing"
	workers "pet-management/worker"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func init() {
	// โหลด Env และเชื่อมต่อ DB ตั้งแต่เริ่ม
	initializers.LoadEnv()
	database.ConnectDb()
	// สั่ง Migrate สร้างตาราง Pets (ฟิลด์จะอัปเดตตาม Models ที่เราแก้)
	database.DB.AutoMigrate(&models.Pet{})
}

func main() {
	// 1. ตั้งค่า Tracer สำหรับ OpenTelemetry
	shutdown := tracing.InitTracer("pet-management-service")
	defer shutdown(context.Background())

	// 2. ประกาศตัวแปร Gin Engine ก่อนใช้งาน
	r := gin.Default()

	// 3. ตั้งค่า Middleware ต่างๆ
	r.Use(cors.Default())
	r.Use(otelgin.Middleware("pet-management-service"))

	// 4. เปิดให้เข้าถึงไฟล์รูปภาพสัตว์เลี้ยง
	// ตรวจสอบให้แน่ใจว่ามีโฟลเดอร์ ./uploads/pets อยู่ในโปรเจกต์
	r.Static("/uploads", "./uploads")

	// 5. กำหนด Routes (รับช่วงต่อจาก API Gateway ที่ตัด Prefix ออกแล้ว)
	r.POST("/", controllers.CreatePet)                  // เปลี่ยนจาก /create เป็น / เพื่อให้ Gateway ยิงมาที่ /pets/ แล้วเจอเลย
	r.GET("/locations", controllers.GetAllPetLocations) // สำหรับดึงพิกัดไปโชว์ใน Leaflet
	r.GET("/", controllers.GetPets)                     // ดึงรายการสัตว์เลี้ยงทั้งหมดของ User
	r.GET("/:id", controllers.GetPetByID)
	r.PUT("/:id", controllers.UpdatePet)
	r.DELETE("/:id", controllers.DeletePet)

	// 6. เริ่มการทำงานของ Worker (RabbitMQ) ใน Background
	go workers.StartUserDeletedWorker()
	go workers.StartLocationUpdateWorker()

	// 7. จัดการเรื่อง Port และรัน Service
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // พอร์ตมาตรฐานของ Pet Service
	}

	r.Run(":" + port)
}
