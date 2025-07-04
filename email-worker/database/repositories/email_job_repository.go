package repositories

import (
	"context"
	"fmt"
	"time"

	"booking-system/email-worker/database"
	"booking-system/email-worker/models"
)

// EmailJobRepository handles database operations for email jobs
type EmailJobRepository struct {
	db *database.DB
}

// NewEmailJobRepository creates a new email job repository
func NewEmailJobRepository(db *database.DB) *EmailJobRepository {
	return &EmailJobRepository{db: db}
}

// Create creates a new email job
func (r *EmailJobRepository) Create(ctx context.Context, job *models.EmailJob) error {
	query := `
		INSERT INTO email_jobs (
			id, to_emails, cc_emails, bcc_emails, template_name, variables,
			status, priority, retry_count, max_retries, error_message
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		job.ID.String(), job.To, job.CC, job.BCC, job.TemplateName,
		job.Variables, string(job.Status), int(job.Priority), job.RetryCount,
		job.MaxRetries, job.ErrorMessage,
	).Scan(&job.CreatedAt, &job.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create email job: %w", err)
	}

	return nil
}

// GetByID retrieves an email job by ID
func (r *EmailJobRepository) GetByID(ctx context.Context, id string) (*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE id = $1
	`

	var job models.EmailJob
	err := r.db.GetContext(ctx, &job, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get email job: %w", err)
	}

	return &job, nil
}

// Update updates an email job
func (r *EmailJobRepository) Update(ctx context.Context, job *models.EmailJob) error {
	query := `
		UPDATE email_jobs 
		SET to_emails = $2, cc_emails = $3, bcc_emails = $4, template_name = $5,
		    variables = $6, status = $7, priority = $8, retry_count = $9,
		    max_retries = $10, error_message = $11, processed_at = $12,
		    sent_at = $13, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		job.ID.String(), job.To, job.CC, job.BCC, job.TemplateName,
		job.Variables, string(job.Status), int(job.Priority), job.RetryCount,
		job.MaxRetries, job.ErrorMessage, job.ProcessedAt, job.SentAt,
	).Scan(&job.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update email job: %w", err)
	}

	return nil
}

// Delete deletes an email job
func (r *EmailJobRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM email_jobs WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete email job: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email job not found: %s", id)
	}

	return nil
}

// List retrieves email jobs with pagination
func (r *EmailJobRepository) List(ctx context.Context, limit, offset int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list email jobs: %w", err)
	}

	return jobs, nil
}

// GetPendingJobs retrieves pending jobs for processing
func (r *EmailJobRepository) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = $1
		ORDER BY priority ASC, created_at ASC
		LIMIT $2
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, models.JobStatusPending, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending jobs: %w", err)
	}

	return jobs, nil
}

// GetFailedJobs retrieves failed jobs
func (r *EmailJobRepository) GetFailedJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, models.JobStatusFailed, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get failed jobs: %w", err)
	}

	return jobs, nil
}

// GetJobsByStatus retrieves jobs by status
func (r *EmailJobRepository) GetJobsByStatus(ctx context.Context, status models.JobStatus, limit, offset int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs by status: %w", err)
	}

	return jobs, nil
}

// GetJobsByTemplate retrieves jobs by template name
func (r *EmailJobRepository) GetJobsByTemplate(ctx context.Context, templateName string, limit, offset int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE template_name = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, templateName, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs by template: %w", err)
	}

	return jobs, nil
}

// GetJobStats returns statistics about email jobs
func (r *EmailJobRepository) GetJobStats(ctx context.Context) (map[string]int, error) {
	query := `
		SELECT 
			status,
			COUNT(*) as count
		FROM email_jobs 
		GROUP BY status
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get job stats: %w", err)
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, fmt.Errorf("failed to scan job stats: %w", err)
		}
		stats[status] = count
	}

	return stats, nil
}

// CleanupOldJobs deletes jobs older than the specified time
func (r *EmailJobRepository) CleanupOldJobs(ctx context.Context, olderThan time.Time) error {
	query := `DELETE FROM email_jobs WHERE created_at < $1`

	result, err := r.db.ExecContext(ctx, query, olderThan)
	if err != nil {
		return fmt.Errorf("failed to cleanup old jobs: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	// Log cleanup info
	fmt.Printf("Cleaned up %d old email jobs\n", rowsAffected)

	return nil
}

// GetJobsByDateRange retrieves jobs within a date range
func (r *EmailJobRepository) GetJobsByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, to_emails, cc_emails, bcc_emails, template_name, variables,
		       status, priority, retry_count, max_retries, error_message,
		       processed_at, sent_at, created_at, updated_at
		FROM email_jobs 
		WHERE created_at >= $1 AND created_at <= $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	var jobs []*models.EmailJob
	err := r.db.SelectContext(ctx, &jobs, query, startDate, endDate, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs by date range: %w", err)
	}

	return jobs, nil
} 