package providers

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
)

// SESProvider implements the Provider interface for AWS SES
type SESProvider struct {
	client   *ses.SES
	from     string
	fromName string
	region   string
}

// SESConfig holds AWS SES configuration
type SESConfig struct {
	Region          string `json:"region"`
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
	From            string `json:"from"`
	FromName        string `json:"from_name"`
}

// NewSESProvider creates a new AWS SES provider
func NewSESProvider(config map[string]any) (Provider, error) {
	region, ok := config["region"].(string)
	if !ok || region == "" {
		return nil, fmt.Errorf("%w: missing or invalid region", ErrInvalidConfig)
	}

	accessKeyID, ok := config["access_key_id"].(string)
	if !ok || accessKeyID == "" {
		return nil, fmt.Errorf("%w: missing or invalid access_key_id", ErrInvalidConfig)
	}

	secretAccessKey, ok := config["secret_access_key"].(string)
	if !ok || secretAccessKey == "" {
		return nil, fmt.Errorf("%w: missing or invalid secret_access_key", ErrInvalidConfig)
	}

	from, ok := config["from"].(string)
	if !ok || from == "" {
		return nil, fmt.Errorf("%w: missing or invalid from email", ErrInvalidConfig)
	}

	fromName, _ := config["from_name"].(string)
	if fromName == "" {
		fromName = "Booking System"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(region),
		Credentials: credentials.NewStaticCredentials(accessKeyID, secretAccessKey, ""),
	})
	if err != nil {
		return nil, fmt.Errorf("%w: failed to create AWS session: %v", ErrInvalidConfig, err)
	}

	// Create SES client
	client := ses.New(sess)

	return &SESProvider{
		client:   client,
		from:     from,
		fromName: fromName,
		region:   region,
	}, nil
}

// Name returns the provider name
func (p *SESProvider) Name() string {
	return "ses"
}

// Send sends an email via AWS SES
func (p *SESProvider) Send(ctx context.Context, req *EmailRequest) (*EmailResponse, error) {
	// Convert string slices to AWS string pointers
	toAddresses := make([]*string, len(req.To))
	for i, addr := range req.To {
		toAddresses[i] = aws.String(addr)
	}

	// Create email input
	input := &ses.SendEmailInput{
		Source: aws.String(fmt.Sprintf("%s <%s>", p.fromName, p.from)),
		Destination: &ses.Destination{
			ToAddresses: toAddresses,
		},
		Message: &ses.Message{
			Subject: &ses.Content{
				Data:    aws.String(req.Subject),
				Charset: aws.String("UTF-8"),
			},
		},
	}

	// Set email body
	if req.HTMLContent != "" {
		input.Message.Body = &ses.Body{
			Html: &ses.Content{
				Data:    aws.String(req.HTMLContent),
				Charset: aws.String("UTF-8"),
			},
		}
	}

	if req.TextContent != "" {
		if input.Message.Body == nil {
			input.Message.Body = &ses.Body{}
		}
		input.Message.Body.Text = &ses.Content{
			Data:    aws.String(req.TextContent),
			Charset: aws.String("UTF-8"),
		}
	}

	// Add reply-to if specified
	if req.ReplyTo != "" {
		input.ReplyToAddresses = []*string{aws.String(req.ReplyTo)}
	}

	// Send email
	result, err := p.client.SendEmailWithContext(ctx, input)
	if err != nil {
		return &EmailResponse{
			Status:    "failed",
			Provider:  p.Name(),
			Error:     err.Error(),
			SentAt:    time.Now(),
		}, fmt.Errorf("%w: %v", ErrSendFailed, err)
	}

	return &EmailResponse{
		MessageID: *result.MessageId,
		Status:    "sent",
		Provider:  p.Name(),
		SentAt:    time.Now(),
	}, nil
}

// Validate validates the SES configuration
func (p *SESProvider) Validate() error {
	if p.from == "" {
		return fmt.Errorf("%w: missing from email", ErrInvalidConfig)
	}

	if p.region == "" {
		return fmt.Errorf("%w: missing region", ErrInvalidConfig)
	}

	return nil
}

// Health checks if SES is healthy
func (p *SESProvider) Health(ctx context.Context) error {
	// Check SES sending statistics as a health check
	_, err := p.client.GetSendStatisticsWithContext(ctx, &ses.GetSendStatisticsInput{})
	if err != nil {
		return fmt.Errorf("%w: SES health check failed: %v", ErrProviderUnhealthy, err)
	}

	return nil
}

// Close closes the SES provider (no cleanup needed)
func (p *SESProvider) Close() error {
	// SES client doesn't need explicit cleanup
	return nil
} 