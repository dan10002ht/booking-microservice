package providers

import (
	"context"
	"fmt"
	"io"
	"time"

	"gopkg.in/gomail.v2"
)

// SMTPProvider implements the Provider interface for SMTP
type SMTPProvider struct {
	host     string
	port     int
	username string
	password string
	tls      bool
	from     string
	fromName string
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	TLS      bool   `json:"tls"`
	From     string `json:"from"`
	FromName string `json:"from_name"`
}

// NewSMTPProvider creates a new SMTP provider
func NewSMTPProvider(config map[string]any) (Provider, error) {
	host, ok := config["host"].(string)
	if !ok || host == "" {
		return nil, fmt.Errorf("%w: missing or invalid host", ErrInvalidConfig)
	}

	port, ok := config["port"].(int)
	if !ok || port <= 0 {
		return nil, fmt.Errorf("%w: missing or invalid port", ErrInvalidConfig)
	}

	username, ok := config["username"].(string)
	if !ok || username == "" {
		return nil, fmt.Errorf("%w: missing or invalid username", ErrInvalidConfig)
	}

	password, ok := config["password"].(string)
	if !ok || password == "" {
		return nil, fmt.Errorf("%w: missing or invalid password", ErrInvalidConfig)
	}

	tls, _ := config["tls"].(bool)

	from, ok := config["from"].(string)
	if !ok || from == "" {
		return nil, fmt.Errorf("%w: missing or invalid from email", ErrInvalidConfig)
	}

	fromName, _ := config["from_name"].(string)
	if fromName == "" {
		fromName = "Booking System"
	}

	return &SMTPProvider{
		host:     host,
		port:     port,
		username: username,
		password: password,
		tls:      tls,
		from:     from,
		fromName: fromName,
	}, nil
}

// Name returns the provider name
func (p *SMTPProvider) Name() string {
	return "smtp"
}

// Send sends an email via SMTP
func (p *SMTPProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResponse, error) {
	// Create email message
	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", p.fromName, p.from))
	m.SetHeader("To", req.To...)
	m.SetHeader("Subject", req.Subject)

	// Set email body
	if req.HTMLContent != "" {
		m.SetBody("text/html", req.HTMLContent)
		if req.TextContent != "" {
			m.AddAlternative("text/plain", req.TextContent)
		}
	} else if req.TextContent != "" {
		m.SetBody("text/plain", req.TextContent)
	}

	// Add reply-to if specified
	if req.ReplyTo != "" {
		m.SetHeader("Reply-To", req.ReplyTo)
	}

	// Add custom headers
	if req.Headers != nil {
		for key, value := range req.Headers {
			m.SetHeader(key, value)
		}
	}

	// Add attachments
	if len(req.Attachments) > 0 {
		for _, attachment := range req.Attachments {
			m.Attach(attachment.Filename, gomail.SetCopyFunc(func(w io.Writer) error {
				_, err := w.Write(attachment.Content)
				return err
			}))
		}
	}

	// Create dialer
	dialer := gomail.NewDialer(p.host, p.port, p.username, p.password)
	if p.tls {
		dialer.SSL = true
	}

	// Send email
	if err := dialer.DialAndSend(m); err != nil {
		return &EmailResponse{
			Status:    "failed",
			Provider:  p.Name(),
			Error:     err.Error(),
			SentAt:    time.Now(),
		}, fmt.Errorf("%w: %v", ErrSendFailed, err)
	}

	// Generate a simple message ID for SMTP
	messageID := fmt.Sprintf("%d@%s", time.Now().UnixNano(), p.host)

	return &EmailResponse{
		MessageID: messageID,
		Status:    "sent",
		Provider:  p.Name(),
		SentAt:    time.Now(),
	}, nil
}

// Validate validates the SMTP configuration
func (p *SMTPProvider) Validate() error {
	if p.host == "" {
		return fmt.Errorf("%w: missing host", ErrInvalidConfig)
	}

	if p.port <= 0 {
		return fmt.Errorf("%w: invalid port", ErrInvalidConfig)
	}

	if p.username == "" {
		return fmt.Errorf("%w: missing username", ErrInvalidConfig)
	}

	if p.password == "" {
		return fmt.Errorf("%w: missing password", ErrInvalidConfig)
	}

	if p.from == "" {
		return fmt.Errorf("%w: missing from email", ErrInvalidConfig)
	}

	return nil
}

// Health checks if SMTP is healthy
func (p *SMTPProvider) Health(ctx context.Context) error {
	// Create dialer for health check
	dialer := gomail.NewDialer(p.host, p.port, p.username, p.password)
	if p.tls {
		dialer.SSL = true
	}

	// Try to connect to SMTP server
	s, err := dialer.Dial()
	if err != nil {
		return fmt.Errorf("%w: SMTP health check failed: %v", ErrProviderUnhealthy, err)
	}
	defer s.Close()

	return nil
}

// Close closes the SMTP provider (no cleanup needed)
func (p *SMTPProvider) Close() error {
	// SMTP provider doesn't need explicit cleanup
	return nil
} 