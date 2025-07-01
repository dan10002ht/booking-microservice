package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"booking-system/email-worker/database/models"
)

// EmailJobRepository handles database operations for email jobs
type EmailJobRepository struct {
	db *sql.DB
}

// NewEmailJobRepository creates a new email job repository
func NewEmailJobRepository(db *sql.DB) *EmailJobRepository {
	return &EmailJobRepository{db: db}
}

// Create creates a new email job
func (r *EmailJobRepository) Create(ctx context.Context, job *models.EmailJob) error {
	query := `
		INSERT INTO email_jobs (
			job_type, priority, status, user_id, email, subject, 
			template_id, template_data, provider, max_retries, scheduled_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		job.JobType, job.Priority, job.Status, job.UserID, job.Email, job.Subject,
		job.TemplateID, job.TemplateData, job.Provider, job.MaxRetries, job.ScheduledAt,
	).Scan(&job.ID, &job.CreatedAt, &job.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create email job: %w", err)
	}

	return nil
}

// GetByID retrieves an email job by ID
func (r *EmailJobRepository) GetByID(ctx context.Context, id int64) (*models.EmailJob, error) {
	query := `
		SELECT id, job_type, priority, status, user_id, email, subject,
			   template_id, template_data, provider, retry_count, max_retries,
			   error_message, sent_at, scheduled_at, created_at, updated_at
		FROM email_jobs WHERE id = $1
	`

	job := &models.EmailJob{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&job.ID, &job.JobType, &job.Priority, &job.Status, &job.UserID, &job.Email, &job.Subject,
		&job.TemplateID, &job.TemplateData, &job.Provider, &job.RetryCount, &job.MaxRetries,
		&job.ErrorMessage, &job.SentAt, &job.ScheduledAt, &job.CreatedAt, &job.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("email job not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get email job: %w", err)
	}

	return job, nil
}

// GetPendingJobs retrieves pending jobs for processing
func (r *EmailJobRepository) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, job_type, priority, status, user_id, email, subject,
			   template_id, template_data, provider, retry_count, max_retries,
			   error_message, sent_at, scheduled_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = $1 
		  AND (scheduled_at IS NULL OR scheduled_at <= $2)
		ORDER BY priority ASC, created_at ASC
		LIMIT $3
	`

	rows, err := r.db.QueryContext(ctx, query, models.JobStatusPending, time.Now(), limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending jobs: %w", err)
	}
	defer rows.Close()

	var jobs []*models.EmailJob
	for rows.Next() {
		job := &models.EmailJob{}
		err := rows.Scan(
			&job.ID, &job.JobType, &job.Priority, &job.Status, &job.UserID, &job.Email, &job.Subject,
			&job.TemplateID, &job.TemplateData, &job.Provider, &job.RetryCount, &job.MaxRetries,
			&job.ErrorMessage, &job.SentAt, &job.ScheduledAt, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// UpdateStatus updates the status of an email job
func (r *EmailJobRepository) UpdateStatus(ctx context.Context, id int64, status string, errorMessage string, sentAt *time.Time) error {
	query := `
		UPDATE email_jobs 
		SET status = $2, error_message = $3, sent_at = $4, updated_at = $5
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id, status, errorMessage, sentAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update job status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email job not found: %d", id)
	}

	return nil
}

// IncrementRetryCount increments the retry count for a job
func (r *EmailJobRepository) IncrementRetryCount(ctx context.Context, id int64) error {
	query := `
		UPDATE email_jobs 
		SET retry_count = retry_count + 1, updated_at = $2
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id, time.Now())
	if err != nil {
		return fmt.Errorf("failed to increment retry count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email job not found: %d", id)
	}

	return nil
}

// GetJobsByUser retrieves jobs for a specific user
func (r *EmailJobRepository) GetJobsByUser(ctx context.Context, userID string, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, job_type, priority, status, user_id, email, subject,
			   template_id, template_data, provider, retry_count, max_retries,
			   error_message, sent_at, scheduled_at, created_at, updated_at
		FROM email_jobs 
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs by user: %w", err)
	}
	defer rows.Close()

	var jobs []*models.EmailJob
	for rows.Next() {
		job := &models.EmailJob{}
		err := rows.Scan(
			&job.ID, &job.JobType, &job.Priority, &job.Status, &job.UserID, &job.Email, &job.Subject,
			&job.TemplateID, &job.TemplateData, &job.Provider, &job.RetryCount, &job.MaxRetries,
			&job.ErrorMessage, &job.SentAt, &job.ScheduledAt, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// GetFailedJobs retrieves failed jobs for retry
func (r *EmailJobRepository) GetFailedJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, job_type, priority, status, user_id, email, subject,
			   template_id, template_data, provider, retry_count, max_retries,
			   error_message, sent_at, scheduled_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = $1 AND retry_count < max_retries
		ORDER BY updated_at ASC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, models.JobStatusFailed, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get failed jobs: %w", err)
	}
	defer rows.Close()

	var jobs []*models.EmailJob
	for rows.Next() {
		job := &models.EmailJob{}
		err := rows.Scan(
			&job.ID, &job.JobType, &job.Priority, &job.Status, &job.UserID, &job.Email, &job.Subject,
			&job.TemplateID, &job.TemplateData, &job.Provider, &job.RetryCount, &job.MaxRetries,
			&job.ErrorMessage, &job.SentAt, &job.ScheduledAt, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// DeleteOldJobs deletes old completed jobs
func (r *EmailJobRepository) DeleteOldJobs(ctx context.Context, olderThan time.Time) (int64, error) {
	query := `
		DELETE FROM email_jobs 
		WHERE status IN ($1, $2) AND created_at < $3
	`

	result, err := r.db.ExecContext(ctx, query, models.JobStatusSent, models.JobStatusFailed, olderThan)
	if err != nil {
		return 0, fmt.Errorf("failed to delete old jobs: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
} 