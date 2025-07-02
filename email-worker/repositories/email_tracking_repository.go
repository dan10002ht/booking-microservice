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

// EmailTrackingRepository handles database operations for email tracking
type EmailTrackingRepository struct {
	db     *sql.DB
	logger *zap.Logger
}

// NewEmailTrackingRepository creates a new EmailTrackingRepository
func NewEmailTrackingRepository(db *sql.DB, logger *zap.Logger) *EmailTrackingRepository {
	return &EmailTrackingRepository{
		db:     db,
		logger: logger,
	}
}

// Create creates a new email tracking record
func (r *EmailTrackingRepository) Create(ctx context.Context, tracking *models.EmailTracking) error {
	query := `
		INSERT INTO email_tracking (
			id, job_id, provider, message_id, status, sent_at, delivered_at, 
			opened_at, clicked_at, error_message, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.ExecContext(ctx, query,
		tracking.ID, tracking.JobID, tracking.Provider, tracking.MessageID,
		tracking.Status, tracking.SentAt, tracking.DeliveredAt, tracking.OpenedAt,
		tracking.ClickedAt, tracking.ErrorMessage, tracking.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create email tracking: %w", err)
	}

	r.logger.Info("Email tracking created",
		zap.String("tracking_id", tracking.ID.String()),
		zap.String("job_id", tracking.JobID.String()),
		zap.String("provider", tracking.Provider),
	)

	return nil
}

// GetByJobID retrieves email tracking by job ID
func (r *EmailTrackingRepository) GetByJobID(ctx context.Context, jobID uuid.UUID) (*models.EmailTracking, error) {
	query := `
		SELECT id, job_id, provider, message_id, status, sent_at, delivered_at, 
		       opened_at, clicked_at, error_message, created_at
		FROM email_tracking WHERE job_id = $1
	`

	var tracking models.EmailTracking
	err := r.db.QueryRowContext(ctx, query, jobID).Scan(
		&tracking.ID, &tracking.JobID, &tracking.Provider, &tracking.MessageID,
		&tracking.Status, &tracking.SentAt, &tracking.DeliveredAt, &tracking.OpenedAt,
		&tracking.ClickedAt, &tracking.ErrorMessage, &tracking.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("email tracking not found for job: %s", jobID)
		}
		return nil, fmt.Errorf("failed to get email tracking: %w", err)
	}

	return &tracking, nil
}

// UpdateStatus updates the status of email tracking
func (r *EmailTrackingRepository) UpdateStatus(ctx context.Context, jobID uuid.UUID, status string) error {
	query := `
		UPDATE email_tracking 
		SET status = $1
		WHERE job_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, status, jobID)
	if err != nil {
		return fmt.Errorf("failed to update email tracking status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email tracking status updated",
		zap.String("job_id", jobID.String()),
		zap.String("status", status),
	)

	return nil
}

// MarkAsSent marks the email as sent
func (r *EmailTrackingRepository) MarkAsSent(ctx context.Context, jobID uuid.UUID, messageID string) error {
	query := `
		UPDATE email_tracking 
		SET status = 'sent', message_id = $1, sent_at = $2
		WHERE job_id = $3
	`

	result, err := r.db.ExecContext(ctx, query, messageID, time.Now(), jobID)
	if err != nil {
		return fmt.Errorf("failed to mark email as sent: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email marked as sent",
		zap.String("job_id", jobID.String()),
		zap.String("message_id", messageID),
	)

	return nil
}

// MarkAsDelivered marks the email as delivered
func (r *EmailTrackingRepository) MarkAsDelivered(ctx context.Context, jobID uuid.UUID) error {
	query := `
		UPDATE email_tracking 
		SET status = 'delivered', delivered_at = $1
		WHERE job_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), jobID)
	if err != nil {
		return fmt.Errorf("failed to mark email as delivered: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email marked as delivered",
		zap.String("job_id", jobID.String()),
	)

	return nil
}

// MarkAsOpened marks the email as opened
func (r *EmailTrackingRepository) MarkAsOpened(ctx context.Context, jobID uuid.UUID) error {
	query := `
		UPDATE email_tracking 
		SET status = 'opened', opened_at = $1
		WHERE job_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), jobID)
	if err != nil {
		return fmt.Errorf("failed to mark email as opened: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email marked as opened",
		zap.String("job_id", jobID.String()),
	)

	return nil
}

