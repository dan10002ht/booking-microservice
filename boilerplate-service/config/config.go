package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Kafka    KafkaConfig
	GRPC     GRPCConfig
	LogLevel string
}

type ServerConfig struct {
	Port int
}

type DatabaseConfig struct {
	Host     string
	Port     int
	Name     string
	User     string
	Password string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type KafkaConfig struct {
	BootstrapServers string
	GroupID          string
	Topics           map[string]string
}

type GRPCConfig struct {
	AuthServiceURL     string
	UserServiceURL     string
	BookingServiceURL  string
	MaxReceiveMsgSize  int
	MaxSendMsgSize     int
	KeepaliveTimeMs    int
	KeepaliveTimeoutMs int
}

func Load() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: getEnvAsInt("SERVER_PORT", 8080),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			Name:     getEnv("DB_NAME", "boilerplate_db"),
			User:     getEnv("DB_USER", "boilerplate_user"),
			Password: getEnv("DB_PASSWORD", "boilerplate_password"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Kafka: KafkaConfig{
			BootstrapServers: getEnv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
			GroupID:          getEnv("KAFKA_GROUP_ID", "boilerplate-service"),
			Topics: map[string]string{
				"events": getEnv("KAFKA_TOPIC_EVENTS", "events"),
				"jobs":   getEnv("KAFKA_TOPIC_JOBS", "jobs"),
			},
		},
		GRPC: GRPCConfig{
			AuthServiceURL:     getEnv("GRPC_AUTH_SERVICE_URL", "auth-service:50051"),
			UserServiceURL:     getEnv("GRPC_USER_SERVICE_URL", "user-service:50052"),
			BookingServiceURL:  getEnv("GRPC_BOOKING_SERVICE_URL", "booking-service:50053"),
			MaxReceiveMsgSize:  getEnvAsInt("GRPC_MAX_RECEIVE_MESSAGE_SIZE", 4194304),
			MaxSendMsgSize:     getEnvAsInt("GRPC_MAX_SEND_MESSAGE_SIZE", 4194304),
			KeepaliveTimeMs:    getEnvAsInt("GRPC_KEEPALIVE_TIME_MS", 30000),
			KeepaliveTimeoutMs: getEnvAsInt("GRPC_KEEPALIVE_TIMEOUT_MS", 5000),
		},
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
} 