package logger

import (
	"fmt"
	"os"

	"go.uber.org/zap"
)

// InitLogger initializes the logger
func InitLogger() (*zap.Logger, error) {
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