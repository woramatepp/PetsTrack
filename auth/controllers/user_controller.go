package controllers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"auth/database"
	"auth/models"
)

func CreateUser(db *gorm.DB, user *models.User) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	result := db.Create(user)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func LoginUser(db *gorm.DB, user *models.User) (string, error) {
	selectUser := new(models.User)
	if result := db.Where("email = ?", user.Email).First(selectUser); result.Error != nil {
		return "", result.Error
	}

	if err := bcrypt.CompareHashAndPassword([]byte(selectUser.Password), []byte(user.Password)); err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": selectUser.ID,
		"exp":     time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func SignUp(c *gin.Context) {
	// 🌟 ปรับให้รับแค่ 2 ฟิลด์ และใช้ตัวพิมพ์เล็กตามมาตรฐาน JSON
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอก Email ให้ถูกต้อง และรหัสผ่านอย่างน้อย 8 ตัว"})
		return
	}

	newUser := models.User{
		Email:    strings.TrimSpace(body.Email),
		Password: body.Password,
	}

	if err := CreateUser(database.DB, &newUser); err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email นี้ถูกใช้งานแล้ว"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างบัญชีได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "ลงทะเบียนสำเร็จ"})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		if check, ok := err.(validator.ValidationErrors); ok {
			for _, e := range check {
				switch e.Tag() {
				case "required":
					c.JSON(http.StatusBadRequest, gin.H{"error": "All required fields must be filled"})
				case "email":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
				default:
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
				}
				return
			}
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	user := &models.User{
		Email:    body.Email,
		Password: body.Password,
	}

	token, err := LoginUser(database.DB, user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", token, 3600*24, "", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Login Success"})
}

func SignOut(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", "", -1, "", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Log out success"})
}
