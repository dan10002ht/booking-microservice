package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"

	"booking-system/email-worker/internal/app"
	"booking-system/email-worker/internal/config"
	"booking-system/email-worker/internal/logger"
	"booking-system/email-worker/internal/server"
)

func main() {
	// Initialize logger
	loggerInstance, err := logger.InitLogger()
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer loggerInstance.Sync()

	loggerInstance.Info("Starting Email Worker Service")

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		loggerInstance.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Initialize application
	appInstance := app.NewApp(loggerInstance, cfg)
	if err := appInstance.Initialize(); err != nil {
		loggerInstance.Fatal("Failed to initialize application", zap.Error(err))
	}

	// Initialize HTTP server
	httpServer := server.NewServer(loggerInstance, appInstance.GetEmailProcessor(), cfg.Server.Port)
	httpServer.Initialize()

	// Start HTTP server in background
	go func() {
		if err := httpServer.Start(); err != nil {
			loggerInstance.Fatal("Failed to start HTTP server", zap.Error(err))
		}
	}()

	// TODO: Initialize and start gRPC server
	// grpcServer := grpc.NewServer(appInstance.GetEmailProcessor(), cfg, loggerInstance)
	// go func() {
	// 	if err := grpcServer.Start(cfg.Server.GRPCPort); err != nil {
	// 		loggerInstance.Fatal("Failed to start gRPC server", zap.Error(err))
	// 	}
	// }()

	// Start Prometheus metrics server in background
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		if err := http.ListenAndServe(":2112", nil); err != nil {
			loggerInstance.Error("Failed to start metrics server", zap.Error(err))
		}
	}()

	// Run the application (this will block until shutdown signal)
	if err := appInstance.Run(); err != nil {
		loggerInstance.Fatal("Application error", zap.Error(err))
	}
} 