package database

import (
	"database/sql"
	"fmt"

	"boilerplate-service/config"

	_ "github.com/lib/pq"
)

type Database struct {
	*sql.DB
}

func NewConnection(cfg config.DatabaseConfig) (*Database, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return &Database{db}, nil
}

func (db *Database) Close() error {
	return db.DB.Close()
} 