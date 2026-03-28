package main

import (
	"context"
	"os"
	"pet-management/controllers"
	"pet-management/database"
	"pet-management/initializers"
	"pet-management/tracing"
	workers "pet-management/worker"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func main() {

	initializers.LoadEnv()
	database.ConnectDb()

	shutdown := tracing.InitTracer("pet-management-service")
	defer shutdown(context.Background())

	port := os.Getenv("PORT")
	r := gin.Default()

	r.Use(otelgin.Middleware("pet-management-service"))

	petGroup := r.Group("/pets")
	{
		petGroup.POST("/create", controllers.CreatePet)
		petGroup.GET("/", controllers.GetPets)
		petGroup.GET("/:id", controllers.GetPetByID)
		petGroup.PUT("/:id", controllers.UpdatePet)
		petGroup.DELETE("/:id", controllers.DeletePet)
	}

	go workers.StartUserDeletedWorker()
	r.Run(":" + port)

}
