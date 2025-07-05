package services

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"booking-system/email-worker/models"
	"booking-system/email-worker/repositories"
)

// EmailVerificationService handles email verification operations
type EmailVerificationService struct {
	emailJobRepo repositories.EmailJobRepository
	emailService EmailService
}

// VerificationData holds the data needed for email verification
type VerificationData struct {
	UserID         string
	UserEmail      string
	UserName       string
	PinCode        string
	ExpiryTime     int // in minutes
	VerificationURL string
}

// NewEmailVerificationService creates a new email verification service
func NewEmailVerificationService(
	emailJobRepo repositories.EmailJobRepository,
	emailService EmailService,
) *EmailVerificationService {
	return &EmailVerificationService{
		emailJobRepo: emailJobRepo,
		emailService: emailService,
	}
}

// GeneratePinCode generates a random 6-digit PIN code
func (s *EmailVerificationService) GeneratePinCode() (string, error) {
	// Generate a random 6-digit number
	max := big.NewInt(999999)
	min := big.NewInt(100000)
	
	randomNum, err := rand.Int(rand.Reader, new(big.Int).Sub(max, min))
	if err != nil {
		return "", fmt.Errorf("failed to generate random number: %w", err)
	}
	
	// Add min to get a number between 100000 and 999999
	pinCode := new(big.Int).Add(randomNum, min)
	
	return pinCode.String(), nil
}

// SendVerificationEmail sends an email verification with PIN code
func (s *EmailVerificationService) SendVerificationEmail(ctx context.Context, data VerificationData) error {
	// Generate PIN code if not provided
	if data.PinCode == "" {
		pinCode, err := s.GeneratePinCode()
		if err != nil {
			return fmt.Errorf("failed to generate PIN code: %w", err)
		}
		data.PinCode = pinCode
	}

	// Set default expiry time if not provided
	if data.ExpiryTime == 0 {
		data.ExpiryTime = 15 // 15 minutes default
	}

	// Prepare template variables
	variables := map[string]any{
		"UserName":        data.UserName,
		"UserEmail":       data.UserEmail,
		"PinCode":         data.PinCode,
		"ExpiryTime":      data.ExpiryTime,
		"VerificationURL": data.VerificationURL,
	}

	// Create email job
	emailJob := models.NewEmailJob(
		[]string{data.UserEmail}, // To
		nil,                      // CC
		nil,                      // BCC
		"email_verification",     // Template name
		variables,                // Variables
		models.JobPriorityHigh,   // High priority for verification emails
	)

	// Set user ID for tracking
	emailJob.SetQueueID(data.UserID)

	// Save email job to database
	if err := s.emailJobRepo.Create(ctx, emailJob); err != nil {
		return fmt.Errorf("failed to create email job: %w", err)
	}

	// Send email immediately
	_, err := s.emailService.SendEmail(ctx, &SendEmailRequest{
		To:           []string{data.UserEmail},
		CC:           nil,
		BCC:          nil,
		TemplateName: "email_verification",
		Variables:    variables,
		Priority:     models.JobPriorityHigh,
	})
	if err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}

	return nil
}

// SendVerificationReminder sends a reminder email for unverified users
func (s *EmailVerificationService) SendVerificationReminder(ctx context.Context, data VerificationData) error {
	// Generate new PIN code for reminder
	pinCode, err := s.GeneratePinCode()
	if err != nil {
		return fmt.Errorf("failed to generate PIN code: %w", err)
	}
	data.PinCode = pinCode

	// Set expiry time for reminder
	data.ExpiryTime = 30 // 30 minutes for reminder

	// Prepare template variables
	variables := map[string]any{
		"UserName":        data.UserName,
		"UserEmail":       data.UserEmail,
		"PinCode":         data.PinCode,
		"ExpiryTime":      data.ExpiryTime,
		"VerificationURL": data.VerificationURL,
		"IsReminder":      true,
	}

	// Create email job with reminder template
	emailJob := models.NewEmailJob(
		[]string{data.UserEmail},
		nil,
		nil,
		"email_verification_reminder",
		variables,
		models.JobPriorityNormal,
	)

	// Set user ID for tracking
	emailJob.SetQueueID(data.UserID)

	// Save email job to database
	if err := s.emailJobRepo.Create(ctx, emailJob); err != nil {
		return fmt.Errorf("failed to create reminder email job: %w", err)
	}

	// Send email immediately
	_, err = s.emailService.SendEmail(ctx, &SendEmailRequest{
		To:           []string{data.UserEmail},
		CC:           nil,
		BCC:          nil,
		TemplateName: "email_verification_reminder",
		Variables:    variables,
		Priority:     models.JobPriorityNormal,
	})
	if err != nil {
		return fmt.Errorf("failed to send reminder email: %w", err)
	}

	return nil
}

// ValidatePinCode validates a PIN code (this would typically be implemented in auth-service)
func (s *EmailVerificationService) ValidatePinCode(pinCode string, expectedPinCode string, expiryTime time.Time) bool {
	// Check if PIN code matches
	if pinCode != expectedPinCode {
		return false
	}

	// Check if PIN code has expired
	if time.Now().After(expiryTime) {
		return false
	}

	return true
}

// GetVerificationURL generates a verification URL
func (s *EmailVerificationService) GetVerificationURL(baseURL, userID, pinCode string) string {
	return fmt.Sprintf("%s/verify-email?user_id=%s&code=%s", baseURL, userID, pinCode)
} 