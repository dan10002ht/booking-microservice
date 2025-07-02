package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"go.uber.org/zap"

	"booking-system/email-worker/models"
)

// EmailTemplateRepository handles database operations for email templates
type EmailTemplateRepository struct {
	db     *sql.DB
	logger *zap.Logger
}

// NewEmailTemplateRepository creates a new EmailTemplateRepository
func NewEmailTemplateRepository(db *sql.DB, logger *zap.Logger) *EmailTemplateRepository {
	return &EmailTemplateRepository{
		db:     db,
		logger: logger,
	}
}

// Create creates a new email template
func (r *EmailTemplateRepository) Create(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		INSERT INTO email_templates (
			id, name, subject, html_template, text_template, variables, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.db.ExecContext(ctx, query,
		template.ID, template.Name, template.Subject, template.HTMLTemplate,
		template.TextTemplate, template.Variables, template.IsActive,
		template.CreatedAt, template.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create email template: %w", err)
	}

	r.logger.Info("Email template created",
		zap.String("template_id", template.ID),
		zap.String("name", template.Name),
	)

	return nil
}

// GetByID retrieves an email template by ID
func (r *EmailTemplateRepository) GetByID(ctx context.Context, id string) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables, is_active, created_at, updated_at
		FROM email_templates WHERE id = $1
	`

	var template models.EmailTemplate
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID, &template.Name, &template.Subject, &template.HTMLTemplate,
		&template.TextTemplate, &template.Variables, &template.IsActive,
		&template.CreatedAt, &template.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("email template not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get email template: %w", err)
	}

	return &template, nil
}

// Update updates an email template
func (r *EmailTemplateRepository) Update(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		UPDATE email_templates 
		SET name = $1, subject = $2, html_template = $3, text_template = $4, 
		    variables = $5, is_active = $6, updated_at = $7
		WHERE id = $8
	`

	result, err := r.db.ExecContext(ctx, query,
		template.Name, template.Subject, template.HTMLTemplate, template.TextTemplate,
		template.Variables, template.IsActive, template.UpdatedAt, template.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update email template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email template not found: %s", template.ID)
	}

	r.logger.Info("Email template updated",
		zap.String("template_id", template.ID),
		zap.String("name", template.Name),
	)

	return nil
}

// Delete deletes an email template
func (r *EmailTemplateRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM email_templates WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete email template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email template not found: %s", id)
	}

	r.logger.Info("Email template deleted",
		zap.String("template_id", id),
	)

	return nil
}

// List retrieves all email templates
func (r *EmailTemplateRepository) List(ctx context.Context, activeOnly bool) ([]*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables, is_active, created_at, updated_at
		FROM email_templates
	`
	
	if activeOnly {
		query += " WHERE is_active = true"
	}
	
	query += " ORDER BY name ASC"

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list email templates: %w", err)
	}
	defer rows.Close()

	var templates []*models.EmailTemplate
	for rows.Next() {
		var template models.EmailTemplate
		err := rows.Scan(
			&template.ID, &template.Name, &template.Subject, &template.HTMLTemplate,
			&template.TextTemplate, &template.Variables, &template.IsActive,
			&template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		templates = append(templates, &template)
	}

	return templates, nil
}

// SetActive sets the active status of a template
func (r *EmailTemplateRepository) SetActive(ctx context.Context, id string, isActive bool) error {
	query := `
		UPDATE email_templates 
		SET is_active = $1, updated_at = $2
		WHERE id = $3
	`

	result, err := r.db.ExecContext(ctx, query, isActive, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to set template active status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email template not found: %s", id)
	}

	r.logger.Info("Email template active status updated",
		zap.String("template_id", id),
		zap.Bool("is_active", isActive),
	)

	return nil
} 