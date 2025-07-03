package unit

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"booking-system/email-worker/config"
	"booking-system/email-worker/models"
	"booking-system/email-worker/services"
)

// MockEmailJobRepository is a mock implementation of EmailJobRepository
type MockEmailJobRepository struct {
	mock.Mock
}

func (m *MockEmailJobRepository) Create(ctx context.Context, job *models.EmailJob) error {
	args := m.Called(ctx, job)
	return args.Error(0)
}

func (m *MockEmailJobRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.EmailJob, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailJob), args.Error(1)
}

func (m *MockEmailJobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockEmailJobRepository) GetPendingJobs(ctx context.Context, limit int) ([]*models.EmailJob, error) {
	args := m.Called(ctx, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.EmailJob), args.Error(1)
}

func (m *MockEmailJobRepository) IncrementRetryCount(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockEmailJobRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockEmailTemplateRepository is a mock implementation of EmailTemplateRepository
type MockEmailTemplateRepository struct {
	mock.Mock
}

func (m *MockEmailTemplateRepository) GetByID(ctx context.Context, id string) (*models.EmailTemplate, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailTemplate), args.Error(1)
}

func (m *MockEmailTemplateRepository) Create(ctx context.Context, template *models.EmailTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockEmailTemplateRepository) Update(ctx context.Context, template *models.EmailTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockEmailTemplateRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockEmailTemplateRepository) List(ctx context.Context, limit, offset int) ([]*models.EmailTemplate, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.EmailTemplate), args.Error(1)
}

// MockEmailTrackingRepository is a mock implementation of EmailTrackingRepository
type MockEmailTrackingRepository struct {
	mock.Mock
}

func (m *MockEmailTrackingRepository) Create(ctx context.Context, tracking *models.EmailTracking) error {
	args := m.Called(ctx, tracking)
	return args.Error(0)
}

func (m *MockEmailTrackingRepository) GetByJobID(ctx context.Context, jobID uuid.UUID) (*models.EmailTracking, error) {
	args := m.Called(ctx, jobID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailTracking), args.Error(1)
}

func (m *MockEmailTrackingRepository) UpdateStatus(ctx context.Context, jobID uuid.UUID, status string) error {
	args := m.Called(ctx, jobID, status)
	return args.Error(0)
}

func TestEmailService_CreateEmailJob(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{
		Email: config.EmailConfig{
			DefaultProvider: "sendgrid",
		},
	}

	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	job := &models.EmailJob{
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		TemplateID:     stringPtr("email_verification"),
		TemplateData: &map[string]any{
			"Name":            "John Doe",
			"VerificationURL": "https://example.com/verify?token=123",
		},
	}

	// Expectations
	mockJobRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.EmailJob")).Return(nil)

	// Execute
	err := svc.CreateEmailJob(context.Background(), job)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, job.ID)
	assert.Equal(t, "pending", job.Status)
	mockJobRepo.AssertExpectations(t)
}

func TestEmailService_ProcessJob(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{
		Email: config.EmailConfig{
			DefaultProvider: "sendgrid",
			Providers: config.ProvidersConfig{
				SendGrid: config.SendGridConfig{
					APIKey:    "test_key",
					FromEmail: "noreply@example.com",
					FromName:  "Test System",
				},
			},
		},
	}

	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	jobID := uuid.New()
	job := &models.EmailJob{
		ID:             jobID,
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		Subject:        stringPtr("Verify your email"),
		TemplateID:     stringPtr("email_verification"),
		TemplateData: &map[string]any{
			"Name":            "John Doe",
			"VerificationURL": "https://example.com/verify?token=123",
		},
		Status: "pending",
	}

	template := &models.EmailTemplate{
		ID:           "email_verification",
		Name:         "Email Verification",
		Subject:      "Verify your email address",
		HTMLTemplate: "<h1>Hello {{.Name}}</h1><p>Click <a href=\"{{.VerificationURL}}\">here</a> to verify.</p>",
		TextTemplate: "Hello {{.Name}}\nClick {{.VerificationURL}} to verify.",
		Variables: &map[string]any{
			"Name":            "string",
			"VerificationURL": "string",
		},
		IsActive: true,
	}

	// Expectations
	mockTemplateRepo.On("GetByID", mock.Anything, "email_verification").Return(template, nil)
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "processing").Return(nil)
	mockTrackingRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.EmailTracking")).Return(nil)
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "completed").Return(nil)

	// Execute
	err := svc.ProcessJob(context.Background(), job)

	// Assert
	assert.NoError(t, err)
	mockJobRepo.AssertExpectations(t)
	mockTemplateRepo.AssertExpectations(t)
	mockTrackingRepo.AssertExpectations(t)
}

