package app

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"

	"booking-system/email-worker/config"
	"booking-system/email-worker/database"
	"booking-system/email-worker/database/migrations"
	"booking-system/email-worker/metrics"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/providers"
	"booking-system/email-worker/queue"
	"booking-system/email-worker/repositories"
	"booking-system/email-worker/services"
	"booking-system/email-worker/templates"
)

// App represents the main application
type App struct {
	logger          *zap.Logger
	config          *config.Config
	db              *database.DB
	emailProcessor  *processor.Processor
	emailService    *services.EmailService
	queueInstance   queue.Queue
}

// NewApp creates a new application instance
func NewApp(logger *zap.Logger, cfg *config.Config) *App {
	return &App{
		logger: logger,
		config: cfg,
	}
}

// Initialize sets up all application components
func (a *App) Initialize() error {
	a.logger.Info("Initializing Email Worker Service")

	// Initialize database
	db, err := database.NewConnection(a.config.Database)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	a.db = db

	// Run database migrations
	a.logger.Info("Running database migrations")
	migrationRunner := migrations.NewMigrationRunner(db.GetSQLDB())
	migrationsDir := migrations.GetMigrationsDir()
	if err := migrationRunner.RunMigrations(migrationsDir); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	a.logger.Info("Database migrations completed")

	// Initialize repositories
	jobRepo := repositories.NewEmailJobRepository(db.GetSQLDB(), a.logger)
	templateRepo := repositories.NewEmailTemplateRepository(db.GetSQLDB(), a.logger)

	// Initialize template engine
	templateEngine := templates.NewEngine()

	// Initialize email provider factory
	providerConfig := make(map[string]any)
	for name, config := range a.config.Email.Providers {
		providerConfig[name] = map[string]any{
			"api_key":     config.APIKey,
			"region":      config.Region,
			"access_key":  config.AccessKey,
			"secret_key":  config.SecretKey,
			"host":        config.Host,
			"port":        config.Port,
			"username":    config.Username,
			"password":    config.Password,
			"use_tls":     config.UseTLS,
		}
	}
	
	providerFactory := providers.NewProviderFactory(providerConfig)
	emailProvider, err := providerFactory.CreateProvider(providers.ProviderType(a.config.Email.DefaultProvider))
	if err != nil {
		a.logger.Warn("Failed to create email provider, email sending will be disabled", zap.Error(err))
		// Set emailProvider to nil - email service will handle this gracefully
		emailProvider = nil
	}

	// Initialize email service
	emailService := services.NewEmailService(jobRepo, templateRepo, emailProvider, templateEngine)
	a.emailService = emailService

	// Initialize queue
	queueFactory := queue.NewQueueFactory(a.logger)
	queueConfig := queue.QueueConfig{
		Type:         a.config.Queue.Type,
		Host:         a.config.Queue.Host,
		Port:         a.config.Queue.Port,
		Password:     a.config.Queue.Password,
		Database:     a.config.Queue.Database,
		QueueName:    a.config.Queue.QueueName,
		BatchSize:    a.config.Queue.BatchSize,
		PollInterval: a.config.Queue.PollInterval.String(),
	}
	queueInstance, err := queueFactory.CreateQueue(queueConfig)
	if err != nil {
		return fmt.Errorf("failed to create queue: %w", err)
	}
	a.queueInstance = queueInstance

	// Initialize processor
	processorConfig := &processor.ProcessorConfig{
		WorkerCount:     a.config.Worker.WorkerCount,
		BatchSize:       a.config.Worker.BatchSize,
		PollInterval:    a.config.Worker.PollInterval,
		MaxRetries:      a.config.Worker.MaxRetries,
		RetryDelay:      a.config.Worker.RetryDelay,
		ProcessTimeout:  a.config.Worker.ProcessTimeout,
		CleanupInterval: a.config.Worker.CleanupInterval,
	}

	emailProcessor := processor.NewProcessor(queueInstance, emailService, processorConfig, a.logger)
	a.emailProcessor = emailProcessor

	// Start processor
	if err := emailProcessor.Start(); err != nil {
		return fmt.Errorf("failed to start email processor: %w", err)
	}

	// Initialize Prometheus metrics
	metrics.Init()

	a.logger.Info("Email Worker Service initialized successfully")
	return nil
}

// Run starts the application and waits for shutdown signal
func (a *App) Run() error {
	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	a.logger.Info("Shutting down Email Worker Service")

	// Stop processor
	if err := a.emailProcessor.Stop(); err != nil {
		a.logger.Error("Error stopping processor", zap.Error(err))
	}

	// Close queue
	if err := a.queueInstance.Close(); err != nil {
		a.logger.Error("Error closing queue", zap.Error(err))
	}

	// Close database
	if err := a.db.Close(); err != nil {
		a.logger.Error("Error closing database", zap.Error(err))
	}

	a.logger.Info("Email Worker Service stopped")
	return nil
}

// GetEmailProcessor returns the email processor instance
func (a *App) GetEmailProcessor() *processor.Processor {
	return a.emailProcessor
}

// GetLogger returns the logger instance
func (a *App) GetLogger() *zap.Logger {
	return a.logger
} 