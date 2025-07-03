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
	"booking-system/email-worker/queue"
	"booking-system/email-worker/repositories"
	"booking-system/email-worker/services"
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
			PollInterval: "1s",
		},
		Email: config.EmailConfig{
			DefaultProvider: "mock", // Use mock provider for tests
			Providers: config.ProvidersConfig{
				SendGrid: config.SendGridConfig{
					APIKey:    "test_key",
					FromEmail: "test@example.com",
					FromName:  "Test System",
				},
			},
		},
		Worker: config.WorkerConfig{
			WorkerCount:     2,
			BatchSize:       5,
			PollInterval:    "500ms",
			MaxRetries:      3,
			RetryDelay:      "1s",
			ProcessTimeout:  "30s",
			CleanupInterval: "5m",
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
	jobRepo := repositories.NewEmailJobRepository(db)
	templateRepo := repositories.NewEmailTemplateRepository(db)
	trackingRepo := repositories.NewEmailTrackingRepository(db)

	// Initialize email service
	emailService := services.NewEmailService(cfg, jobRepo, templateRepo, trackingRepo, logger)

	// Initialize queue
	queueFactory := queue.NewQueueFactory(logger)
	queueInstance, err := queueFactory.CreateQueue(cfg.Queue)
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
		job := &models.EmailJob{
			JobType:        "verification",
			RecipientEmail: "test@example.com",
			Subject:        stringPtr("Test Email"),
			TemplateID:     stringPtr("email_verification"),
			TemplateData: &map[string]any{
				"Name":            "John Doe",
				"VerificationURL": "https://example.com/verify?token=123",
			},
			Priority: 1,
		}

		// Create job in database
		err := emailService.CreateEmailJob(context.Background(), job)
		require.NoError(t, err)
		assert.NotNil(t, job.ID)

		// Push job to queue
		err = queueInstance.Push(context.Background(), job)
		require.NoError(t, err)

		// Wait for job to be processed
		time.Sleep(2 * time.Second)

		// Check job status
		processedJob, err := emailService.GetEmailJob(context.Background(), job.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", processedJob.Status)

		// Check tracking
		tracking, err := emailService.GetEmailTracking(context.Background(), job.ID)
		require.NoError(t, err)
		assert.NotNil(t, tracking)
		assert.Equal(t, "sent", tracking.Status)
	})

	// Test 2: Process multiple jobs
	t.Run("ProcessMultipleJobs", func(t *testing.T) {
		// Create multiple jobs
		jobs := make([]*models.EmailJob, 5)
		for i := 0; i < 5; i++ {
			job := &models.EmailJob{
				JobType:        "welcome",
				RecipientEmail: fmt.Sprintf("user%d@example.com", i),
				Subject:        stringPtr("Welcome Email"),
				TemplateID:     stringPtr("welcome_email"),
				TemplateData: &map[string]any{
					"Name": fmt.Sprintf("User %d", i),
				},
				Priority: 0,
			}

			err := emailService.CreateEmailJob(context.Background(), job)
			require.NoError(t, err)

			err = queueInstance.Push(context.Background(), job)
			require.NoError(t, err)

			jobs[i] = job
		}

		// Wait for all jobs to be processed
		time.Sleep(3 * time.Second)

		// Check all jobs are completed
		for _, job := range jobs {
			processedJob, err := emailService.GetEmailJob(context.Background(), job.ID)
			require.NoError(t, err)
			assert.Equal(t, "completed", processedJob.Status)
		}
	})

	// Test 3: Test retry logic
	t.Run("TestRetryLogic", func(t *testing.T) {
		// Create a job that will fail (using invalid template)
		job := &models.EmailJob{
			JobType:        "verification",
			RecipientEmail: "test@example.com",
			Subject:        stringPtr("Test Email"),
			TemplateID:     stringPtr("invalid_template"),
			TemplateData: &map[string]any{
				"Name": "John Doe",
			},
			MaxRetries: 2,
		}

		err := emailService.CreateEmailJob(context.Background(), job)
		require.NoError(t, err)

		err = queueInstance.Push(context.Background(), job)
		require.NoError(t, err)

		// Wait for retries to complete
		time.Sleep(5 * time.Second)

		// Check job status (should be failed after retries)
		processedJob, err := emailService.GetEmailJob(context.Background(), job.ID)
		require.NoError(t, err)
		assert.Equal(t, "failed", processedJob.Status)
		assert.Equal(t, 2, processedJob.RetryCount)
	})

	// Test 4: Test priority processing
	t.Run("TestPriorityProcessing", func(t *testing.T) {
		// Create jobs with different priorities
		lowPriorityJob := &models.EmailJob{
			JobType:        "welcome",
			RecipientEmail: "low@example.com",
			Subject:        stringPtr("Low Priority"),
			TemplateID:     stringPtr("welcome_email"),
			TemplateData: &map[string]any{
				"Name": "Low Priority User",
			},
			Priority: 0,
		}

		highPriorityJob := &models.EmailJob{
			JobType:        "verification",
			RecipientEmail: "high@example.com",
			Subject:        stringPtr("High Priority"),
			TemplateID:     stringPtr("email_verification"),
			TemplateData: &map[string]any{
				"Name":            "High Priority User",
				"VerificationURL": "https://example.com/verify?token=high",
			},
			Priority: 10,
		}

		// Create and push low priority job first
		err := emailService.CreateEmailJob(context.Background(), lowPriorityJob)
		require.NoError(t, err)
		err = queueInstance.Push(context.Background(), lowPriorityJob)
		require.NoError(t, err)

		// Wait a bit
		time.Sleep(500 * time.Millisecond)

		// Create and push high priority job
		err = emailService.CreateEmailJob(context.Background(), highPriorityJob)
		require.NoError(t, err)
		err = queueInstance.Push(context.Background(), highPriorityJob)
		require.NoError(t, err)

		// Wait for processing
		time.Sleep(2 * time.Second)

		// Both should be completed
		lowJob, err := emailService.GetEmailJob(context.Background(), lowPriorityJob.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", lowJob.Status)

		highJob, err := emailService.GetEmailJob(context.Background(), highPriorityJob.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", highJob.Status)
	})

	// Test 5: Test scheduled emails
	t.Run("TestScheduledEmails", func(t *testing.T) {
		// Create a job scheduled for 1 second from now
		scheduledTime := time.Now().Add(1 * time.Second)
		job := &models.EmailJob{
			JobType:        "welcome",
			RecipientEmail: "scheduled@example.com",
			Subject:        stringPtr("Scheduled Email"),
			TemplateID:     stringPtr("welcome_email"),
			TemplateData: &map[string]any{
				"Name": "Scheduled User",
			},
			ScheduledAt: &scheduledTime,
		}

		err := emailService.CreateEmailJob(context.Background(), job)
		require.NoError(t, err)

		err = queueInstance.Push(context.Background(), job)
		require.NoError(t, err)

		// Check job is pending initially
		initialJob, err := emailService.GetEmailJob(context.Background(), job.ID)
		require.NoError(t, err)
		assert.Equal(t, "pending", initialJob.Status)

		// Wait for scheduled time + processing time
		time.Sleep(3 * time.Second)

		// Check job is completed
		processedJob, err := emailService.GetEmailJob(context.Background(), job.ID)
		require.NoError(t, err)
		assert.Equal(t, "completed", processedJob.Status)
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

	jobRepo := repositories.NewEmailJobRepository(db)
	templateRepo := repositories.NewEmailTemplateRepository(db)
	trackingRepo := repositories.NewEmailTrackingRepository(db)
	emailService := services.NewEmailService(cfg, jobRepo, templateRepo, trackingRepo, logger)

	// Test template CRUD operations
	t.Run("TemplateCRUD", func(t *testing.T) {
		// Create template
		template := &models.EmailTemplate{
			ID:           "test_template",
			Name:         "Test Template",
			Subject:      "Test Subject",
			HTMLTemplate: "<h1>Hello {{.Name}}</h1>",
			TextTemplate: "Hello {{.Name}}",
			Variables: &map[string]any{
				"Name": "string",
			},
			IsActive: true,
		}

		err := emailService.CreateEmailTemplate(context.Background(), template)
		require.NoError(t, err)

		// Get template
		retrievedTemplate, err := emailService.GetEmailTemplate(context.Background(), "test_template")
		require.NoError(t, err)
		assert.Equal(t, template.Name, retrievedTemplate.Name)
		assert.Equal(t, template.Subject, retrievedTemplate.Subject)

		// Update template
		template.Subject = "Updated Subject"
		err = emailService.UpdateEmailTemplate(context.Background(), template)
		require.NoError(t, err)

		// Verify update
		updatedTemplate, err := emailService.GetEmailTemplate(context.Background(), "test_template")
		require.NoError(t, err)
		assert.Equal(t, "Updated Subject", updatedTemplate.Subject)

		// Delete template
		err = emailService.DeleteEmailTemplate(context.Background(), "test_template")
		require.NoError(t, err)

		// Verify deletion
		_, err = emailService.GetEmailTemplate(context.Background(), "test_template")
		assert.Error(t, err)
	})
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func runMigrations(db *database.DB) error {
	// This would run the actual migrations
	// For now, we'll assume the database is already set up
	return nil
} 