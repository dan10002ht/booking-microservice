package integration

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"booking-system/email-worker/config"
	"booking-system/email-worker/database"
	"booking-system/email-worker/models"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/providers"
	"booking-system/email-worker/queue"
	"booking-system/email-worker/repositories"
	"booking-system/email-worker/services"
	"booking-system/email-worker/templates"
)

// TestEmailWorkerIntegration tests the complete email worker flow
func TestEmailWorkerIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup test environment
	logger := zap.NewNop()
	
	// Test configuration
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     5432,
			Name:     "email_worker_test",
			User:     "postgres",
			Password: "password",
			SSLMode:  "disable",
		},
		Queue: config.QueueConfig{
			Type:        "redis",
			Host:        "localhost",
			Port:        6379,
			Password:    "",
			Database:    1, // Use different DB for tests
			QueueName:   "email-jobs-test",
			BatchSize:   10,
			PollInterval: time.Second,
		},
		Email: config.EmailConfig{
			DefaultProvider: "mock", // Use mock provider for tests
		},
		Worker: config.WorkerConfig{
			WorkerCount:     2,
			BatchSize:       5,
			PollInterval:    500 * time.Millisecond,
			MaxRetries:      3,
			RetryDelay:      time.Second,
			ProcessTimeout:  30 * time.Second,
			CleanupInterval: 5 * time.Minute,
		},
	}

	// Initialize database
	db, err := database.NewConnection(cfg.Database)
	require.NoError(t, err)
	defer db.Close()

	// Run migrations
	err = runMigrations(db)
	require.NoError(t, err)

	// Initialize repositories
	jobRepo := repositories.NewEmailJobRepository(db.GetSQLDB(), logger)
	templateRepo := repositories.NewEmailTemplateRepository(db.GetSQLDB(), logger)

	// Initialize template engine
	templateEngine := templates.NewEngine()

	// Initialize mock email provider
	mockProvider := &MockEmailProvider{}

	// Initialize email service
	emailService := services.NewEmailService(jobRepo, templateRepo, mockProvider, templateEngine)

	// Initialize queue
	queueFactory := queue.NewQueueFactory(logger)
	queueConfig := queue.QueueConfig{
		Type:         cfg.Queue.Type,
		Host:         cfg.Queue.Host,
		Port:         cfg.Queue.Port,
		Password:     cfg.Queue.Password,
		Database:     cfg.Queue.Database,
		QueueName:    cfg.Queue.QueueName,
		BatchSize:    cfg.Queue.BatchSize,
		PollInterval: cfg.Queue.PollInterval.String(),
	}
	queueInstance, err := queueFactory.CreateQueue(queueConfig)
	require.NoError(t, err)
	defer queueInstance.Close()

	// Initialize processor
	processorConfig := &processor.ProcessorConfig{
		WorkerCount:     cfg.Worker.WorkerCount,
		BatchSize:       cfg.Worker.BatchSize,
		PollInterval:    cfg.Worker.PollInterval,
		MaxRetries:      cfg.Worker.MaxRetries,
		RetryDelay:      cfg.Worker.RetryDelay,
		ProcessTimeout:  cfg.Worker.ProcessTimeout,
		CleanupInterval: cfg.Worker.CleanupInterval,
	}

	emailProcessor := processor.NewProcessor(queueInstance, emailService, processorConfig, logger)

	// Start processor
	err = emailProcessor.Start()
	require.NoError(t, err)
	defer emailProcessor.Stop()

	// Test 1: Create and process email job
	t.Run("CreateAndProcessEmailJob", func(t *testing.T) {
		// Create email job
		job := models.NewEmailJob(
			[]string{"test@example.com"},
			nil, // CC
			nil, // BCC
			"email_verification",
			map[string]any{
				"Name":            "John Doe",
				"VerificationURL": "https://example.com/verify?token=123",
			},
			models.JobPriorityNormal,
		)

		// Save job to database
		err := jobRepo.Create(context.Background(), job)
		require.NoError(t, err)
		assert.NotNil(t, job.ID)

		// Push job to queue
		err = queueInstance.Publish(context.Background(), job)
		require.NoError(t, err)

		// Wait for job to be processed
		time.Sleep(2 * time.Second)

		// Check job status
		processedJob, err := jobRepo.GetByID(context.Background(), job.ID)
		require.NoError(t, err)
		assert.Equal(t, string(models.JobStatusCompleted), processedJob.Status)
	})

	// Test 2: Process multiple jobs
	t.Run("ProcessMultipleJobs", func(t *testing.T) {
		// Create multiple jobs
		jobs := make([]*models.EmailJob, 5)
		for i := 0; i < 5; i++ {
			job := models.NewEmailJob(
				[]string{fmt.Sprintf("user%d@example.com", i)},
				nil, // CC
				nil, // BCC
				"welcome_email",
				map[string]any{
					"Name": fmt.Sprintf("User %d", i),
				},
				models.JobPriorityNormal,
			)

			err := jobRepo.Create(context.Background(), job)
			require.NoError(t, err)

			err = queueInstance.Publish(context.Background(), job)
			require.NoError(t, err)

			jobs[i] = job
		}

		// Wait for all jobs to be processed
		time.Sleep(3 * time.Second)

		// Check all jobs are completed
		for _, job := range jobs {
			processedJob, err := jobRepo.GetByID(context.Background(), job.ID)
			require.NoError(t, err)
			assert.Equal(t, string(models.JobStatusCompleted), processedJob.Status)
		}
	})
}