// MarkAsClicked marks the email as clicked
func (r *EmailTrackingRepository) MarkAsClicked(ctx context.Context, jobID uuid.UUID) error {
	query := `
		UPDATE email_tracking 
		SET status = 'clicked', clicked_at = $1
		WHERE job_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), jobID)
	if err != nil {
		return fmt.Errorf("failed to mark email as clicked: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email marked as clicked",
		zap.String("job_id", jobID.String()),
	)

	return nil
}

// MarkAsFailed marks the email as failed
func (r *EmailTrackingRepository) MarkAsFailed(ctx context.Context, jobID uuid.UUID, errorMessage string) error {
	query := `
		UPDATE email_tracking 
		SET status = 'failed', error_message = $1
		WHERE job_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, errorMessage, jobID)
	if err != nil {
		return fmt.Errorf("failed to mark email as failed: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("email tracking not found for job: %s", jobID)
	}

	r.logger.Info("Email marked as failed",
		zap.String("job_id", jobID.String()),
		zap.String("error", errorMessage),
	)

	return nil
}

// GetStats retrieves email tracking statistics
func (r *EmailTrackingRepository) GetStats(ctx context.Context, timeRange time.Duration) (*TrackingStats, error) {
	since := time.Now().Add(-timeRange)

	query := `
		SELECT 
			COUNT(*) as total_tracked,
			COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
			COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
			COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
			COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
			AVG(CASE WHEN delivered_at IS NOT NULL AND sent_at IS NOT NULL 
				THEN EXTRACT(EPOCH FROM (delivered_at - sent_at)) 
				END) as avg_delivery_time,
			AVG(CASE WHEN opened_at IS NOT NULL AND sent_at IS NOT NULL 
				THEN EXTRACT(EPOCH FROM (opened_at - sent_at)) 
				END) as avg_open_time
		FROM email_tracking 
		WHERE created_at >= $1
	`

	var stats TrackingStats
	err := r.db.QueryRowContext(ctx, query, since).Scan(
		&stats.TotalTracked, &stats.Delivered, &stats.Opened, &stats.Clicked,
		&stats.Failed, &stats.Bounced, &stats.AverageDeliveryTime, &stats.AverageOpenTime,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get tracking stats: %w", err)
	}

	// Calculate rates
	if stats.TotalTracked > 0 {
		stats.DeliveryRate = float64(stats.Delivered) / float64(stats.TotalTracked) * 100
		stats.OpenRate = float64(stats.Opened) / float64(stats.TotalTracked) * 100
		stats.ClickRate = float64(stats.Clicked) / float64(stats.TotalTracked) * 100
		stats.FailureRate = float64(stats.Failed+stats.Bounced) / float64(stats.TotalTracked) * 100
	}

	return &stats, nil
}

// TrackingStats represents email tracking statistics
type TrackingStats struct {
	TotalTracked         int64   `json:"total_tracked"`
	Delivered            int64   `json:"delivered"`
	Opened               int64   `json:"opened"`
	Clicked              int64   `json:"clicked"`
	Failed               int64   `json:"failed"`
	Bounced              int64   `json:"bounced"`
	DeliveryRate         float64 `json:"delivery_rate"`
	OpenRate             float64 `json:"open_rate"`
	ClickRate            float64 `json:"click_rate"`
	FailureRate          float64 `json:"failure_rate"`
	AverageDeliveryTime  float64 `json:"average_delivery_time"`
	AverageOpenTime      float64 `json:"average_open_time"`
} 