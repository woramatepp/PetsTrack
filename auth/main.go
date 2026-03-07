package main

import (
	"github.com/gin-gonic/gin"
	"os"
	"auth/controllers"
	"auth/database"
	"auth/initializers"
)


func main() {

	initializers.LoadEnv()
	database.ConnectDb()

	r := gin.Default()

	userRoute := r.Group("/user") 
	{
		userRoute.POST("/register", controllers.SignUp) 
		userRoute.POST("/login", controllers.Login)
		userRoute.POST("/logout", controllers.SignOut)
	}

	port := os.Getenv("PORT")
	r.Run(":" + port)

}