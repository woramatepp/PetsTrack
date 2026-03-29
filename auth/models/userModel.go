package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Email       string `gorm:"unique;not null" json:"email"`
	Password    string `gorm:"not null" json:"-"` // ไม่ส่ง password กลับไปใน JSON
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatar_url"` // เก็บ URL ของรูปโปรไฟล์
}
