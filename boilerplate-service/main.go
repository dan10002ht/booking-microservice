package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"boilerplate-service/config"
	"boilerplate-service/database"
	"boilerplate-service/grpcclient"
	"boilerplate-service/handlers"
	"boilerplate-service/metrics"
	"boilerplate-service/middleware"
	"boilerplate-service/queue"
	"boilerplate-service/services"
)

func main() {
	// Initialize logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Set log level
	level, err := zerolog.ParseLevel(cfg.LogLevel)
	if err != nil {
		log.Fatal().Err(err).Msg("Invalid log level")
	}
	zerolog.SetGlobalLevel(level)

	log.Info().Msg("Starting Boilerplate Service...")

	// Initialize database
	db, err := database.NewConnection(cfg.Database)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer db.Close()

	// Initialize Redis
	redis, err := queue.NewRedisClient(cfg.Redis)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}
	defer redis.Close()

	// Initialize Kafka
	kafka, err := queue.NewKafkaClient(cfg.Kafka)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Kafka")
	}
	defer kafka.Close()

	// Initialize gRPC clients
	grpcClients, err := grpcclient.NewClients(cfg.GRPC)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize gRPC clients")
	}
	defer grpcClients.Close()

	// Initialize services
	services := services.NewServices(db, redis, kafka, grpcClients)

	// Initialize metrics
	metrics := metrics.NewMetrics()

	// Initialize middleware
	middleware := middleware.NewMiddleware(services, metrics)

	// Initialize handlers
	handlers := handlers.NewHandlers(services, metrics)

	// Setup router
	router := setupRouter(middleware, handlers)

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info().Int("port", cfg.Server.Port).Msg("Starting HTTP server")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exited")
}

func setupRouter(middleware *middleware.Middleware, handlers *handlers.Handlers) *gin.Engine {
	router := gin.New()

	// Global middleware
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(middleware.RateLimit())
	router.Use(middleware.Metrics())

	// Health check
	router.GET("/health", handlers.Health.HealthCheck)
	router.GET("/ready", handlers.Health.ReadinessCheck)

	// API routes
	api := router.Group("/api/v1")
	{
		// Public routes
		public := api.Group("")
		{
			public.GET("/status", handlers.Status.GetStatus)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.Auth())
		{
			protected.GET("/profile", handlers.User.GetProfile)
			protected.PUT("/profile", handlers.User.UpdateProfile)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.Auth(), middleware.Admin())
		{
			admin.GET("/metrics", handlers.Admin.GetMetrics)
			admin.GET("/logs", handlers.Admin.GetLogs)
		}
	}

	return router
} 