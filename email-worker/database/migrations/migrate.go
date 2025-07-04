package migrations

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Migration represents a database migration
type Migration struct {
	ID          string
	Description string
	SQL         string
}

// MigrationRunner handles database migrations
type MigrationRunner struct {
	db *sql.DB
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(db *sql.DB) *MigrationRunner {
	return &MigrationRunner{db: db}
}

// RunMigrations runs all pending migrations
func (mr *MigrationRunner) RunMigrations(migrationsDir string) error {
	// Create migrations table if it doesn't exist
	if err := mr.createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get list of migration files
	migrationFiles, err := mr.getMigrationFiles(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := mr.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Run pending migrations
	for _, migration := range migrationFiles {
		if !appliedMigrations[migration.ID] {
			if err := mr.runMigration(migration); err != nil {
				return fmt.Errorf("failed to run migration %s: %w", migration.ID, err)
			}
			log.Printf("Applied migration: %s - %s", migration.ID, migration.Description)
		}
	}

	return nil
}

// createMigrationsTable creates the migrations tracking table
func (mr *MigrationRunner) createMigrationsTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS migrations (
			id VARCHAR(255) PRIMARY KEY,
			description TEXT,
			applied_at TIMESTAMP DEFAULT NOW()
		);
	`
	_, err := mr.db.Exec(query)
	return err
}

// getMigrationFiles reads migration files from the migrations directory
func (mr *MigrationRunner) getMigrationFiles(migrationsDir string) ([]Migration, error) {
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		return nil, err
	}

	var migrations []Migration
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		// Parse migration ID from filename (e.g., "001_initial_schema.sql" -> "001")
		baseName := strings.TrimSuffix(file.Name(), ".sql")
		parts := strings.Split(baseName, "_")
		if len(parts) < 2 {
			continue
		}
		migrationID := parts[0]

		// Read SQL content
		content, err := ioutil.ReadFile(filepath.Join(migrationsDir, file.Name()))
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", file.Name(), err)
		}

		// Extract description from SQL comment
		description := mr.extractDescription(string(content))

		migrations = append(migrations, Migration{
			ID:          migrationID,
			Description: description,
			SQL:         string(content),
		})
	}

	// Sort migrations by ID
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].ID < migrations[j].ID
	})

	return migrations, nil
}

// extractDescription extracts description from SQL comment
func (mr *MigrationRunner) extractDescription(sql string) string {
	lines := strings.Split(sql, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "-- Description:") {
			return strings.TrimSpace(strings.TrimPrefix(line, "-- Description:"))
		}
	}
	return "No description"
}

// getAppliedMigrations returns a map of applied migration IDs
func (mr *MigrationRunner) getAppliedMigrations() (map[string]bool, error) {
	query := `SELECT id FROM migrations`
	rows, err := mr.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		applied[id] = true
	}

	return applied, nil
}

// runMigration executes a single migration
func (mr *MigrationRunner) runMigration(migration Migration) error {
	// Start transaction
	tx, err := mr.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Execute migration SQL
	if _, err := tx.Exec(migration.SQL); err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record migration as applied
	recordQuery := `INSERT INTO migrations (id, description) VALUES ($1, $2)`
	if _, err := tx.Exec(recordQuery, migration.ID, migration.Description); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// Commit transaction
	return tx.Commit()
}

// GetMigrationsDir returns the migrations directory path
func GetMigrationsDir() string {
	// Get current working directory
	wd, err := os.Getwd()
	if err != nil {
		return "database/migrations"
	}

	// Try to find migrations directory
	possiblePaths := []string{
		filepath.Join(wd, "database", "migrations"),
		filepath.Join(wd, "..", "database", "migrations"),
		"database/migrations",
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	return "database/migrations"
} 