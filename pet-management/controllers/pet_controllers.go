package controllers

import (
	"io"
	"mime/multipart"
	"net/http"

	"pet-management/database"
	"pet-management/models"

	"github.com/gin-gonic/gin"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
)

type CreatePetRequest struct {
	Name    string                `form:"name" binding:"required"`
	Species string                `form:"species" binding:"required"`
	Breed   string                `form:"breed"`
	Gender  string                `form:"gender"`
	Age     int                   `form:"age"`
	Image   *multipart.FileHeader `form:"image" binding:"required"`
}

type UpdatePetRequest struct {
	Name    string                `form:"name"`
	Species string                `form:"species"`
	Breed   string                `form:"breed"`
	Gender  string                `form:"gender"`
	Age     int                   `form:"age"`
	Image   *multipart.FileHeader `form:"image"`
}

var tracer = otel.Tracer("pet-management-service")

func CreatePet(c *gin.Context) {
	ownerID := c.GetHeader("X-User-Id")
	ctx, span := tracer.Start(c.Request.Context(), "CreatePet")
	defer span.End()
	if ownerID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreatePetRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	file, err := req.Image.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Can not open file."})
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Can not read file."})
		return
	}

	newPet := models.Pet{
		Name:    req.Name,
		Species: req.Species,
		Breed:   req.Breed,
		Gender:  req.Gender,
		Age:     req.Age,
		Image:   imageData,
		OwnerID: ownerID,
	}

	if err := database.DB.WithContext(ctx).Create(&newPet).Error; err != nil {
		span.RecordError(err)
        span.SetStatus(codes.Error, "failed to create pet in db")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Success"})
}

func GetPets(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "GetPets")
	defer span.End()
	ownerID := c.GetHeader("X-User-Id")
	if ownerID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var pets []models.Pet
	if err := database.DB.WithContext(ctx).Where("owner_id = ?", ownerID).Find(&pets).Error; err != nil {
		span.RecordError(err)
        span.SetStatus(codes.Error, "failed to get pets from db")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pets)
}

func GetPetByID(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "GetPetByID")
	defer span.End()
	petID := c.Param("id")
	ownerID := c.GetHeader("X-User-Id")

	var pet models.Pet
	if err := database.DB.WithContext(ctx).Where("id = ? AND owner_id = ?", petID, ownerID).First(&pet).Error; err != nil {
		span.RecordError(err)
        span.SetStatus(codes.Error, "failed to get pet by ID")
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
		return
	}

	c.JSON(http.StatusOK, pet)
}

func UpdatePet(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "UpdatePet")
	defer span.End()
    petID := c.Param("id")
    ownerID := c.GetHeader("X-User-Id")

    var pet models.Pet
	
    if err := database.DB.WithContext(ctx).Where("id = ? AND owner_id = ?", petID, ownerID).First(&pet).Error; err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to find pet in db")
        c.JSON(http.StatusNotFound, gin.H{"error": "Pet not found"})
        return
    }

    var req UpdatePetRequest
    if err := c.ShouldBind(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if req.Name != "" { pet.Name = req.Name }
    if req.Species != "" { pet.Species = req.Species }
    if req.Breed != "" { pet.Breed = req.Breed }
    if req.Gender != "" { pet.Gender = req.Gender }
    if req.Age != 0 { pet.Age = req.Age }

    if req.Image != nil {
        file, err := req.Image.Open()
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open image"})
            return
        }
        defer file.Close()
        
        imageData, err := io.ReadAll(file)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image"})
            return
        }
        pet.Image = imageData
    }

    if err := database.DB.WithContext(ctx).Save(&pet).Error; err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to update pet in db")
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Update Success"})
}

func DeletePet(c *gin.Context) {
	ctx, span := tracer.Start(c.Request.Context(), "DeletePet")
	defer span.End()
	petID := c.Param("id")
	ownerID := c.GetHeader("X-User-Id")

	var pet models.Pet
	if err := database.DB.WithContext(ctx).Where("id = ? AND owner_id = ?", petID, ownerID).First(&pet).Error; err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to find pet in db")
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet Not found"})
		return
	}

	if err := database.DB.WithContext(ctx).Delete(&pet).Error; err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "failed to delete pet from db")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete Success"})
}