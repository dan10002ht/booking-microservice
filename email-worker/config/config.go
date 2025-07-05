package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the email worker
type Config struct {
	Queue    QueueConfig    `mapstructure:"queue"`
	Database DatabaseConfig `mapstructure:"database"`
	Worker   WorkerConfig   `mapstructure:"worker"`
	Server   ServerConfig   `mapstructure:"server"`
	Email    EmailConfig    `mapstructure:"email"`
	Logging  LoggingConfig  `mapstructure:"logging"`
}

// QueueConfig holds queue configuration
type QueueConfig struct {
	Type         string        `mapstructure:"type"`
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Password     string        `mapstructure:"password"`
	Database     int           `mapstructure:"database"`
	QueueName    string        `mapstructure:"queue_name"`
	BatchSize    int           `mapstructure:"batch_size"`
	PollInterval time.Duration `mapstructure:"poll_interval"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	// Master database configuration
	MasterHost     string        `mapstructure:"master_host"`
	MasterPort     int           `mapstructure:"master_port"`
	MasterName     string        `mapstructure:"master_name"`
	MasterUser     string        `mapstructure:"master_user"`
	MasterPassword string        `mapstructure:"master_password"`
	
	// Slave database configuration (for read operations)
	SlaveHost      string        `mapstructure:"slave_host"`
	SlavePort      int           `mapstructure:"slave_port"`
	SlaveName      string        `mapstructure:"slave_name"`
	SlaveUser      string        `mapstructure:"slave_user"`
	SlavePassword  string        `mapstructure:"slave_password"`
	
	// Legacy single database configuration (for backward compatibility)
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	Name            string        `mapstructure:"name"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	
	// Common configuration
	SSLMode         string        `mapstructure:"ssl_mode"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

// WorkerConfig holds worker configuration
type WorkerConfig struct {
	WorkerCount     int           `mapstructure:"worker_count"`
	BatchSize       int           `mapstructure:"batch_size"`
	PollInterval    time.Duration `mapstructure:"poll_interval"`
	MaxRetries      int           `mapstructure:"max_retries"`
	RetryDelay      time.Duration `mapstructure:"retry_delay"`
	ProcessTimeout  time.Duration `mapstructure:"process_timeout"`
	CleanupInterval time.Duration `mapstructure:"cleanup_interval"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port     int `mapstructure:"port"`
	GRPCPort int `mapstructure:"grpc_port"`
}

// EmailConfig holds email configuration
type EmailConfig struct {
	DefaultProvider string                    `mapstructure:"default_provider"`
	Providers       map[string]ProviderConfig `mapstructure:"providers"`
}

// ProviderConfig holds email provider configuration
type ProviderConfig struct {
	// SendGrid
	APIKey string `mapstructure:"api_key"`
	
	// AWS SES
	Region      string `mapstructure:"region"`
	AccessKey   string `mapstructure:"access_key"`
	SecretKey   string `mapstructure:"secret_key"`
	FromEmail   string `mapstructure:"from_email"`
	FromName    string `mapstructure:"from_name"`
	
	// SMTP
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	UseTLS   bool   `mapstructure:"use_tls"`
}

// LoggingConfig holds logging configuration
type LoggingConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	OutputPath string `mapstructure:"output_path"`
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	viper.SetConfigName("env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	// Set default values
	setDefaults()

	// Bind environment variables
	bindEnvVars()

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
	viper.SetDefault("logging.level", "info")

	// Database defaults
	viper.SetDefault("database.master_host", "localhost")
	viper.SetDefault("database.master_port", 5432)
	viper.SetDefault("database.master_name", "booking_system")
	viper.SetDefault("database.master_user", "postgres")
	viper.SetDefault("database.master_password", "postgres")
	viper.SetDefault("database.slave_host", "localhost")
	viper.SetDefault("database.slave_port", 5433)
	viper.SetDefault("database.slave_name", "booking_system_slave")
	viper.SetDefault("database.slave_user", "postgres")
	viper.SetDefault("database.slave_password", "postgres")
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

	// Server defaults
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.grpc_port", 50060)

	// gRPC defaults
	viper.SetDefault("grpc.auth_service", "localhost:50051")
	viper.SetDefault("grpc.user_service", "localhost:50052")
	viper.SetDefault("grpc.booking_service", "localhost:50053")
	viper.SetDefault("grpc.timeout", "30s")

	// Email defaults
	viper.SetDefault("email.default_provider", "sendgrid")

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

// bindEnvVars binds environment variables to configuration
func bindEnvVars() {
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
	
	// Common database settings
	viper.BindEnv("database.max_open_conns", "DB_MAX_OPEN_CONNS")
	viper.BindEnv("database.max_idle_conns", "DB_MAX_IDLE_CONNS")
	viper.BindEnv("database.conn_max_lifetime", "DB_CONN_MAX_LIFETIME")
	
	// Queue settings
	viper.BindEnv("queue.host", "REDIS_HOST")
	viper.BindEnv("queue.port", "REDIS_PORT")
	viper.BindEnv("queue.password", "REDIS_PASSWORD")
	viper.BindEnv("queue.database", "REDIS_DB")
	viper.BindEnv("queue.queue_name", "QUEUE_NAME")
	
	// Server settings
	viper.BindEnv("server.port", "PORT")
	viper.BindEnv("server.grpc_port", "GRPC_PORT")
	
	// Email settings
	viper.BindEnv("email.default_provider", "EMAIL_PROVIDER")
	viper.BindEnv("email.providers.sendgrid.api_key", "EMAIL_API_KEY")
	viper.BindEnv("email.providers.sendgrid.from_email", "EMAIL_FROM")
	
	// Worker settings
	viper.BindEnv("worker.worker_count", "WORKER_COUNT")
	viper.BindEnv("worker.batch_size", "BATCH_SIZE")
	viper.BindEnv("worker.max_retries", "MAX_RETRIES")
}

// validateConfig validates the configuration
func validateConfig(config *Config) error {
	// Check if master-slave configuration is provided
	if config.Database.MasterHost != "" {
		// Master-slave configuration
		if config.Database.MasterName == "" {
			return fmt.Errorf("master database name is required")
		}
		if config.Database.SlaveHost != "" && config.Database.SlaveName == "" {
			return fmt.Errorf("slave database name is required when slave host is provided")
		}
	} else if config.Database.Host != "" {
		// Legacy single database configuration
		if config.Database.Name == "" {
			return fmt.Errorf("database name is required")
		}
	} else {
		return fmt.Errorf("either master database host or legacy database host is required")
	}

	if config.Email.DefaultProvider == "" {
		return fmt.Errorf("email default provider is required")
	}

	return nil
} 