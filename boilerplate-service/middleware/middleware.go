package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type Middleware struct {
	services *services.Services
	metrics  *metrics.Metrics
}

func NewMiddleware(services *services.Services, metrics *metrics.Metrics) *Middleware {
	return &Middleware{
		services: services,
		metrics:  metrics,
	}
}

func (m *Middleware) Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		log.Info().
			Str("method", param.Method).
			Str("path", param.Path).
			Int("status", param.StatusCode).
			Dur("latency", param.Latency).
			Str("client_ip", param.ClientIP).
			Str("user_agent", param.Request.UserAgent()).
			Msg("HTTP Request")
		return ""
	})
}

func (m *Middleware) CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func (m *Middleware) RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple rate limiting implementation
		// In production, use Redis-based rate limiting
		c.Next()
	}
}

func (m *Middleware) Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Increment in-flight requests
		m.metrics.HTTPRequestsInFlight.WithLabelValues(c.Request.Method, c.FullPath()).Inc()
		defer m.metrics.HTTPRequestsInFlight.WithLabelValues(c.Request.Method, c.FullPath()).Dec()

		c.Next()

		// Record request duration
		duration := time.Since(start).Seconds()
		m.metrics.HTTPRequestDuration.WithLabelValues(c.Request.Method, c.FullPath()).Observe(duration)

		// Record request count
		status := "200"
		if c.Writer.Status() != 200 {
			status = "error"
		}
		m.metrics.HTTPRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
	}
}

func (m *Middleware) Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// JWT authentication middleware
		// In production, validate JWT tokens
		c.Next()
	}
}

func (m *Middleware) Admin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Admin authorization middleware
		// In production, check admin role
		c.Next()
	}
} 