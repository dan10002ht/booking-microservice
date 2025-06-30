package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type StatusHandler struct {
	services *services.Services
	metrics  *metrics.Metrics
}

func NewStatusHandler(services *services.Services, metrics *metrics.Metrics) *StatusHandler {
	return &StatusHandler{
		services: services,
		metrics:  metrics,
	}
}

func (h *StatusHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "running",
		"service": "boilerplate-service",
		"version": "1.0.0",
	})
} 