// TestEmailTemplateManagement tests template CRUD operations
func TestEmailTemplateManagement(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	logger := zap.NewNop()
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     5432,
			Name:     "email_worker_test",
			User:     "postgres",
			Password: "password",
			SSLMode:  "disable",
		},
	}

	db, err := database.NewConnection(cfg.Database)
	require.NoError(t, err)
	defer db.Close()

	jobRepo := repositories.NewEmailJobRepository(db.GetSQLDB(), logger)
	templateRepo := repositories.NewEmailTemplateRepository(db.GetSQLDB(), logger)
	templateEngine := templates.NewEngine()
	mockProvider := &MockEmailProvider{}
	emailService := services.NewEmailService(jobRepo, templateRepo, mockProvider, templateEngine)

	// Test template CRUD operations
	t.Run("TemplateCRUD", func(t *testing.T) {
		// Create template
		template := models.NewEmailTemplate("test_template", "Test Template")
		template.SetSubject("Test Subject")
		template.SetHTMLTemplate("<h1>Hello {{.Name}}</h1>")
		template.SetTextTemplate("Hello {{.Name}}")
		template.SetVariables(map[string]string{"Name": "string"})

		err := templateRepo.Create(context.Background(), template)
		require.NoError(t, err)

		// Get template
		retrievedTemplate, err := templateRepo.GetByID(context.Background(), "test_template")
		require.NoError(t, err)
		assert.Equal(t, template.Name, retrievedTemplate.Name)
		assert.Equal(t, *template.Subject, *retrievedTemplate.Subject)

		// Update template
		template.SetSubject("Updated Subject")
		err = templateRepo.Update(context.Background(), template)
		require.NoError(t, err)

		// Verify update
		updatedTemplate, err := templateRepo.GetByID(context.Background(), "test_template")
		require.NoError(t, err)
		assert.Equal(t, "Updated Subject", *updatedTemplate.Subject)

		// Delete template
		err = templateRepo.Delete(context.Background(), "test_template")
		require.NoError(t, err)

		// Verify deletion
		_, err = templateRepo.GetByID(context.Background(), "test_template")
		assert.Error(t, err)
	})
}

// MockEmailProvider is a mock email provider for testing
type MockEmailProvider struct{}

func (m *MockEmailProvider) Send(ctx context.Context, request *providers.EmailRequest) (*providers.EmailResponse, error) {
	// Mock successful email sending
	return &providers.EmailResponse{
		MessageID: "mock-message-id",
		Status:    "sent",
	}, nil
}

// Helper functions
func runMigrations(db *database.DB) error {
	// This would run the actual migrations
	// For now, we'll assume the database is already set up
	return nil
}