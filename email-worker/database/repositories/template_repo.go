package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"booking-system/email-worker/database/models"
)

// EmailTemplateRepository handles database operations for email templates
type EmailTemplateRepository struct {
	db *sql.DB
}

// NewEmailTemplateRepository creates a new email template repository
func NewEmailTemplateRepository(db *sql.DB) *EmailTemplateRepository {
	return &EmailTemplateRepository{db: db}
}

// GetByName retrieves a template by name
func (r *EmailTemplateRepository) GetByName(ctx context.Context, name string) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at
		FROM email_templates WHERE name = $1 AND is_active = true
	`

	template := &models.EmailTemplate{}
	err := r.db.QueryRowContext(ctx, query, name).Scan(
		&template.ID, &template.Name, &template.Subject, &template.HTMLContent, &template.TextContent,
		&template.Variables, &template.IsActive, &template.CreatedAt, &template.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template not found: %s", name)
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	return template, nil
}

// GetByID retrieves a template by ID
func (r *EmailTemplateRepository) GetByID(ctx context.Context, id int64) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at
		FROM email_templates WHERE id = $1
	`

	template := &models.EmailTemplate{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID, &template.Name, &template.Subject, &template.HTMLContent, &template.TextContent,
		&template.Variables, &template.IsActive, &template.CreatedAt, &template.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	return template, nil
}

// ListActive retrieves all active templates
func (r *EmailTemplateRepository) ListActive(ctx context.Context) ([]*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at
		FROM email_templates WHERE is_active = true
		ORDER BY name ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list templates: %w", err)
	}
	defer rows.Close()

	var templates []*models.EmailTemplate
	for rows.Next() {
		template := &models.EmailTemplate{}
		err := rows.Scan(
			&template.ID, &template.Name, &template.Subject, &template.HTMLContent, &template.TextContent,
			&template.Variables, &template.IsActive, &template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// Create creates a new template
func (r *EmailTemplateRepository) Create(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		INSERT INTO email_templates (name, subject, html_content, text_content, variables, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		template.Name, template.Subject, template.HTMLContent, template.TextContent,
		template.Variables, template.IsActive,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create template: %w", err)
	}

	return nil
}

// Update updates an existing template
func (r *EmailTemplateRepository) Update(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		UPDATE email_templates 
		SET name = $2, subject = $3, html_content = $4, text_content = $5, 
		    variables = $6, is_active = $7, updated_at = $8
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query,
		template.ID, template.Name, template.Subject, template.HTMLContent, template.TextContent,
		template.Variables, template.IsActive, template.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("template not found: %d", template.ID)
	}

	return nil
}

// Delete deletes a template
func (r *EmailTemplateRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM email_templates WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("template not found: %d", id)
	}

	return nil
}

// Exists checks if a template exists by name
func (r *EmailTemplateRepository) Exists(ctx context.Context, name string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM email_templates WHERE name = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, name).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check template existence: %w", err)
	}

	return exists, nil
} 