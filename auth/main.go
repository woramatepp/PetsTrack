package main

import (
	"auth/controllers"
	"auth/database"
	"auth/initializers"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func init() {
	initializers.LoadEnv()
	database.ConnectDb()
}

func main() {
	r := gin.Default()

	// ตั้งค่า CORS (ควรเข้มงวดกว่านี้ใน Production)
	r.Use(cors.Default())

	// เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ uploads
	// ทำให้เข้าถึงรูปผ่าน http://localhost:พอร์ตauth/uploads/profile/ชื่อไฟล์.jpg
	r.Static("/uploads", "./uploads")

	r.POST("/signup", controllers.SignUp)
	r.POST("/login", controllers.Login)
	r.POST("/logout", controllers.SignOut)

	// Route ที่ต้องการการล็อกอิน (RequireAuth Middleware จะถูกเช็คที่ Gateway)
	r.GET("/me", controllers.GetMe)
	r.PUT("/profile", controllers.UpdateProfile)
	r.POST("/profile/avatar", controllers.UploadAvatar)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
