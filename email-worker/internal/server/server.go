package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"

	"booking-system/email-worker/processor"
)

// Server represents the HTTP server
type Server struct {
	router         *gin.Engine
	logger         *zap.Logger
	emailProcessor *processor.Processor
	port           int
}

// NewServer creates a new HTTP server
func NewServer(logger *zap.Logger, emailProcessor *processor.Processor, port int) *Server {
	return &Server{
		logger:         logger,
		emailProcessor: emailProcessor,
		port:           port,
	}
}

// Initialize sets up the HTTP server routes
func (s *Server) Initialize() {
	gin.SetMode(gin.ReleaseMode)
	s.router = gin.New()
	s.router.Use(gin.Recovery())

	// Health check endpoint
	s.router.GET("/health", s.healthHandler)

	// Metrics endpoint
	s.router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Stats endpoint
	s.router.GET("/stats", s.statsHandler)

	// Queue size endpoint
	s.router.GET("/queue/size", s.queueSizeHandler)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.port)
	s.logger.Info("Starting HTTP server", zap.String("addr", addr))
	
	return s.router.Run(addr)
}

// healthHandler handles health check requests
func (s *Server) healthHandler(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	err := s.emailProcessor.Health(ctx)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "unhealthy",
			"error":     err.Error(),
			"timestamp": time.Now().UTC(),
		})
		return
	}

	stats := s.emailProcessor.GetStats()
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
		"stats":     stats,
	})
}

// statsHandler handles stats requests
func (s *Server) statsHandler(c *gin.Context) {
	stats := s.emailProcessor.GetStats()
	workerStats := s.emailProcessor.GetWorkerStats()
	
	c.JSON(http.StatusOK, gin.H{
		"processor_stats": stats,
		"worker_stats":    workerStats,
	})
}

// queueSizeHandler handles queue size requests
func (s *Server) queueSizeHandler(c *gin.Context) {
	stats := s.emailProcessor.GetStats()
	c.JSON(http.StatusOK, gin.H{
		"queue_size": stats.QueueSize,
	})
} 