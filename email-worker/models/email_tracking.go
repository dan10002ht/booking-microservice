package models

import (
	"time"

	"github.com/google/uuid"
)

// EmailTracking represents email delivery tracking information
type EmailTracking struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	JobID         uuid.UUID  `db:"job_id" json:"job_id"`
	Provider      string     `db:"provider" json:"provider"`
	MessageID     *string    `db:"message_id" json:"message_id"`
	Status        string     `db:"status" json:"status"`
	SentAt        *time.Time `db:"sent_at" json:"sent_at"`
	DeliveredAt   *time.Time `db:"delivered_at" json:"delivered_at"`
	OpenedAt      *time.Time `db:"opened_at" json:"opened_at"`
	ClickedAt     *time.Time `db:"clicked_at" json:"clicked_at"`
	ErrorMessage  *string    `db:"error_message" json:"error_message"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
}

// NewEmailTracking creates a new EmailTracking record
func NewEmailTracking(jobID uuid.UUID, provider string) *EmailTracking {
	return &EmailTracking{
		ID:        uuid.New(),
		JobID:     jobID,
		Provider:  provider,
		Status:    "pending",
		CreatedAt: time.Now(),
	}
}

// SetMessageID sets the provider message ID
func (t *EmailTracking) SetMessageID(messageID string) {
	t.MessageID = &messageID
}

// MarkAsSent marks the email as sent
func (t *EmailTracking) MarkAsSent() {
	now := time.Now()
	t.Status = "sent"
	t.SentAt = &now
}

// MarkAsDelivered marks the email as delivered
func (t *EmailTracking) MarkAsDelivered() {
	now := time.Now()
	t.Status = "delivered"
	t.DeliveredAt = &now
}

// MarkAsOpened marks the email as opened
func (t *EmailTracking) MarkAsOpened() {
	now := time.Now()
	t.Status = "opened"
	t.OpenedAt = &now
}

// MarkAsClicked marks the email as clicked
func (t *EmailTracking) MarkAsClicked() {
	now := time.Now()
	t.Status = "clicked"
	t.ClickedAt = &now
}

// MarkAsFailed marks the email as failed
func (t *EmailTracking) MarkAsFailed(errorMessage string) {
	t.Status = "failed"
	t.ErrorMessage = &errorMessage
}

// MarkAsBounced marks the email as bounced
func (t *EmailTracking) MarkAsBounced(errorMessage string) {
	t.Status = "bounced"
	t.ErrorMessage = &errorMessage
}

// IsCompleted checks if the tracking is completed (any final status)
func (t *EmailTracking) IsCompleted() bool {
	completedStatuses := []string{"delivered", "opened", "clicked", "failed", "bounced"}
	for _, status := range completedStatuses {
		if t.Status == status {
			return true
		}
	}
	return false
}

// GetDeliveryTime returns the time it took to deliver the email
func (t *EmailTracking) GetDeliveryTime() *time.Duration {
	if t.SentAt == nil || t.DeliveredAt == nil {
		return nil
	}
	duration := t.DeliveredAt.Sub(*t.SentAt)
	return &duration
}

// GetOpenTime returns the time it took for the email to be opened
func (t *EmailTracking) GetOpenTime() *time.Duration {
	if t.SentAt == nil || t.OpenedAt == nil {
		return nil
	}
	duration := t.OpenedAt.Sub(*t.SentAt)
	return &duration
}

// GetClickTime returns the time it took for the email to be clicked
func (t *EmailTracking) GetClickTime() *time.Duration {
	if t.SentAt == nil || t.ClickedAt == nil {
		return nil
	}
	duration := t.ClickedAt.Sub(*t.SentAt)
	return &duration
} 