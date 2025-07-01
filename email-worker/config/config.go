package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	App      AppConfig      `mapstructure:"app"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	Kafka    KafkaConfig    `mapstructure:"kafka"`
	GRPC     GRPCConfig     `mapstructure:"grpc"`
	Email    EmailConfig    `mapstructure:"email"`
	Metrics  MetricsConfig  `mapstructure:"metrics"`
	Retry    RetryConfig    `mapstructure:"retry"`
	Batch    BatchConfig    `mapstructure:"batch"`
}

// AppConfig holds application-level configuration
type AppConfig struct {
	Name            string        `mapstructure:"name"`
	Environment     string        `mapstructure:"environment"`
	LogLevel        string        `mapstructure:"log_level"`
	ShutdownTimeout time.Duration `mapstructure:"shutdown_timeout"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	Name            string        `mapstructure:"name"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	SSLMode         string        `mapstructure:"ssl_mode"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
	PoolSize int    `mapstructure:"pool_size"`
}

// KafkaConfig holds Kafka configuration
type KafkaConfig struct {
	Brokers         []string `mapstructure:"brokers"`
	GroupID         string   `mapstructure:"group_id"`
	TopicEmailJobs  string   `mapstructure:"topic_email_jobs"`
	TopicEmailEvents string  `mapstructure:"topic_email_events"`
	AutoOffsetReset string   `mapstructure:"auto_offset_reset"`
}

// GRPCConfig holds gRPC client configuration
type GRPCConfig struct {
	AuthService    string        `mapstructure:"auth_service"`
	UserService    string        `mapstructure:"user_service"`
	BookingService string        `mapstructure:"booking_service"`
	Timeout        time.Duration `mapstructure:"timeout"`
}

// EmailConfig holds email provider configuration
type EmailConfig struct {
	Provider string        `mapstructure:"provider"`
	From     string        `mapstructure:"from"`
	FromName string        `mapstructure:"from_name"`
	SendGrid SendGridConfig `mapstructure:"sendgrid"`
	SES      SESConfig     `mapstructure:"ses"`
	SMTP     SMTPConfig    `mapstructure:"smtp"`
}

// SendGridConfig holds SendGrid configuration
type SendGridConfig struct {
	APIKey string `mapstructure:"api_key"`
}

// SESConfig holds AWS SES configuration
type SESConfig struct {
	Region          string `mapstructure:"region"`
	AccessKeyID     string `mapstructure:"access_key_id"`
	SecretAccessKey string `mapstructure:"secret_access_key"`
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	TLS      bool   `mapstructure:"tls"`
}

// MetricsConfig holds metrics configuration
type MetricsConfig struct {
	Enabled bool `mapstructure:"enabled"`
	Port    int  `mapstructure:"port"`
}

// RetryConfig holds retry configuration
type RetryConfig struct {
	MaxAttempts        int           `mapstructure:"max_attempts"`
	Delay              time.Duration `mapstructure:"delay"`
	BackoffMultiplier  float64       `mapstructure:"backoff_multiplier"`
}

// BatchConfig holds batch processing configuration
type BatchConfig struct {
	Size              int           `mapstructure:"size"`
	Timeout           time.Duration `mapstructure:"timeout"`
	MaxConcurrentJobs int           `mapstructure:"max_concurrent_jobs"`
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	viper.SetConfigName("env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	// Set default values
	setDefaults()

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate configuration
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// setDefaults sets default values for configuration
func setDefaults() {
	// App defaults
	viper.SetDefault("app.name", "email-worker")
	viper.SetDefault("app.environment", "development")
	viper.SetDefault("app.log_level", "info")
	viper.SetDefault("app.shutdown_timeout", "30s")

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.name", "booking_system")
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.ssl_mode", "disable")
	viper.SetDefault("database.max_open_conns", 25)
	viper.SetDefault("database.max_idle_conns", 5)
	viper.SetDefault("database.conn_max_lifetime", "5m")

	// Redis defaults
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.db", 0)
	viper.SetDefault("redis.pool_size", 10)

	// Kafka defaults
	viper.SetDefault("kafka.brokers", []string{"localhost:9092"})
	viper.SetDefault("kafka.group_id", "email-worker")
	viper.SetDefault("kafka.topic_email_jobs", "email-jobs")
	viper.SetDefault("kafka.topic_email_events", "email-events")
	viper.SetDefault("kafka.auto_offset_reset", "earliest")

	// gRPC defaults
	viper.SetDefault("grpc.auth_service", "localhost:50051")
	viper.SetDefault("grpc.user_service", "localhost:50052")
	viper.SetDefault("grpc.booking_service", "localhost:50053")
	viper.SetDefault("grpc.timeout", "30s")

	// Email defaults
	viper.SetDefault("email.provider", "sendgrid")
	viper.SetDefault("email.from", "noreply@bookingsystem.com")
	viper.SetDefault("email.from_name", "Booking System")

	// Metrics defaults
	viper.SetDefault("metrics.enabled", true)
	viper.SetDefault("metrics.port", 9090)

	// Retry defaults
	viper.SetDefault("retry.max_attempts", 3)
	viper.SetDefault("retry.delay", "5s")
	viper.SetDefault("retry.backoff_multiplier", 2.0)

	// Batch defaults
	viper.SetDefault("batch.size", 100)
	viper.SetDefault("batch.timeout", "30s")
	viper.SetDefault("batch.max_concurrent_jobs", 10)
}

// validateConfig validates the configuration
func validateConfig(config *Config) error {
	if config.App.Name == "" {
		return fmt.Errorf("app name is required")
	}

	if config.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}

	if config.Database.Name == "" {
		return fmt.Errorf("database name is required")
	}

	if config.Email.Provider == "" {
		return fmt.Errorf("email provider is required")
	}

	return nil
} 