package controllers

import (
	"fmt"
	"net/http"

	"pet-management/database"
	"pet-management/models"

	"github.com/gin-gonic/gin"

	"go.opentelemetry.io/otel"
)

var tracer = otel.Tracer("pet-management-service")

// 🌟 เพิ่มสัตว์เลี้ยงใหม่ (รองรับการบันทึกไฟล์รูปภาพ)
func CreatePet(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "CreatePet")
	defer span.End()

	userIDStr := c.GetHeader("X-User-Id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var userID uint
	fmt.Sscanf(userIDStr, "%d", &userID)

	// รับข้อมูลจาก Form (ไม่ใช่ JSON เพราะมีไฟล์รูป)
	var input struct {
		Name   string  `form:"name" binding:"required"`
		Type   string  `form:"type" binding:"required"`
		Gender string  `form:"gender"`
		Age    int     `form:"age"`
		Weight float64 `form:"weight"`
	}

	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pet := models.Pet{
		Name:   input.Name,
		Type:   input.Type,
		Gender: input.Gender,
		Age:    input.Age,
		Weight: input.Weight,
		UserID: userID,
		// กำหนดพิกัดเริ่มต้น (สมมติเป็นจุดเริ่มต้นการติดตาม)
		Latitude:  13.7563,
		Longitude: 100.5018,
	}

	if err := database.DB.WithContext(ctx).Create(&pet).Error; err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pet profile"})
		return
	}

	c.JSON(http.StatusCreated, pet)
}

// 🌟 ดึงพิกัดสัตว์เลี้ยงทั้งหมด (สำหรับหน้า Overview แผนที่)
func GetAllPetLocations(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "GetAllPetLocations")
	defer span.End()

	var pets []models.Pet
	// ดึงเฉพาะข้อมูลที่จำเป็นไปแสดงบนหมุดแผนที่
	if err := database.DB.WithContext(ctx).Select("id, name, type, latitude, longitude").Find(&pets).Error; err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch locations"})
		return
	}

	c.JSON(http.StatusOK, pets)
}

// ดึงรายการสัตว์เลี้ยงของตัวเอง
func GetPets(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "GetPets")
	defer span.End()

	userID := c.GetHeader("X-User-Id")
	var pets []models.Pet
	// เปลี่ยนจาก owner_id เป็น UserID ให้ตรงกับ Model ใหม่
	if err := database.DB.WithContext(ctx).Where("user_id = ?", userID).Find(&pets).Error; err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pets)
}

func GetPetByID(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "GetPetByID")
	defer span.End()

	petID := c.Param("id")
	userID := c.GetHeader("X-User-Id")

	var pet models.Pet
	if err := database.DB.WithContext(ctx).Where("id = ? AND user_id = ?", petID, userID).First(&pet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	c.JSON(http.StatusOK, pet)
}

func UpdatePet(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "UpdatePet")
	defer span.End()

	petID := c.Param("id")
	userID := c.GetHeader("X-User-Id")

	var pet models.Pet
	if err := database.DB.WithContext(ctx).Where("id = ? AND user_id = ?", petID, userID).First(&pet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	// รับค่าที่ต้องการอัปเดต
	var input struct {
		Name   string  `form:"name"`
		Type   string  `form:"type"`
		Gender string  `form:"gender"`
		Age    int     `form:"age"`
		Weight float64 `form:"weight"`
	}

	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ข้อมูล
	updates := models.Pet{
		Name:   input.Name,
		Type:   input.Type,
		Gender: input.Gender,
		Age:    input.Age,
		Weight: input.Weight,
	}

	database.DB.WithContext(ctx).Model(&pet).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"message": "Update Success"})
}

func DeletePet(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "DeletePet")
	defer span.End()

	petID := c.Param("id")
	userID := c.GetHeader("X-User-Id")

	if err := database.DB.WithContext(ctx).Where("id = ? AND user_id = ?", petID, userID).Delete(&models.Pet{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete Success"})
}
