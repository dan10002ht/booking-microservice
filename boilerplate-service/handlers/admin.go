package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type AdminHandler struct {
	services *services.Services
	metrics  *metrics.Metrics
}

func NewAdminHandler(services *services.Services, metrics *metrics.Metrics) *AdminHandler {
	return &AdminHandler{
		services: services,
		metrics:  metrics,
	}
}

func (h *AdminHandler) GetMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get service metrics",
	})
}

func (h *AdminHandler) GetLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Get service logs",
	})
} 