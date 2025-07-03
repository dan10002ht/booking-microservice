package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// JobStatus represents the status of an email job
type JobStatus string

// JobPriority represents the priority of an email job
type JobPriority int

// StringArray represents a string array for database storage
type StringArray []string

// VariablesMap represents a variables map for database storage
type VariablesMap map[string]interface{}

// EmailJob represents an email job in the queue
type EmailJob struct {
	ID             string        `json:"id" db:"id"`
	To             StringArray   `json:"to" db:"to"`
	CC             StringArray   `json:"cc" db:"cc"`
	BCC            StringArray   `json:"bcc" db:"bcc"`
	TemplateName   string        `json:"template_name" db:"template_name"`
	Variables      VariablesMap  `json:"variables" db:"variables"`
	Status         JobStatus     `json:"status" db:"status"`
	Priority       JobPriority   `json:"priority" db:"priority"`
	RetryCount     int           `json:"retry_count" db:"retry_count"`
	MaxRetries     int           `json:"max_retries" db:"max_retries"`
	ErrorMessage   string        `json:"error_message" db:"error_message"`
	ProcessedAt    *time.Time    `json:"processed_at" db:"processed_at"`
	SentAt         *time.Time    `json:"sent_at" db:"sent_at"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
}

// Value implements driver.Valuer for StringArray
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

// Scan implements sql.Scanner for StringArray
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, s)
}

// Value implements driver.Valuer for VariablesMap
func (m VariablesMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements sql.Scanner for VariablesMap
func (m *VariablesMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, m)
}

// NewEmailJob creates a new email job with a generated UUID
func NewEmailJob(to, cc, bcc []string, templateName string, variables map[string]interface{}, priority JobPriority) *EmailJob {
	return &EmailJob{
		ID:           uuid.New().String(),
		To:           StringArray(to),
		CC:           StringArray(cc),
		BCC:          StringArray(bcc),
		TemplateName: templateName,
		Variables:    VariablesMap(variables),
		Status:       JobStatusPending,
		Priority:     priority,
		RetryCount:   0,
		MaxRetries:   3,
		ErrorMessage: "",
	}
}

// Job status constants
const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
	JobStatusCancelled  JobStatus = "cancelled"
)

// Job priority constants
const (
	JobPriorityHigh   JobPriority = 1
	JobPriorityNormal JobPriority = 2
	JobPriorityLow    JobPriority = 3
)

// EmailTracking represents email delivery tracking
type EmailTracking struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	JobID        uuid.UUID  `json:"job_id" db:"job_id"`
	Provider     *string    `json:"provider" db:"provider"`
	MessageID    *string    `json:"message_id" db:"message_id"`   // Provider's message ID
	Status       string     `json:"status" db:"status"`           // "sent", "delivered", "bounced", "opened", "clicked"
	SentAt       *time.Time `json:"sent_at" db:"sent_at"`
	DeliveredAt  *time.Time `json:"delivered_at" db:"delivered_at"`
	OpenedAt     *time.Time `json:"opened_at" db:"opened_at"`
	ClickedAt    *time.Time `json:"clicked_at" db:"clicked_at"`
	ErrorMessage *string    `json:"error_message" db:"error_message"`
	BounceReason *string    `json:"bounce_reason" db:"bounce_reason"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// EmailTrackingStatus represents tracking status constants
const (
	TrackingStatusSent      = "sent"
	TrackingStatusDelivered = "delivered"
	TrackingStatusBounced   = "bounced"
	TrackingStatusOpened    = "opened"
	TrackingStatusClicked   = "clicked"
) 