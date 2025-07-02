package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"booking-system/email-worker/models"
)

// EmailJobRepository handles database operations for email jobs
type EmailJobRepository struct {
	db     *sql.DB
	logger *zap.Logger
}

// NewEmailJobRepository creates a new EmailJobRepository
func NewEmailJobRepository(db *sql.DB, logger *zap.Logger) *EmailJobRepository {
	return &EmailJobRepository{
		db:     db,
		logger: logger,
	}
}

// Create creates a new email job
func (r *EmailJobRepository) Create(ctx context.Context, job *models.EmailJob) error {
	query := `
		INSERT INTO email_jobs (
			id, job_type, recipient_email, subject, template_id, template_data,
			status, priority, retry_count, max_retries, scheduled_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := r.db.ExecContext(ctx, query,
		job.ID, job.JobType, job.RecipientEmail, job.Subject, job.TemplateID, job.TemplateData,
		job.Status, job.Priority, job.RetryCount, job.MaxRetries, job.ScheduledAt,
		job.CreatedAt, job.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create email job: %w", err)
	}

	r.logger.Info("Email job created",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("recipient", job.RecipientEmail),
	)

	return nil
}

// GetByID retrieves an email job by ID
func (r *EmailJobRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.EmailJob, error) {
	query := `
		SELECT id, job_type, recipient_email, subject, template_id, template_data,
			   status, priority, retry_count, max_retries, scheduled_at, created_at, updated_at
		FROM email_jobs WHERE id = $1
	`

	var job models.EmailJob
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&job.ID, &job.JobType, &job.RecipientEmail, &job.Subject, &job.TemplateID, &job.TemplateData,
		&job.Status, &job.Priority, &job.RetryCount, &job.MaxRetries, &job.ScheduledAt,
		&job.CreatedAt, &job.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("email job not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get email job: %w", err)
	}

	return &job, nil
}

// UpdateStatus updates the status of an email job
func (r *EmailJobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE email_jobs 
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	result, err := r.db.ExecContext(ctx, query, status, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update email job status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email job not found: %s", id)
	}

	r.logger.Info("Email job status updated",
		zap.String("job_id", id.String()),
		zap.String("status", status),
	)

	return nil
}

// UpdateProcessingTime updates the processing time fields
func (r *EmailJobRepository) UpdateProcessingTime(ctx context.Context, id uuid.UUID, processingAt, completedAt *time.Time) error {
	query := `
		UPDATE email_jobs 
		SET processing_at = $1, completed_at = $2, updated_at = $3
		WHERE id = $4
	`

	result, err := r.db.ExecContext(ctx, query, processingAt, completedAt, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update processing time: %w", err)
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

// IncrementRetryCount increments the retry count for an email job
func (r *EmailJobRepository) IncrementRetryCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE email_jobs 
		SET retry_count = retry_count + 1, updated_at = $1
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to increment retry count: %w", err)
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

// GetPendingJobs retrieves pending jobs that are ready to be processed
func (r *EmailJobRepository) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	query := `
		SELECT id, job_type, recipient_email, subject, template_id, template_data,
			   status, priority, retry_count, max_retries, scheduled_at, created_at, updated_at
		FROM email_jobs 
		WHERE status = 'pending' 
		  AND (scheduled_at IS NULL OR scheduled_at <= $1)
		ORDER BY priority DESC, created_at ASC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, time.Now(), limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending jobs: %w", err)
	}
	defer rows.Close()

	var jobs []*models.EmailJob
	for rows.Next() {
		var job models.EmailJob
		err := rows.Scan(
			&job.ID, &job.JobType, &job.RecipientEmail, &job.Subject, &job.TemplateID, &job.TemplateData,
			&job.Status, &job.Priority, &job.RetryCount, &job.MaxRetries, &job.ScheduledAt,
			&job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan job: %w", err)
		}
		jobs = append(jobs, &job)
	}

	return jobs, nil
}

// GetStats retrieves email job statistics
func (r *EmailJobRepository) GetStats(ctx context.Context, timeRange time.Duration) (*JobStats, error) {
	since := time.Now().Add(-timeRange)

	query := `
		SELECT 
			COUNT(*) as total_jobs,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
			COUNT(CASE WHEN retry_count > 0 THEN 1 END) as retried_jobs,
			AVG(CASE WHEN completed_at IS NOT NULL AND processing_at IS NOT NULL 
				THEN EXTRACT(EPOCH FROM (completed_at - processing_at)) 
				END) as avg_processing_time
		FROM email_jobs 
		WHERE created_at >= $1
	`

	var stats JobStats
	err := r.db.QueryRowContext(ctx, query, since).Scan(
		&stats.TotalJobs, &stats.CompletedJobs, &stats.FailedJobs,
		&stats.PendingJobs, &stats.RetriedJobs, &stats.AverageProcessingTime,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get job stats: %w", err)
	}

	// Calculate success rate
	if stats.TotalJobs > 0 {
		stats.SuccessRate = float64(stats.CompletedJobs) / float64(stats.TotalJobs) * 100
	}

	return &stats, nil
}

// CleanupOldJobs removes old completed jobs
func (r *EmailJobRepository) CleanupOldJobs(ctx context.Context, olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)

	query := `
		DELETE FROM email_jobs 
		WHERE status = 'completed' AND updated_at < $1
	`

	result, err := r.db.ExecContext(ctx, query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to cleanup old jobs: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	r.logger.Info("Cleaned up old completed jobs",
		zap.Int64("deleted_count", rowsAffected),
		zap.Time("cutoff", cutoff),
	)

	return nil
}

// CleanupOldFailedJobs removes old failed jobs
func (r *EmailJobRepository) CleanupOldFailedJobs(ctx context.Context, olderThan time.Duration) error {
	cutoff := time.Now().Add(-olderThan)

	query := `
		DELETE FROM email_jobs 
		WHERE status = 'failed' AND updated_at < $1
	`

	result, err := r.db.ExecContext(ctx, query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to cleanup old failed jobs: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	r.logger.Info("Cleaned up old failed jobs",
		zap.Int64("deleted_count", rowsAffected),
		zap.Time("cutoff", cutoff),
	)

	return nil
}

// JobStats represents email job statistics
type JobStats struct {
	TotalJobs              int64   `json:"total_jobs"`
	CompletedJobs          int64   `json:"completed_jobs"`
	FailedJobs             int64   `json:"failed_jobs"`
	PendingJobs            int64   `json:"pending_jobs"`
	RetriedJobs            int64   `json:"retried_jobs"`
	SuccessRate            float64 `json:"success_rate"`
	AverageProcessingTime  float64 `json:"average_processing_time"`
} 