package main

import (
	"os"
	"pet-management/controllers"
	"pet-management/database"
	"pet-management/initializers"

	"github.com/gin-gonic/gin"
)


func main() {

	initializers.LoadEnv()
	database.ConnectDb()

	port := os.Getenv("PORT")
	r := gin.Default()

	petGroup := r.Group("/pets") 
	{
		petGroup.POST("/create", controllers.CreatePet)
		petGroup.GET("/", controllers.GetPets)
		petGroup.GET("/:id", controllers.GetPetByID)
		petGroup.PUT("/:id", controllers.UpdatePet)
		petGroup.DELETE("/:id", controllers.DeletePet)
	}

	r.Run(":" + port)

}