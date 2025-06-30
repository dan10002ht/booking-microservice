package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"email-worker/config"
	"email-worker/database"
	"email-worker/grpcclient"
	"email-worker/metrics"
	"email-worker/queue"
	"email-worker/services"
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

	log.Info().Msg("Starting Email Worker Service...")

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

	// Start email processor
	processor := NewEmailProcessor(services, metrics)
	
	// Start processing in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go processor.Start(ctx)

	log.Info().Msg("Email Worker Service started successfully")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down Email Worker Service...")

	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	processor.Stop(shutdownCtx)

	log.Info().Msg("Email Worker Service stopped")
}

type EmailProcessor struct {
	services *services.Services
	metrics  *metrics.Metrics
	stopChan chan struct{}
}

func NewEmailProcessor(services *services.Services, metrics *metrics.Metrics) *EmailProcessor {
	return &EmailProcessor{
		services: services,
		metrics:  metrics,
		stopChan: make(chan struct{}),
	}
}

func (p *EmailProcessor) Start(ctx context.Context) {
	log.Info().Msg("Starting email processing...")

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Context cancelled, stopping email processor")
			return
		case <-p.stopChan:
			log.Info().Msg("Stop signal received, stopping email processor")
			return
		default:
			// Process email jobs
			p.processEmailJobs()
			time.Sleep(100 * time.Millisecond) // Avoid busy waiting
		}
	}
}

func (p *EmailProcessor) Stop(ctx context.Context) {
	close(p.stopChan)
	
	// Wait for processing to complete
	select {
	case <-ctx.Done():
		log.Warn().Msg("Shutdown timeout reached")
	case <-time.After(5 * time.Second):
		log.Info().Msg("Email processor stopped gracefully")
	}
}

func (p *EmailProcessor) processEmailJobs() {
	// Read message from Kafka
	ctx := context.Background()
	msg, err := p.services.Kafka.ReadMessage(ctx)
	if err != nil {
		// No messages available, continue
		return
	}

	log.Info().
		Str("topic", msg.Topic).
		Str("key", string(msg.Key)).
		Int("value_length", len(msg.Value)).
		Msg("Processing email job")

	// Process the email job
	// TODO: Implement email processing logic
	
	// Update metrics
	p.metrics.EmailJobsProcessed.Inc()
} 