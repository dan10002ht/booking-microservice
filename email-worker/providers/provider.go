package providers

import (
	"context"
	"time"
)

// EmailRequest represents an email to be sent
type EmailRequest struct {
	To          []string          `json:"to"`
	CC          []string          `json:"cc,omitempty"`
	BCC         []string          `json:"bcc,omitempty"`
	Subject     string            `json:"subject"`
	HTMLContent string            `json:"html_content"`
	TextContent string            `json:"text_content"`
	From        string            `json:"from"`
	FromName    string            `json:"from_name"`
	ReplyTo     string            `json:"reply_to"`
	Headers     map[string]string `json:"headers"`
	Attachments []Attachment      `json:"attachments"`
}

// Attachment represents an email attachment
type Attachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Content     []byte `json:"content"`
}

// EmailResponse represents the response from sending an email
type EmailResponse struct {
	MessageID   string    `json:"message_id"`
	Status      string    `json:"status"`
	SentAt      time.Time `json:"sent_at"`
	Provider    string    `json:"provider"`
	Error       string    `json:"error,omitempty"`
}

// Provider defines the interface for email providers
type Provider interface {
	// Name returns the provider name
	Name() string

	// Send sends an email
	Send(ctx context.Context, req *EmailRequest) (*EmailResponse, error)

	// Validate validates the provider configuration
	Validate() error

	// Health checks if the provider is healthy
	Health(ctx context.Context) error

	// Close closes the provider connection
	Close() error
}

// ProviderType represents different email provider types
type ProviderType string

const (
	ProviderTypeSendGrid ProviderType = "sendgrid"
	ProviderTypeSES      ProviderType = "ses"
	ProviderTypeSMTP     ProviderType = "smtp"
)

// ProviderFactory creates email providers
type ProviderFactory struct {
	config map[string]any
}

// NewProviderFactory creates a new provider factory
func NewProviderFactory(config map[string]any) *ProviderFactory {
	return &ProviderFactory{config: config}
}

// CreateProvider creates a provider based on type
func (f *ProviderFactory) CreateProvider(providerType ProviderType) (Provider, error) {
	switch providerType {
	case ProviderTypeSendGrid:
		return NewSendGridProvider(f.config)
	case ProviderTypeSES:
		return NewSESProvider(f.config)
	case ProviderTypeSMTP:
		return NewSMTPProvider(f.config)
	default:
		return nil, ErrUnsupportedProvider
	}
}

// Provider errors
var (
	ErrUnsupportedProvider = &ProviderError{Message: "unsupported provider"}
	ErrInvalidConfig       = &ProviderError{Message: "invalid configuration"}
	ErrSendFailed          = &ProviderError{Message: "failed to send email"}
	ErrProviderUnhealthy   = &ProviderError{Message: "provider is unhealthy"}
)

// ProviderError represents a provider-specific error
type ProviderError struct {
	Message string
	Err     error
}

func (e *ProviderError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *ProviderError) Unwrap() error {
	return e.Err
} 