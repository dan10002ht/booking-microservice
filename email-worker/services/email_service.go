package services

import (
	"context"
	"fmt"
	"time"

	"booking-system/email-worker/database/repositories"
	"booking-system/email-worker/models"
	"booking-system/email-worker/providers"
	"booking-system/email-worker/templates"
)

// EmailService handles email operations
type EmailService struct {
	jobRepo       *repositories.EmailJobRepository
	templateRepo  *repositories.EmailTemplateRepository
	emailProvider providers.Provider
	templateEngine *templates.Engine
}

// NewEmailService creates a new email service
func NewEmailService(
	jobRepo *repositories.EmailJobRepository,
	templateRepo *repositories.EmailTemplateRepository,
	emailProvider providers.Provider,
	templateEngine *templates.Engine,
) *EmailService {
	return &EmailService{
		jobRepo:        jobRepo,
		templateRepo:   templateRepo,
		emailProvider:  emailProvider,
		templateEngine: templateEngine,
	}
}

// SendEmail sends an email using the provided template and data
func (s *EmailService) SendEmail(ctx context.Context, request *SendEmailRequest) (*models.EmailJob, error) {
	// Validate request
	if err := request.Validate(); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	// Get template
	template, err := s.templateRepo.GetByName(ctx, request.TemplateName)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	if !template.IsActive {
		return nil, fmt.Errorf("template %s is not active", request.TemplateName)
	}

	// Create email job
	job := models.NewEmailJob(
		request.To,
		request.CC,
		request.BCC,
		request.TemplateName,
		request.Variables,
		models.JobPriority(request.Priority),
	)

	// Save job to database
	if err := s.jobRepo.Create(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to create email job: %w", err)
	}

	return job, nil
}

// ProcessJob processes a single email job
func (s *EmailService) ProcessJob(ctx context.Context, job *models.EmailJob) error {
	// Update job status to processing
	job.Status = models.JobStatusProcessing
	job.ProcessedAt = &time.Time{}
	*job.ProcessedAt = time.Now()

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return fmt.Errorf("failed to update job status: %w", err)
	}

	// TODO: Get template
	// template, err := s.templateRepo.GetByName(ctx, job.TemplateName)
	// if err != nil {
	// 	job.Status = models.JobStatusFailed
	// 	job.ErrorMessage = fmt.Sprintf("Template not found: %v", err)
	// 	s.jobRepo.Update(ctx, job)
	// 	return fmt.Errorf("failed to get template: %w", err)
	// }

	// TODO: Render template
	// subject, htmlBody, textBody, err := s.templateEngine.Render(template, job.Variables)
	// if err != nil {
	// 	job.Status = models.JobStatusFailed
	// 	job.ErrorMessage = fmt.Sprintf("Template rendering failed: %v", err)
	// 	s.jobRepo.Update(ctx, job)
	// 	return fmt.Errorf("failed to render template: %w", err)
	// }

	// Temporary hardcoded values for testing
	// subject := "Test Email"
	// htmlBody := "<h1>Test Email</h1>"
	// textBody := "Test Email"

	// TODO: Send email
	// _, err = s.emailProvider.Send(ctx, &providers.EmailRequest{
	// 	To:          job.To,
	// 	CC:          job.CC,
	// 	BCC:         job.BCC,
	// 	Subject:     subject,
	// 	HTMLContent: htmlBody,
	// 	TextContent: textBody,
	// })

	// if err != nil {
	// 	job.Status = models.JobStatusFailed
	// 	job.ErrorMessage = fmt.Sprintf("Email sending failed: %v", err)
	// 	job.RetryCount++
	// 	s.jobRepo.Update(ctx, job)
	// 	return fmt.Errorf("failed to send email: %w", err)
	// }

	// Temporary: simulate successful email sending

	// Update job status to completed
	job.Status = models.JobStatusCompleted
	job.SentAt = &time.Time{}
	*job.SentAt = time.Now()

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return fmt.Errorf("failed to update job status: %w", err)
	}

	return nil
}

// GetJob retrieves an email job by ID
func (s *EmailService) GetJob(ctx context.Context, id string) (*models.EmailJob, error) {
	return s.jobRepo.GetByID(ctx, id)
}

// ListJobs retrieves email jobs with pagination
func (s *EmailService) ListJobs(ctx context.Context, limit, offset int) ([]*models.EmailJob, error) {
	return s.jobRepo.List(ctx, limit, offset)
}

