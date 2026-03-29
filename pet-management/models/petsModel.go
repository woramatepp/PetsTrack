package models

import "gorm.io/gorm"

type Pet struct {
	gorm.Model
	Name      string  `json:"name" binding:"required"`
	Type      string  `json:"type" binding:"required"` // หมา, แมว, นก...
	Gender    string  `json:"gender"`
	Age       int     `json:"age"`
	Weight    float64 `json:"weight"`
	UserID    uint    `json:"user_id"`  // เจ้าของ
	Latitude  float64 `json:"latitude"` // พิกัดล่าสุด
	Longitude float64 `json:"longitude"`
}
