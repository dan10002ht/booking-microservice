package models

import (
	"time"
)

// EmailJob represents an email job in the queue
type EmailJob struct {
	ID              int64     `json:"id" db:"id"`
	JobType         string    `json:"job_type" db:"job_type"`           // "verification", "password_reset", "welcome", "security", "invitation"
	Priority        int       `json:"priority" db:"priority"`           // 1=high, 2=normal, 3=low
	Status          string    `json:"status" db:"status"`               // "pending", "processing", "sent", "failed", "cancelled"
	UserID          string    `json:"user_id" db:"user_id"`             // UUID from auth-service
	Email           string    `json:"email" db:"email"`
	Subject         string    `json:"subject" db:"subject"`
	TemplateID      string    `json:"template_id" db:"template_id"`     // Template identifier
	TemplateData    string    `json:"template_data" db:"template_data"` // JSON data for template
	Provider        string    `json:"provider" db:"provider"`           // "sendgrid", "ses", "smtp"
	RetryCount      int       `json:"retry_count" db:"retry_count"`
	MaxRetries      int       `json:"max_retries" db:"max_retries"`
	ErrorMessage    string    `json:"error_message" db:"error_message"`
	SentAt          *time.Time `json:"sent_at" db:"sent_at"`
	ScheduledAt     *time.Time `json:"scheduled_at" db:"scheduled_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// EmailTemplate represents email templates
type EmailTemplate struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`               // "email_verification", "password_reset", "welcome"
	Subject     string    `json:"subject" db:"subject"`
	HTMLContent string    `json:"html_content" db:"html_content"`
	TextContent string    `json:"text_content" db:"text_content"`
	Variables   string    `json:"variables" db:"variables"`     // JSON array of variable names
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// EmailTracking represents email delivery tracking
type EmailTracking struct {
	ID          int64     `json:"id" db:"id"`
	JobID       int64     `json:"job_id" db:"job_id"`
	Provider    string    `json:"provider" db:"provider"`
	MessageID   string    `json:"message_id" db:"message_id"`   // Provider's message ID
	Status      string    `json:"status" db:"status"`           // "sent", "delivered", "bounced", "opened", "clicked"
	SentAt      *time.Time `json:"sent_at" db:"sent_at"`
	DeliveredAt *time.Time `json:"delivered_at" db:"delivered_at"`
	OpenedAt    *time.Time `json:"opened_at" db:"opened_at"`
	ClickedAt   *time.Time `json:"clicked_at" db:"clicked_at"`
	BounceReason string   `json:"bounce_reason" db:"bounce_reason"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// EmailJobStatus represents job status constants
const (
	JobStatusPending    = "pending"
	JobStatusProcessing = "processing"
	JobStatusSent       = "sent"
	JobStatusFailed     = "failed"
	JobStatusCancelled  = "cancelled"
)

// EmailJobType represents job type constants
const (
	JobTypeVerification   = "verification"
	JobTypePasswordReset  = "password_reset"
	JobTypeWelcome        = "welcome"
	JobTypeSecurity       = "security"
	JobTypeInvitation     = "invitation"
	JobTypeNotification   = "notification"
)

// EmailPriority represents priority constants
const (
	PriorityHigh   = 1
	PriorityNormal = 2
	PriorityLow    = 3
)

// EmailProvider represents provider constants
const (
	ProviderSendGrid = "sendgrid"
	ProviderSES      = "ses"
	ProviderSMTP     = "smtp"
)

// EmailTrackingStatus represents tracking status constants
const (
	TrackingStatusSent      = "sent"
	TrackingStatusDelivered = "delivered"
	TrackingStatusBounced   = "bounced"
	TrackingStatusOpened    = "opened"
	TrackingStatusClicked   = "clicked"
) 