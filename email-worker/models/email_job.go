package models

import (
	"time"

	"github.com/google/uuid"
)

// EmailJob represents an email job in the system
type EmailJob struct {
	ID             uuid.UUID       `db:"id" json:"id"`
	JobType        string          `db:"job_type" json:"job_type"`
	RecipientEmail string          `db:"recipient_email" json:"recipient_email"`
	Subject        *string         `db:"subject" json:"subject"`
	TemplateID     *string         `db:"template_id" json:"template_id"`
	TemplateData   *map[string]any `db:"template_data" json:"template_data"`
	Status         string          `db:"status" json:"status"`
	Priority       int             `db:"priority" json:"priority"`
	RetryCount     int             `db:"retry_count" json:"retry_count"`
	MaxRetries     int             `db:"max_retries" json:"max_retries"`
	ScheduledAt    *time.Time      `db:"scheduled_at" json:"scheduled_at"`
	CreatedAt      time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time       `db:"updated_at" json:"updated_at"`
	
	// Queue-specific fields
	IsTracked      bool            `json:"is_tracked"`      // Whether this job is tracked in database
	QueueID        string          `json:"queue_id"`        // Queue message ID
	ProcessingAt   *time.Time      `json:"processing_at"`   // When processing started
	CompletedAt    *time.Time      `json:"completed_at"`    // When processing completed
}

// NewEmailJob creates a new EmailJob with default values
func NewEmailJob(jobType, recipientEmail string) *EmailJob {
	return &EmailJob{
		ID:             uuid.New(),
		JobType:        jobType,
		RecipientEmail: recipientEmail,
		Status:         "pending",
		Priority:       0,
		RetryCount:     0,
		MaxRetries:     3,
		IsTracked:      false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

// NewTrackedEmailJob creates a new tracked EmailJob
func NewTrackedEmailJob(jobType, recipientEmail string) *EmailJob {
	job := NewEmailJob(jobType, recipientEmail)
	job.IsTracked = true
	return job
}

// SetTemplate sets the template ID and data for the job
func (j *EmailJob) SetTemplate(templateID string, data map[string]any) {
	j.TemplateID = &templateID
	j.TemplateData = &data
}

// SetSubject sets the subject for the job
func (j *EmailJob) SetSubject(subject string) {
	j.Subject = &subject
}

// SetScheduledAt sets the scheduled time for the job
func (j *EmailJob) SetScheduledAt(scheduledAt time.Time) {
	j.ScheduledAt = &scheduledAt
}

// SetPriority sets the priority for the job
func (j *EmailJob) SetPriority(priority int) {
	j.Priority = priority
}

// SetMaxRetries sets the maximum number of retries
func (j *EmailJob) SetMaxRetries(maxRetries int) {
	j.MaxRetries = maxRetries
}

// SetQueueID sets the queue message ID
func (j *EmailJob) SetQueueID(queueID string) {
	j.QueueID = queueID
}

// CanRetry checks if the job can be retried
func (j *EmailJob) CanRetry() bool {
	return j.RetryCount < j.MaxRetries
}

// IncrementRetry increments the retry count
func (j *EmailJob) IncrementRetry() {
	j.RetryCount++
	j.UpdatedAt = time.Now()
}

// IsReadyToProcess checks if the job is ready to be processed
func (j *EmailJob) IsReadyToProcess() bool {
	if j.Status != "pending" {
		return false
	}
	
	if j.ScheduledAt != nil && time.Now().Before(*j.ScheduledAt) {
		return false
	}
	
	return true
}

// MarkAsProcessing marks the job as processing
func (j *EmailJob) MarkAsProcessing() {
	now := time.Now()
	j.Status = "processing"
	j.ProcessingAt = &now
	j.UpdatedAt = now
}

// MarkAsCompleted marks the job as completed
func (j *EmailJob) MarkAsCompleted() {
	now := time.Now()
	j.Status = "completed"
	j.CompletedAt = &now
	j.UpdatedAt = now
}

// MarkAsFailed marks the job as failed
func (j *EmailJob) MarkAsFailed() {
	now := time.Now()
	j.Status = "failed"
	j.CompletedAt = &now
	j.UpdatedAt = now
}

// MarkAsRetrying marks the job as retrying
func (j *EmailJob) MarkAsRetrying() {
	j.Status = "retrying"
	j.UpdatedAt = time.Now()
}

// IsCompleted checks if the job is completed (success or failure)
func (j *EmailJob) IsCompleted() bool {
	return j.Status == "completed" || j.Status == "failed"
}

// GetProcessingDuration returns the processing duration if completed
func (j *EmailJob) GetProcessingDuration() *time.Duration {
	if j.ProcessingAt == nil || j.CompletedAt == nil {
		return nil
	}
	
	duration := j.CompletedAt.Sub(*j.ProcessingAt)
	return &duration
}

// ShouldBeTracked determines if this job should be tracked in database
func (j *EmailJob) ShouldBeTracked() bool {
	// Track important email types
	importantTypes := []string{
		"email_verification",
		"password_reset", 
		"payment_confirmation",
		"booking_confirmation",
		"invoice_generated",
		"organization_invitation",
	}
	
	for _, importantType := range importantTypes {
		if j.JobType == importantType {
			return true
		}
	}
	
	// Track high priority jobs
	if j.Priority >= 2 {
		return true
	}
	
	// Track scheduled jobs
	if j.ScheduledAt != nil {
		return true
	}
	
	return j.IsTracked
} 