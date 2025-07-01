package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"booking-system/email-worker/config"
	"booking-system/email-worker/logging"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/services"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger := logging.NewLogger(cfg.LogLevel)
	logger.Info("Starting Email Worker service")

	// Initialize services
	svc, err := services.NewServices(cfg)
	if err != nil {
		logger.Fatal("Failed to initialize services", "error", err)
	}
	defer svc.Close()

	// Initialize processor
	proc := processor.NewProcessor(cfg, svc, logger)

	// Start processor
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		if err := proc.Start(ctx); err != nil {
			logger.Error("Processor failed", "error", err)
			cancel()
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	logger.Info("Shutting down Email Worker service")

	// Graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer shutdownCancel()

	if err := proc.Shutdown(shutdownCtx); err != nil {
		logger.Error("Error during shutdown", "error", err)
	}

	logger.Info("Email Worker service stopped")
} 