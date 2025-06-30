package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type UserHandler struct {
	services *services.Services
	metrics  *metrics.Metrics
}

func NewUserHandler(services *services.Services, metrics *metrics.Metrics) *UserHandler {
	return &UserHandler{
		services: services,
		metrics:  metrics,
	}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get user profile",
	})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Update user profile",
	})
} 