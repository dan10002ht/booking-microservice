package repositories

import (
	"context"
	"fmt"

	"booking-system/email-worker/database"
	"booking-system/email-worker/database/models"
)

// EmailTemplateRepository handles database operations for email templates
type EmailTemplateRepository struct {
	db *database.DB
}

// NewEmailTemplateRepository creates a new email template repository
func NewEmailTemplateRepository(db *database.DB) *EmailTemplateRepository {
	return &EmailTemplateRepository{db: db}
}

// Create creates a new email template
func (r *EmailTemplateRepository) Create(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		INSERT INTO email_templates (
			id, name, subject, html_template, text_template, variables, is_active
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		template.ID, template.Name, template.Subject, template.HTMLTemplate,
		template.TextTemplate, template.Variables, template.IsActive,
	).Scan(&template.CreatedAt, &template.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create email template: %w", err)
	}

	return nil
}

// GetByID retrieves an email template by ID
func (r *EmailTemplateRepository) GetByID(ctx context.Context, id string) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables,
		       is_active, created_at, updated_at
		FROM email_templates 
		WHERE id = $1
	`

	var template models.EmailTemplate
	err := r.db.GetContext(ctx, &template, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get email template: %w", err)
	}

	return &template, nil
}

// Update updates an email template
func (r *EmailTemplateRepository) Update(ctx context.Context, template *models.EmailTemplate) error {
	query := `
		UPDATE email_templates 
		SET name = $2, subject = $3, html_template = $4, text_template = $5,
		    variables = $6, is_active = $7, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		template.ID, template.Name, template.Subject, template.HTMLTemplate,
		template.TextTemplate, template.Variables, template.IsActive,
	).Scan(&template.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update email template: %w", err)
	}

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

	return nil
}

// List retrieves email templates with pagination
func (r *EmailTemplateRepository) List(ctx context.Context, limit, offset int) ([]*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables,
		       is_active, created_at, updated_at
		FROM email_templates 
		ORDER BY name ASC
		LIMIT $1 OFFSET $2
	`

	var templates []*models.EmailTemplate
	err := r.db.SelectContext(ctx, &templates, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list email templates: %w", err)
	}

	return templates, nil
}

// GetActiveTemplates retrieves all active templates
func (r *EmailTemplateRepository) GetActiveTemplates(ctx context.Context) ([]*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables,
		       is_active, created_at, updated_at
		FROM email_templates 
		WHERE is_active = true
		ORDER BY name ASC
	`

	var templates []*models.EmailTemplate
	err := r.db.SelectContext(ctx, &templates, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get active templates: %w", err)
	}

	return templates, nil
}

// GetByName retrieves a template by name
func (r *EmailTemplateRepository) GetByName(ctx context.Context, name string) (*models.EmailTemplate, error) {
	query := `
		SELECT id, name, subject, html_template, text_template, variables,
		       is_active, created_at, updated_at
		FROM email_templates 
		WHERE name = $1
	`

	var template models.EmailTemplate
	err := r.db.GetContext(ctx, &template, query, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get template by name: %w", err)
	}

	return &template, nil
}

// Activate activates a template
func (r *EmailTemplateRepository) Activate(ctx context.Context, id string) error {
	query := `UPDATE email_templates SET is_active = true, updated_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to activate template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email template not found: %s", id)
	}

	return nil
}

// Deactivate deactivates a template
func (r *EmailTemplateRepository) Deactivate(ctx context.Context, id string) error {
	query := `UPDATE email_templates SET is_active = false, updated_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to deactivate template: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email template not found: %s", id)
	}

	return nil
} 