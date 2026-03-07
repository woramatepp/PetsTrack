package models

import (
	"gorm.io/gorm"
)

type Pet struct {
	gorm.Model
	OwnerID string `gorm:"index"`
	Image   []byte `gorm:"type:bytea"`
	Name    string
	Species string
	Breed   string
	Gender  string
	Age     int
}