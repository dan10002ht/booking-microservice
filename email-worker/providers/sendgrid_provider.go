package providers

import (
	"context"
	"fmt"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// SendGridProvider implements the Provider interface for SendGrid
type SendGridProvider struct {
	client *sendgrid.Client
	apiKey string
	from   string
	fromName string
}

// SendGridConfig holds SendGrid configuration
type SendGridConfig struct {
	APIKey   string `json:"api_key"`
	From     string `json:"from"`
	FromName string `json:"from_name"`
}

// NewSendGridProvider creates a new SendGrid provider
func NewSendGridProvider(config map[string]interface{}) (Provider, error) {
	apiKey, ok := config["api_key"].(string)
	if !ok || apiKey == "" {
		return nil, fmt.Errorf("%w: missing or invalid api_key", ErrInvalidConfig)
	}

	from, ok := config["from"].(string)
	if !ok || from == "" {
		return nil, fmt.Errorf("%w: missing or invalid from email", ErrInvalidConfig)
	}

	fromName, _ := config["from_name"].(string)
	if fromName == "" {
		fromName = "Booking System"
	}

	client := sendgrid.NewSendClient(apiKey)

	return &SendGridProvider{
		client:   client,
		apiKey:   apiKey,
		from:     from,
		fromName: fromName,
	}, nil
}

// Name returns the provider name
func (p *SendGridProvider) Name() string {
	return "sendgrid"
}

// Send sends an email via SendGrid
func (p *SendGridProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResponse, error) {
	// Create email message
	from := mail.NewEmail(p.fromName, p.from)
	
	// Handle multiple recipients
	if len(req.To) == 0 {
		return nil, fmt.Errorf("%w: no recipients specified", ErrSendFailed)
	}
	
	// For simplicity, send to first recipient only
	// In production, you might want to implement batch sending
	to := mail.NewEmail("", req.To[0])
	message := mail.NewSingleEmail(from, req.Subject, to, req.TextContent, req.HTMLContent)

	// Add reply-to if specified
	if req.ReplyTo != "" {
		message.SetReplyTo(mail.NewEmail("", req.ReplyTo))
	}

	// Add custom headers
	if req.Headers != nil {
		for key, value := range req.Headers {
			message.SetHeader(key, value)
		}
	}

	// Add attachments
	if len(req.Attachments) > 0 {
		for _, attachment := range req.Attachments {
			mailAttachment := mail.NewAttachment()
			mailAttachment.SetContent(string(attachment.Content))
			mailAttachment.SetType(attachment.ContentType)
			mailAttachment.SetFilename(attachment.Filename)
			mailAttachment.SetDisposition("attachment")
			message.AddAttachment(mailAttachment)
		}
	}

	// Send email
	response, err := p.client.SendWithContext(ctx, message)
	if err != nil {
		return &EmailResponse{
			Status:    "failed",
			Provider:  p.Name(),
			Error:     err.Error(),
			SentAt:    time.Now(),
		}, fmt.Errorf("%w: %v", ErrSendFailed, err)
	}

	// Check response status
	if response.StatusCode >= 400 {
		return &EmailResponse{
			Status:    "failed",
			Provider:  p.Name(),
			Error:     fmt.Sprintf("HTTP %d: %s", response.StatusCode, response.Body),
			SentAt:    time.Now(),
		}, fmt.Errorf("%w: HTTP %d: %s", ErrSendFailed, response.StatusCode, response.Body)
	}

	// Extract message ID from response headers
	messageID := ""
	if len(response.Headers["X-Message-Id"]) > 0 {
		messageID = response.Headers["X-Message-Id"][0]
	}

	return &EmailResponse{
		MessageID: messageID,
		Status:    "sent",
		Provider:  p.Name(),
		SentAt:    time.Now(),
	}, nil
}

// Validate validates the SendGrid configuration
func (p *SendGridProvider) Validate() error {
	if p.apiKey == "" {
		return fmt.Errorf("%w: missing API key", ErrInvalidConfig)
	}

	if p.from == "" {
		return fmt.Errorf("%w: missing from email", ErrInvalidConfig)
	}

	return nil
}

// Health checks if SendGrid is healthy
func (p *SendGridProvider) Health(ctx context.Context) error {
	// SendGrid doesn't have a health check endpoint, so we'll just validate config
	return p.Validate()
}

// Close closes the SendGrid provider (no cleanup needed)
func (p *SendGridProvider) Close() error {
	// SendGrid client doesn't need explicit cleanup
	return nil
} 