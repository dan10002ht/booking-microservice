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
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"booking-system/email-worker/config"
	"booking-system/email-worker/database"
	"booking-system/email-worker/metrics"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/queue"
	"booking-system/email-worker/repositories"
	"booking-system/email-worker/services"
)

func main() {
	// Initialize logger
	logger, err := initLogger()
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting Email Worker Service")

	// Load configuration
	cfg, err := loadConfig()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize database
	db, err := database.NewConnection(cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Initialize repositories
	jobRepo := repositories.NewEmailJobRepository(db)
	templateRepo := repositories.NewEmailTemplateRepository(db)
	trackingRepo := repositories.NewEmailTrackingRepository(db)

	// Initialize email service
	emailService := services.NewEmailService(cfg, jobRepo, templateRepo, trackingRepo, logger)

	// Initialize queue
	queueFactory := queue.NewQueueFactory(logger)
	queueInstance, err := queueFactory.CreateQueue(cfg.Queue)
	if err != nil {
		logger.Fatal("Failed to create queue", zap.Error(err))
	}
	defer queueInstance.Close()

	// Initialize processor
	processorConfig := &processor.ProcessorConfig{
		WorkerCount:     cfg.Worker.WorkerCount,
		BatchSize:       cfg.Worker.BatchSize,
		PollInterval:    cfg.Worker.PollInterval,
		MaxRetries:      cfg.Worker.MaxRetries,
		RetryDelay:      cfg.Worker.RetryDelay,
		ProcessTimeout:  cfg.Worker.ProcessTimeout,
		CleanupInterval: cfg.Worker.CleanupInterval,
	}

	emailProcessor := processor.NewProcessor(queueInstance, emailService, processorConfig, logger)

	// Start processor
	err = emailProcessor.Start()
	if err != nil {
		logger.Fatal("Failed to start email processor", zap.Error(err))
	}

	// Initialize HTTP server for health checks and metrics
	router := initHTTPServer(emailProcessor, logger)

	// Start HTTP server
	go func() {
		addr := fmt.Sprintf(":%d", cfg.Server.Port)
		logger.Info("Starting HTTP server", zap.String("addr", addr))
		
		if err := router.Run(addr); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start HTTP server", zap.Error(err))
		}
	}()

	// Khởi tạo Prometheus metrics
	metrics.Init()

	// Expose /metrics endpoint cho Prometheus
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		http.ListenAndServe(":2112", nil)
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down Email Worker Service")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Stop processor
	if err := emailProcessor.Stop(); err != nil {
		logger.Error("Error stopping processor", zap.Error(err))
	}

	logger.Info("Email Worker Service stopped")
}

// initLogger initializes the logger
func initLogger() (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	
	// Set log level from environment
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel != "" {
		var level zap.AtomicLevel
		if err := level.UnmarshalText([]byte(logLevel)); err != nil {
			return nil, fmt.Errorf("invalid log level: %w", err)
		}
		config.Level = level
	}

	// Set output path if specified
	if outputPath := os.Getenv("LOG_OUTPUT_PATH"); outputPath != "" {
		config.OutputPaths = []string{outputPath}
	}

	return config.Build()
}

// loadConfig loads configuration from environment variables and config files
func loadConfig() (*config.Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Set defaults
	setDefaults()

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	// Bind environment variables
	bindEnvVars()

	var cfg config.Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}

// setDefaults sets default configuration values
func setDefaults() {
	// Queue defaults
	viper.SetDefault("queue.type", "redis")
	viper.SetDefault("queue.host", "localhost")
	viper.SetDefault("queue.port", 6379)
	viper.SetDefault("queue.database", 0)
	viper.SetDefault("queue.queue_name", "email-jobs")
	viper.SetDefault("queue.batch_size", 10)
	viper.SetDefault("queue.poll_interval", "1s")

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.name", "email_worker")
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.ssl_mode", "disable")

	// Worker defaults
	viper.SetDefault("worker.worker_count", 5)
	viper.SetDefault("worker.batch_size", 10)
	viper.SetDefault("worker.poll_interval", "1s")
	viper.SetDefault("worker.max_retries", 3)
	viper.SetDefault("worker.retry_delay", "5s")
	viper.SetDefault("worker.process_timeout", "30s")
	viper.SetDefault("worker.cleanup_interval", "1h")

	// Server defaults
	viper.SetDefault("server.port", 8080)

	// Email defaults
	viper.SetDefault("email.default_provider", "sendgrid")
}

// bindEnvVars binds environment variables to configuration
func bindEnvVars() {
	// Queue
	viper.BindEnv("queue.host", "REDIS_HOST")
	viper.BindEnv("queue.port", "REDIS_PORT")
	viper.BindEnv("queue.password", "REDIS_PASSWORD")
	viper.BindEnv("queue.database", "REDIS_DB")
	viper.BindEnv("queue.queue_name", "QUEUE_NAME")

	// Database
	viper.BindEnv("database.host", "DB_HOST")
	viper.BindEnv("database.port", "DB_PORT")
	viper.BindEnv("database.name", "DB_NAME")
	viper.BindEnv("database.user", "DB_USER")
	viper.BindEnv("database.password", "DB_PASSWORD")
	viper.BindEnv("database.ssl_mode", "DB_SSL_MODE")

	// Worker
	viper.BindEnv("worker.worker_count", "WORKER_COUNT")
	viper.BindEnv("worker.batch_size", "BATCH_SIZE")
	viper.BindEnv("worker.max_retries", "MAX_RETRIES")

	// Server
	viper.BindEnv("server.port", "PORT")

	// Email providers
	viper.BindEnv("email.providers.sendgrid.api_key", "SENDGRID_API_KEY")
	viper.BindEnv("email.providers.ses.region", "AWS_SES_REGION")
	viper.BindEnv("email.providers.ses.access_key", "AWS_ACCESS_KEY_ID")
	viper.BindEnv("email.providers.ses.secret_key", "AWS_SECRET_ACCESS_KEY")
	viper.BindEnv("email.providers.smtp.host", "SMTP_HOST")
	viper.BindEnv("email.providers.smtp.port", "SMTP_PORT")
	viper.BindEnv("email.providers.smtp.username", "SMTP_USERNAME")
	viper.BindEnv("email.providers.smtp.password", "SMTP_PASSWORD")
}

// initHTTPServer initializes the HTTP server with health checks and metrics
func initHTTPServer(emailProcessor *processor.Processor, logger *zap.Logger) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		err := emailProcessor.Health(ctx)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":    "unhealthy",
				"error":     err.Error(),
				"timestamp": time.Now().UTC(),
			})
			return
		}

		stats := emailProcessor.GetStats()
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
			"stats":     stats,
		})
	})

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Stats endpoint
	router.GET("/stats", func(c *gin.Context) {
		stats := emailProcessor.GetStats()
		workerStats := emailProcessor.GetWorkerStats()
		
		c.JSON(http.StatusOK, gin.H{
			"processor_stats": stats,
			"worker_stats":    workerStats,
		})
	})

	// Queue size endpoint
	router.GET("/queue/size", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		// This would need to be implemented in the processor
		// For now, return the stats from processor
		stats := emailProcessor.GetStats()
		c.JSON(http.StatusOK, gin.H{
			"queue_size": stats.QueueSize,
		})
	})

	return router
} 