func TestEmailService_ProcessJobWithRetry(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{
		Email: config.EmailConfig{
			DefaultProvider: "sendgrid",
			Providers: config.ProvidersConfig{
				SendGrid: config.SendGridConfig{
					APIKey:    "test_key",
					FromEmail: "noreply@example.com",
					FromName:  "Test System",
				},
			},
		},
	}

	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	jobID := uuid.New()
	job := &models.EmailJob{
		ID:             jobID,
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		Subject:        stringPtr("Verify your email"),
		TemplateID:     stringPtr("email_verification"),
		TemplateData: &map[string]any{
			"Name":            "John Doe",
			"VerificationURL": "https://example.com/verify?token=123",
		},
		Status:     "pending",
		RetryCount: 0,
		MaxRetries: 3,
	}

	template := &models.EmailTemplate{
		ID:           "email_verification",
		Name:         "Email Verification",
		Subject:      "Verify your email address",
		HTMLTemplate: "<h1>Hello {{.Name}}</h1><p>Click <a href=\"{{.VerificationURL}}\">here</a> to verify.</p>",
		TextTemplate: "Hello {{.Name}}\nClick {{.VerificationURL}} to verify.",
		Variables: &map[string]any{
			"Name":            "string",
			"VerificationURL": "string",
		},
		IsActive: true,
	}

	// Expectations - First attempt fails, second succeeds
	mockTemplateRepo.On("GetByID", mock.Anything, "email_verification").Return(template, nil).Once()
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "processing").Return(nil).Once()
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "failed").Return(nil).Once()
	mockJobRepo.On("IncrementRetryCount", mock.Anything, jobID).Return(nil).Once()

	// Second attempt
	mockTemplateRepo.On("GetByID", mock.Anything, "email_verification").Return(template, nil).Once()
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "processing").Return(nil).Once()
	mockTrackingRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.EmailTracking")).Return(nil).Once()
	mockJobRepo.On("UpdateStatus", mock.Anything, jobID, "completed").Return(nil).Once()

	// Execute
	err := svc.ProcessJobWithRetry(context.Background(), job)

	// Assert
	assert.NoError(t, err)
	mockJobRepo.AssertExpectations(t)
	mockTemplateRepo.AssertExpectations(t)
	mockTrackingRepo.AssertExpectations(t)
}

func TestEmailService_GetEmailJob(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	jobID := uuid.New()
	expectedJob := &models.EmailJob{
		ID:             jobID,
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		Status:         "completed",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Expectations
	mockJobRepo.On("GetByID", mock.Anything, jobID).Return(expectedJob, nil)

	// Execute
	job, err := svc.GetEmailJob(context.Background(), jobID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedJob, job)
	mockJobRepo.AssertExpectations(t)
}

func TestEmailService_GetEmailTemplate(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	templateID := "email_verification"
	expectedTemplate := &models.EmailTemplate{
		ID:           templateID,
		Name:         "Email Verification",
		Subject:      "Verify your email address",
		HTMLTemplate: "<h1>Hello {{.Name}}</h1>",
		TextTemplate: "Hello {{.Name}}",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Expectations
	mockTemplateRepo.On("GetByID", mock.Anything, templateID).Return(expectedTemplate, nil)

	// Execute
	template, err := svc.GetEmailTemplate(context.Background(), templateID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedTemplate, template)
	mockTemplateRepo.AssertExpectations(t)
}

func TestEmailService_CreateEmailTemplate(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	template := &models.EmailTemplate{
		ID:           "test_template",
		Name:         "Test Template",
		Subject:      "Test Subject",
		HTMLTemplate: "<h1>Test</h1>",
		TextTemplate: "Test",
		Variables: &map[string]any{
			"Name": "string",
		},
		IsActive: true,
	}

	// Expectations
	mockTemplateRepo.On("Create", mock.Anything, template).Return(nil)

	// Execute
	err := svc.CreateEmailTemplate(context.Background(), template)

	// Assert
	assert.NoError(t, err)
	mockTemplateRepo.AssertExpectations(t)
}

func TestEmailService_UpdateEmailTemplate(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	template := &models.EmailTemplate{
		ID:           "test_template",
		Name:         "Updated Test Template",
		Subject:      "Updated Test Subject",
		HTMLTemplate: "<h1>Updated Test</h1>",
		TextTemplate: "Updated Test",
		Variables: &map[string]any{
			"Name": "string",
		},
		IsActive: true,
	}

	// Expectations
	mockTemplateRepo.On("Update", mock.Anything, template).Return(nil)

	// Execute
	err := svc.UpdateEmailTemplate(context.Background(), template)

	// Assert
	assert.NoError(t, err)
	mockTemplateRepo.AssertExpectations(t)
}

func TestEmailService_DeleteEmailTemplate(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	templateID := "test_template"

	// Expectations
	mockTemplateRepo.On("Delete", mock.Anything, templateID).Return(nil)

	// Execute
	err := svc.DeleteEmailTemplate(context.Background(), templateID)

	// Assert
	assert.NoError(t, err)
	mockTemplateRepo.AssertExpectations(t)
}

func TestEmailService_GetEmailTracking(t *testing.T) {
	// Setup
	mockJobRepo := &MockEmailJobRepository{}
	mockTemplateRepo := &MockEmailTemplateRepository{}
	mockTrackingRepo := &MockEmailTrackingRepository{}
	logger := zap.NewNop()

	cfg := &config.Config{}
	svc := services.NewEmailService(cfg, mockJobRepo, mockTemplateRepo, mockTrackingRepo, logger)

	// Test data
	jobID := uuid.New()
	expectedTracking := &models.EmailTracking{
		ID:        uuid.New(),
		JobID:     jobID,
		Provider:  "sendgrid",
		MessageID: "test_message_id",
		Status:    "delivered",
		SentAt:    timePtr(time.Now()),
		CreatedAt: time.Now(),
	}

	// Expectations
	mockTrackingRepo.On("GetByJobID", mock.Anything, jobID).Return(expectedTracking, nil)

	// Execute
	tracking, err := svc.GetEmailTracking(context.Background(), jobID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedTracking, tracking)
	mockTrackingRepo.AssertExpectations(t)
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
} 