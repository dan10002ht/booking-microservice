package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type HealthHandler struct {
	services *services.Services
	metrics  *metrics.Metrics
}

func NewHealthHandler(services *services.Services, metrics *metrics.Metrics) *HealthHandler {
	return &HealthHandler{
		services: services,
		metrics:  metrics,
	}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "boilerplate-service",
	})
}

func (h *HealthHandler) ReadinessCheck(c *gin.Context) {
	// Check database connection
	if err := h.services.Database.Ping(); err != nil {
		log.Error().Err(err).Msg("Database health check failed")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  "database connection failed",
		})
		return
	}

	// Check Redis connection
	ctx := c.Request.Context()
	if err := h.services.Redis.Ping(ctx).Err(); err != nil {
		log.Error().Err(err).Msg("Redis health check failed")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  "redis connection failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
		"service": "boilerplate-service",
	})
} 