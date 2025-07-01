package services

import (
	"context"
	"fmt"
	"time"

	"booking-system/email-worker/database/models"
	"booking-system/email-worker/database/repositories"
	"booking-system/email-worker/providers"
	"booking-system/email-worker/templates"
)

// EmailService handles email operations
type EmailService struct {
	jobRepo        *repositories.EmailJobRepository
	templateRepo   *repositories.EmailTemplateRepository
	provider       providers.Provider
	renderer       *templates.TemplateRenderer
	config         map[string]interface{}
}

// NewEmailService creates a new email service
func NewEmailService(
	jobRepo *repositories.EmailJobRepository,
	templateRepo *repositories.EmailTemplateRepository,
	provider providers.Provider,
	config map[string]interface{},
) *EmailService {
	return &EmailService{
		jobRepo:      jobRepo,
		templateRepo: templateRepo,
		provider:     provider,
		renderer:     templates.NewTemplateRenderer(),
		config:       config,
	}
}

// CreateEmailJob creates a new email job
func (s *EmailService) CreateEmailJob(ctx context.Context, job *models.EmailJob) error {
	// Validate job
	if err := s.validateJob(job); err != nil {
		return fmt.Errorf("invalid job: %w", err)
	}

	// Set default values
	if job.Status == "" {
		job.Status = models.JobStatusPending
	}

	if job.Priority == 0 {
		job.Priority = models.PriorityNormal
	}

	if job.MaxRetries == 0 {
		job.MaxRetries = 3
	}

	// Create job in database
	if err := s.jobRepo.Create(ctx, job); err != nil {
		return fmt.Errorf("failed to create email job: %w", err)
	}

	return nil
}

// ProcessEmailJob processes a single email job
func (s *EmailService) ProcessEmailJob(ctx context.Context, job *models.EmailJob) error {
	// Update status to processing
	if err := s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusProcessing, "", nil); err != nil {
		return fmt.Errorf("failed to update job status: %w", err)
	}

	// Get template
	template, err := s.templateRepo.GetByName(ctx, job.TemplateID)
	if err != nil {
		errorMsg := fmt.Sprintf("template not found: %s", job.TemplateID)
		s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, errorMsg, nil)
		return fmt.Errorf("failed to get template: %w", err)
	}

	// Parse template data
	templateData, err := s.renderer.ParseTemplateData(job.TemplateData)
	if err != nil {
		errorMsg := fmt.Sprintf("invalid template data: %v", err)
		s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, errorMsg, nil)
		return fmt.Errorf("failed to parse template data: %w", err)
	}

	// Render email content
	subject, err := s.renderer.RenderSubject(template.Subject, templateData)
	if err != nil {
		errorMsg := fmt.Sprintf("failed to render subject: %v", err)
		s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, errorMsg, nil)
		return fmt.Errorf("failed to render subject: %w", err)
	}

	var htmlContent, textContent string
	if template.HTMLContent != "" {
		htmlContent, err = s.renderer.RenderHTML(template.HTMLContent, templateData)
		if err != nil {
			errorMsg := fmt.Sprintf("failed to render HTML: %v", err)
			s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, errorMsg, nil)
			return fmt.Errorf("failed to render HTML: %w", err)
		}
	}

	if template.TextContent != "" {
		textContent, err = s.renderer.RenderText(template.TextContent, templateData)
		if err != nil {
			errorMsg := fmt.Sprintf("failed to render text: %v", err)
			s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, errorMsg, nil)
			return fmt.Errorf("failed to render text: %w", err)
		}
	}

	// Create email request
	emailReq := &providers.EmailRequest{
		To:          job.Email,
		Subject:     subject,
		HTMLContent: htmlContent,
		TextContent: textContent,
		From:        s.getFromEmail(),
		FromName:    s.getFromName(),
	}

	// Send email
	_, err = s.provider.Send(ctx, emailReq)
	if err != nil {
		// Increment retry count
		s.jobRepo.IncrementRetryCount(ctx, job.ID)

		// Check if we should retry
		if job.RetryCount < job.MaxRetries {
			// Mark as failed but keep for retry
			s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, err.Error(), nil)
			return fmt.Errorf("failed to send email (will retry): %w", err)
		} else {
			// Max retries reached
			s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusFailed, err.Error(), nil)
			return fmt.Errorf("failed to send email (max retries reached): %w", err)
		}
	}

	// Update job status to sent
	sentAt := time.Now()
	if err := s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusSent, "", &sentAt); err != nil {
		return fmt.Errorf("failed to update job status: %w", err)
	}

	// TODO: Create email tracking record
	// s.createEmailTracking(ctx, job.ID, response)

	return nil
}

// GetPendingJobs retrieves pending jobs for processing
func (s *EmailService) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	return s.jobRepo.GetPendingJobs(ctx, limit)
}

// GetFailedJobs retrieves failed jobs for retry
func (s *EmailService) GetFailedJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	return s.jobRepo.GetFailedJobs(ctx, limit)
}

// RetryFailedJob retries a failed job
func (s *EmailService) RetryFailedJob(ctx context.Context, jobID int64) error {
	job, err := s.jobRepo.GetByID(ctx, jobID)
	if err != nil {
		return fmt.Errorf("failed to get job: %w", err)
	}

	if job.Status != models.JobStatusFailed {
		return fmt.Errorf("job is not in failed status")
	}

	if job.RetryCount >= job.MaxRetries {
		return fmt.Errorf("max retries reached for job")
	}

	// Reset status to pending for retry
	if err := s.jobRepo.UpdateStatus(ctx, job.ID, models.JobStatusPending, "", nil); err != nil {
		return fmt.Errorf("failed to reset job status: %w", err)
	}

	return nil
}

// GetJobByID retrieves a job by ID
func (s *EmailService) GetJobByID(ctx context.Context, jobID int64) (*models.EmailJob, error) {
	return s.jobRepo.GetByID(ctx, jobID)
}

// GetJobsByUser retrieves jobs for a specific user
func (s *EmailService) GetJobsByUser(ctx context.Context, userID string, limit int) ([]*models.EmailJob, error) {
	return s.jobRepo.GetJobsByUser(ctx, userID, limit)
}

// validateJob validates an email job
func (s *EmailService) validateJob(job *models.EmailJob) error {
	if job.Email == "" {
		return fmt.Errorf("email is required")
	}

	if job.TemplateID == "" {
		return fmt.Errorf("template ID is required")
	}

	if job.JobType == "" {
		return fmt.Errorf("job type is required")
	}

	// Validate job type
	validTypes := []string{
		models.JobTypeVerification,
		models.JobTypePasswordReset,
		models.JobTypeWelcome,
		models.JobTypeSecurity,
		models.JobTypeInvitation,
		models.JobTypeNotification,
	}

	valid := false
	for _, validType := range validTypes {
		if job.JobType == validType {
			valid = true
			break
		}
	}

	if !valid {
		return fmt.Errorf("invalid job type: %s", job.JobType)
	}

	return nil
}

// getFromEmail gets the from email from config
func (s *EmailService) getFromEmail() string {
	if from, ok := s.config["from"].(string); ok && from != "" {
		return from
	}
	return "noreply@bookingsystem.com"
}

// getFromName gets the from name from config
func (s *EmailService) getFromName() string {
	if fromName, ok := s.config["from_name"].(string); ok && fromName != "" {
		return fromName
	}
	return "Booking System"
}

// createEmailTracking creates an email tracking record
func (s *EmailService) createEmailTracking(ctx context.Context, jobID int64, response *providers.EmailResponse) error {
	// TODO: Implement email tracking
	// This would create a record in the email_tracking table
	return nil
} 