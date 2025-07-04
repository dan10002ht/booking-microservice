package config

import (
	"fmt"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"

	"booking-system/email-worker/config"
)

// LoadConfig loads configuration from environment variables and config files
func LoadConfig() (*config.Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		// Ignore error if .env file doesn't exist
		fmt.Printf("Warning: .env file not found: %v\n", err)
	}

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