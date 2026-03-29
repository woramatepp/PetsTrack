package main

import (
	"auth/controllers"
	"auth/database"
	"auth/initializers"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {

	initializers.LoadEnv()
	database.ConnectDb()

	r := gin.Default()

	userRoute := r.Group("/user")
	{
		userRoute.POST("/sighup", controllers.SignUp)
		userRoute.POST("/login", controllers.Login)
		userRoute.POST("/logout", controllers.SignOut)
	}

	port := os.Getenv("PORT")
	r.Run(":" + port)

}
