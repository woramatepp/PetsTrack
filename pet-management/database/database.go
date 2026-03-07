package database

import (
	"pet-management/models"
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	
)

var DB *gorm.DB

func ConnectDb() {
	var err error
	dsn := os.Getenv("PET_DB_DSN")
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect database")
	}
	fmt.Println("Successfully connected!")

	DB.AutoMigrate((&models.Pet{}))
}
