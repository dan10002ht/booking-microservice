package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"booking-system/email-worker/config"
)

// DB wraps sqlx.DB for convenience with master-slave support
type DB struct {
	Master *sqlx.DB
	Slave  *sqlx.DB
}

// NewConnection creates a new database connection using sqlx with master-slave support
func NewConnection(cfg config.DatabaseConfig) (*DB, error) {
	var masterDB, slaveDB *sqlx.DB
	var err error

	// Connect to master database
	if cfg.MasterHost != "" {
		// Master-slave configuration
		masterDSN := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			cfg.MasterHost, cfg.MasterPort, cfg.MasterUser, cfg.MasterPassword, cfg.MasterName, cfg.SSLMode,
		)

		masterDB, err = sqlx.Connect("postgres", masterDSN)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to master database: %w", err)
		}

		// Configure master connection pool
		configureConnectionPool(masterDB, cfg)

		// Test master connection
		if err := masterDB.Ping(); err != nil {
			return nil, fmt.Errorf("failed to ping master database: %w", err)
		}

		// Connect to slave database if configured
		if cfg.SlaveHost != "" {
			slaveDSN := fmt.Sprintf(
				"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
				cfg.SlaveHost, cfg.SlavePort, cfg.SlaveUser, cfg.SlavePassword, cfg.SlaveName, cfg.SSLMode,
			)

			slaveDB, err = sqlx.Connect("postgres", slaveDSN)
			if err != nil {
				// Log warning but don't fail - slave is optional
				fmt.Printf("Warning: failed to connect to slave database: %v\n", err)
				slaveDB = nil
			} else {
				// Configure slave connection pool
				configureConnectionPool(slaveDB, cfg)

				// Test slave connection
				if err := slaveDB.Ping(); err != nil {
					fmt.Printf("Warning: failed to ping slave database: %v\n", err)
					slaveDB = nil
				}
			}
		}
	} else if cfg.Host != "" {
		// Legacy single database configuration
		dsn := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
		)

		masterDB, err = sqlx.Connect("postgres", dsn)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to database: %w", err)
		}

		// Configure connection pool
		configureConnectionPool(masterDB, cfg)

		// Test the connection
		if err := masterDB.Ping(); err != nil {
			return nil, fmt.Errorf("failed to ping database: %w", err)
		}
	} else {
		return nil, fmt.Errorf("no database configuration provided")
	}

	return &DB{
		Master: masterDB,
		Slave:  slaveDB,
	}, nil
}

// configureConnectionPool configures the connection pool settings
func configureConnectionPool(db *sqlx.DB, cfg config.DatabaseConfig) {
	maxOpenConns := cfg.MaxOpenConns
	if maxOpenConns == 0 {
		maxOpenConns = 25
	}
	
	maxIdleConns := cfg.MaxIdleConns
	if maxIdleConns == 0 {
		maxIdleConns = 5
	}
	
	connMaxLifetime := cfg.ConnMaxLifetime
	if connMaxLifetime == 0 {
		connMaxLifetime = 5 * time.Minute
	}

	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxIdleConns)
	db.SetConnMaxLifetime(connMaxLifetime)
}

// Close closes all database connections
func (db *DB) Close() error {
	var masterErr, slaveErr error

	if db.Master != nil {
		masterErr = db.Master.Close()
	}

	if db.Slave != nil {
		slaveErr = db.Slave.Close()
	}

	if masterErr != nil {
		return fmt.Errorf("failed to close master database: %w", masterErr)
	}

	if slaveErr != nil {
		return fmt.Errorf("failed to close slave database: %w", slaveErr)
	}

	return nil
}

// GetDB returns the master database for write operations
func (db *DB) GetDB() *sqlx.DB {
	return db.Master
}

// GetSlaveDB returns the slave database for read operations
func (db *DB) GetSlaveDB() *sqlx.DB {
	if db.Slave != nil {
		return db.Slave
	}
	// Fallback to master if slave is not available
	return db.Master
}

// GetSQLDB returns the underlying sql.DB for compatibility
func (db *DB) GetSQLDB() *sql.DB {
	return db.Master.DB
}

// QueryRowContext executes a query that returns a single row using master database
func (db *DB) QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row {
	return db.Master.QueryRowContext(ctx, query, args...)
}

// QueryRowContext executes a query that returns a single row using slave database for reads
func (db *DB) QueryRowContextSlave(ctx context.Context, query string, args ...any) *sql.Row {
	return db.GetSlaveDB().QueryRowContext(ctx, query, args...)
}

// GetContext executes a query that returns a single row using slave database for reads
func (db *DB) GetContext(ctx context.Context, dest any, query string, args ...any) error {
	return db.GetSlaveDB().GetContext(ctx, dest, query, args...)
}

// SelectContext executes a query that returns multiple rows using slave database for reads
func (db *DB) SelectContext(ctx context.Context, dest any, query string, args ...any) error {
	return db.GetSlaveDB().SelectContext(ctx, dest, query, args...)
}

// ExecContext executes a query that doesn't return rows using master database for writes
func (db *DB) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	return db.Master.ExecContext(ctx, query, args...)
} 