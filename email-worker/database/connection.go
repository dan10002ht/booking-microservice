package database

import (
	"context"
	"database/sql"
	"fmt"

	"booking-system/email-worker/config"

	_ "github.com/lib/pq"
)

// Connection represents a database connection
type Connection struct {
	DB *sql.DB
}

// NewConnection creates a new database connection
func NewConnection(cfg config.DatabaseConfig) (*Connection, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Connection{DB: db}, nil
}

// Close closes the database connection
func (c *Connection) Close() error {
	return c.DB.Close()
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