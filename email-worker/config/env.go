package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// GetEnv retrieves an environment variable with a fallback value
func GetEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// GetEnvInt retrieves an environment variable as integer with a fallback value
func GetEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return fallback
}

// GetEnvBool retrieves an environment variable as boolean with a fallback value
func GetEnvBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return fallback
}

// GetEnvDuration retrieves an environment variable as duration with a fallback value
func GetEnvDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}

// GetEnvFloat retrieves an environment variable as float64 with a fallback value
func GetEnvFloat(key string, fallback float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return fallback
}

// GetEnvSlice retrieves an environment variable as string slice with a fallback value
func GetEnvSlice(key string, fallback []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return fallback
}

// IsProduction checks if the environment is production
func IsProduction() bool {
	return GetEnv("APP_ENV", "development") == "production"
}

// IsDevelopment checks if the environment is development
func IsDevelopment() bool {
	return GetEnv("APP_ENV", "development") == "development"
}

// IsTest checks if the environment is test
func IsTest() bool {
	return GetEnv("APP_ENV", "development") == "test"
} 