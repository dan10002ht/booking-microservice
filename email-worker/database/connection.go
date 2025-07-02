package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"booking-system/email-worker/config"

	_ "github.com/lib/pq"
	"go.uber.org/zap"
)

// Connection represents a database connection
type Connection struct {
	DB *sql.DB
}

// NewConnection creates a new database connection
func NewConnection(cfg config.DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.Name, cfg.User, cfg.Password, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// NewConnectionWithLogger creates a new database connection with logging
func NewConnectionWithLogger(cfg config.DatabaseConfig, logger *zap.Logger) (*sql.DB, error) {
	logger.Info("Connecting to database",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
		zap.String("database", cfg.Name),
		zap.String("user", cfg.User),
		zap.String("ssl_mode", cfg.SSLMode),
	)

	db, err := NewConnection(cfg)
	if err != nil {
		logger.Error("Failed to connect to database", zap.Error(err))
		return nil, err
	}

	logger.Info("Successfully connected to database")

	return db, nil
}

// HealthCheck checks if the database is healthy
func HealthCheck(db *sql.DB) error {
	return db.Ping()
}

// Close closes the database connection
func Close(db *sql.DB) error {
	return db.Close()
}

// Ping checks if the database is accessible
func (c *Connection) Ping() error {
	return c.DB.Ping()
}

// Stats returns database connection statistics
func (c *Connection) Stats() sql.DBStats {
	return c.DB.Stats()
}

// Begin starts a new transaction
func (c *Connection) Begin() (*sql.Tx, error) {
	return c.DB.Begin()
}

// BeginTx starts a new transaction with context
func (c *Connection) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return c.DB.BeginTx(ctx, nil)
} 