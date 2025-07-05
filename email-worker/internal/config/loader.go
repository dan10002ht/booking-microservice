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
	viper.SetDefault("queue.port", 56379)
	viper.SetDefault("queue.database", 0)
	viper.SetDefault("queue.queue_name", "email-jobs")
	viper.SetDefault("queue.batch_size", 10)
	viper.SetDefault("queue.poll_interval", "1s")

	// Database defaults - Master-slave configuration
	viper.SetDefault("database.master_host", "localhost")
	viper.SetDefault("database.master_port", 55435)
	viper.SetDefault("database.master_name", "booking_system")
	viper.SetDefault("database.master_user", "booking_user")
	viper.SetDefault("database.master_password", "booking_pass")
	viper.SetDefault("database.slave_host", "localhost")
	viper.SetDefault("database.slave_port", 55436)
	viper.SetDefault("database.slave_name", "booking_system")
	viper.SetDefault("database.slave_user", "booking_user")
	viper.SetDefault("database.slave_password", "booking_pass")
	
	// Legacy database defaults (for backward compatibility)
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 55435)
	viper.SetDefault("database.name", "booking_system")
	viper.SetDefault("database.user", "booking_user")
	viper.SetDefault("database.password", "booking_pass")
	viper.SetDefault("database.ssl_mode", "disable")
	viper.SetDefault("database.max_open_conns", 25)
	viper.SetDefault("database.max_idle_conns", 5)
	viper.SetDefault("database.conn_max_lifetime", "5m")

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
	viper.SetDefault("server.grpc_port", 50060)

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

	// Master database
	viper.BindEnv("database.master_host", "DB_MASTER_HOST")
	viper.BindEnv("database.master_port", "DB_MASTER_PORT")
	viper.BindEnv("database.master_name", "DB_MASTER_NAME")
	viper.BindEnv("database.master_user", "DB_MASTER_USER")
	viper.BindEnv("database.master_password", "DB_MASTER_PASSWORD")
	
	// Slave database
	viper.BindEnv("database.slave_host", "DB_SLAVE_HOST")
	viper.BindEnv("database.slave_port", "DB_SLAVE_PORT")
	viper.BindEnv("database.slave_name", "DB_SLAVE_NAME")
	viper.BindEnv("database.slave_user", "DB_SLAVE_USER")
	viper.BindEnv("database.slave_password", "DB_SLAVE_PASSWORD")
	
	// Legacy database (for backward compatibility)
	viper.BindEnv("database.host", "DB_HOST")
	viper.BindEnv("database.port", "DB_PORT")
	viper.BindEnv("database.name", "DB_NAME")
	viper.BindEnv("database.user", "DB_USER")
	viper.BindEnv("database.password", "DB_PASSWORD")
	viper.BindEnv("database.ssl_mode", "DB_SSL_MODE")
	viper.BindEnv("database.max_open_conns", "DB_MAX_OPEN_CONNS")
	viper.BindEnv("database.max_idle_conns", "DB_MAX_IDLE_CONNS")
	viper.BindEnv("database.conn_max_lifetime", "DB_CONN_MAX_LIFETIME")

	// Worker
	viper.BindEnv("worker.worker_count", "WORKER_COUNT")
	viper.BindEnv("worker.batch_size", "BATCH_SIZE")
	viper.BindEnv("worker.max_retries", "MAX_RETRIES")

	// Server
	viper.BindEnv("server.port", "PORT")
	viper.BindEnv("server.grpc_port", "GRPC_PORT")

	// Email providers
	viper.BindEnv("email.default_provider", "EMAIL_PROVIDER")
	viper.BindEnv("email.providers.sendgrid.api_key", "EMAIL_API_KEY")
	viper.BindEnv("email.providers.sendgrid.from_email", "EMAIL_FROM")
	viper.BindEnv("email.providers.ses.region", "AWS_SES_REGION")
	viper.BindEnv("email.providers.ses.access_key", "AWS_ACCESS_KEY_ID")
	viper.BindEnv("email.providers.ses.secret_key", "AWS_SECRET_ACCESS_KEY")
	viper.BindEnv("email.providers.smtp.host", "SMTP_HOST")
	viper.BindEnv("email.providers.smtp.port", "SMTP_PORT")
	viper.BindEnv("email.providers.smtp.username", "SMTP_USERNAME")
	viper.BindEnv("email.providers.smtp.password", "SMTP_PASSWORD")
} 