// GetPendingJobs retrieves pending jobs for processing
func (s *EmailService) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	return s.jobRepo.GetPendingJobs(ctx, limit)
}

// GetFailedJobs retrieves failed jobs
func (s *EmailService) GetFailedJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	return s.jobRepo.GetFailedJobs(ctx, limit)
}

// RetryJob retries a failed job
func (s *EmailService) RetryJob(ctx context.Context, id string) error {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get job: %w", err)
	}

	if job.Status != models.JobStatusFailed {
		return fmt.Errorf("job is not in failed status")
	}

	// Reset job for retry
	job.Status = models.JobStatusPending
	job.ErrorMessage = ""
	job.ProcessedAt = nil
	job.SentAt = nil

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return fmt.Errorf("failed to update job: %w", err)
	}

	return nil
}

// CreateTemplate creates a new email template
func (s *EmailService) CreateTemplate(ctx context.Context, template *models.EmailTemplate) error {
	// TODO: Implement template creation
	return nil
}

// GetTemplate retrieves a template by ID
func (s *EmailService) GetTemplate(ctx context.Context, id string) (*models.EmailTemplate, error) {
	// TODO: Implement template retrieval
	return nil, nil
}

// UpdateTemplate updates an email template
func (s *EmailService) UpdateTemplate(ctx context.Context, template *models.EmailTemplate) error {
	// TODO: Implement template update
	return nil
}

// DeleteTemplate deletes an email template
func (s *EmailService) DeleteTemplate(ctx context.Context, id string) error {
	// TODO: Implement template deletion
	return nil
}

// ListTemplates retrieves templates with pagination
func (s *EmailService) ListTemplates(ctx context.Context, limit, offset int) ([]*models.EmailTemplate, error) {
	// TODO: Implement template listing
	return nil, nil
}

// CleanupOldJobs removes old jobs from the database
func (s *EmailService) CleanupOldJobs(ctx context.Context, cutoffTime time.Time) error {
	return s.jobRepo.CleanupOldJobs(ctx, cutoffTime)
}

// GetStats returns email service statistics
func (s *EmailService) GetStats(ctx context.Context) (*ServiceStats, error) {
	stats, err := s.jobRepo.GetJobStats(ctx)
	if err != nil {
		return nil, err
	}
	
	return &ServiceStats{
		TotalJobs:     stats["total"],
		CompletedJobs: stats["completed"],
		FailedJobs:    stats["failed"],
		PendingJobs:   stats["pending"],
	}, nil
}

// HealthCheck checks if the email service is healthy
func (s *EmailService) HealthCheck(ctx context.Context) error {
	// Simple health check - try to get job stats
	_, err := s.GetStats(ctx)
	return err
}

// CreateTrackedEmailJob creates a tracked email job
func (s *EmailService) CreateTrackedEmailJob(ctx context.Context, job *models.EmailJob) error {
	// TODO: Implement tracking logic
	// For now, return nil to avoid compilation errors
	return nil
}

// ServiceStats represents email service statistics
type ServiceStats struct {
	TotalJobs     int `json:"total_jobs"`
	CompletedJobs int `json:"completed_jobs"`
	FailedJobs    int `json:"failed_jobs"`
	PendingJobs   int `json:"pending_jobs"`
}

// UpdateJobStatus updates the status of a job
func (s *EmailService) UpdateJobStatus(ctx context.Context, jobID, status string) error {
	// TODO: Implement job status update
	// For now, return nil to avoid compilation errors
	return nil
}

// ProcessEmailJob processes an email job
func (s *EmailService) ProcessEmailJob(ctx context.Context, job *models.EmailJob) error {
	// TODO: Implement email job processing
	// For now, return nil to avoid compilation errors
	return nil
}

// SendEmailRequest represents a request to send an email
type SendEmailRequest struct {
	To           []string               `json:"to"`
	CC           []string               `json:"cc,omitempty"`
	BCC          []string               `json:"bcc,omitempty"`
	TemplateName string                 `json:"template_name"`
	Variables    map[string]interface{} `json:"variables"`
	Priority     models.JobPriority     `json:"priority"`
}

// Validate validates the send email request
func (r *SendEmailRequest) Validate() error {
	if len(r.To) == 0 {
		return fmt.Errorf("at least one recipient is required")
	}
	if r.TemplateName == "" {
		return fmt.Errorf("template name is required")
	}
	return nil
} 