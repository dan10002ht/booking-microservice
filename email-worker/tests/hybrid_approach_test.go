package tests

import (
	"testing"
	"time"

	"booking-system/email-worker/models"
)

func TestHybridApproach(t *testing.T) {
	t.Run("Fast Path - Regular Emails", func(t *testing.T) {
		// Test regular emails that should NOT be tracked
		testCases := []struct {
			name     string
			jobType  string
			priority int
			expected bool
		}{
			{"welcome_email", "welcome_email", 0, false},
			{"notification", "notification", 0, false},
			{"newsletter", "newsletter", 0, false},
			{"marketing", "marketing", 0, false},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				job := models.NewEmailJob(tc.jobType, "user@example.com")
				job.SetPriority(tc.priority)

				if job.ShouldBeTracked() != tc.expected {
					t.Errorf("Expected ShouldBeTracked() to be %t for %s, got %t", 
						tc.expected, tc.jobType, job.ShouldBeTracked())
				}

				// Verify it's not tracked by default
				if job.IsTracked {
					t.Errorf("Expected IsTracked to be false for %s", tc.jobType)
				}
			})
		}
	})

	t.Run("Tracked Path - Important Emails", func(t *testing.T) {
		// Test important emails that SHOULD be tracked
		testCases := []struct {
			name     string
			jobType  string
			priority int
			expected bool
		}{
			{"email_verification", "email_verification", 0, true},
			{"password_reset", "password_reset", 0, true},
			{"payment_confirmation", "payment_confirmation", 0, true},
			{"booking_confirmation", "booking_confirmation", 0, true},
			{"invoice_generated", "invoice_generated", 0, true},
			{"organization_invitation", "organization_invitation", 0, true},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				job := models.NewEmailJob(tc.jobType, "user@example.com")
				job.SetPriority(tc.priority)

				if job.ShouldBeTracked() != tc.expected {
					t.Errorf("Expected ShouldBeTracked() to be %t for %s, got %t", 
						tc.expected, tc.jobType, job.ShouldBeTracked())
				}
			})
		}
	})

	t.Run("High Priority Emails", func(t *testing.T) {
		// Test that high priority emails are tracked regardless of type
		job := models.NewEmailJob("notification", "user@example.com")
		job.SetPriority(2) // High priority

		if !job.ShouldBeTracked() {
			t.Errorf("Expected high priority email to be tracked")
		}
	})

	t.Run("Scheduled Emails", func(t *testing.T) {
		// Test that scheduled emails are tracked
		job := models.NewEmailJob("reminder", "user@example.com")
		job.SetScheduledAt(time.Now().Add(1 * time.Hour))

		if !job.ShouldBeTracked() {
			t.Errorf("Expected scheduled email to be tracked")
		}
	})

	t.Run("Manual Tracking", func(t *testing.T) {
		// Test manual tracking override
		job := models.NewEmailJob("notification", "user@example.com")
		job.IsTracked = true // Manually set to tracked

		if !job.ShouldBeTracked() {
			t.Errorf("Expected manually tracked email to be tracked")
		}
	})
}

func TestEmailJobLifecycle(t *testing.T) {
	t.Run("Job Status Transitions", func(t *testing.T) {
		job := models.NewEmailJob("email_verification", "user@example.com")

		// Initial state
		if job.Status != "pending" {
			t.Errorf("Expected initial status to be 'pending', got %s", job.Status)
		}

		// Mark as processing
		job.MarkAsProcessing()
		if job.Status != "processing" {
			t.Errorf("Expected status to be 'processing', got %s", job.Status)
		}
		if job.ProcessingAt == nil {
			t.Errorf("Expected ProcessingAt to be set")
		}

		// Mark as completed
		job.MarkAsCompleted()
		if job.Status != "completed" {
			t.Errorf("Expected status to be 'completed', got %s", job.Status)
		}
		if job.CompletedAt == nil {
			t.Errorf("Expected CompletedAt to be set")
		}
	})

	t.Run("Retry Logic", func(t *testing.T) {
		job := models.NewEmailJob("email_verification", "user@example.com")
		job.SetMaxRetries(3)

		// Initial retry count
		if job.RetryCount != 0 {
			t.Errorf("Expected initial retry count to be 0, got %d", job.RetryCount)
		}

		// Can retry initially
		if !job.CanRetry() {
			t.Errorf("Expected job to be able to retry initially")
		}

		// Increment retries
		job.IncrementRetry()
		if job.RetryCount != 1 {
			t.Errorf("Expected retry count to be 1, got %d", job.RetryCount)
		}

		// Still can retry
		if !job.CanRetry() {
			t.Errorf("Expected job to be able to retry after 1 attempt")
		}

		// Max out retries
		job.IncrementRetry()
		job.IncrementRetry()
		job.IncrementRetry()

		// Cannot retry anymore
		if job.CanRetry() {
			t.Errorf("Expected job to not be able to retry after max attempts")
		}
	})

	t.Run("Scheduled Job Processing", func(t *testing.T) {
		// Job scheduled for future
		futureTime := time.Now().Add(1 * time.Hour)
		job := models.NewEmailJob("reminder", "user@example.com")
		job.SetScheduledAt(futureTime)

		// Should not be ready to process
		if job.IsReadyToProcess() {
			t.Errorf("Expected scheduled job to not be ready to process")
		}

		// Job scheduled for past
		pastTime := time.Now().Add(-1 * time.Hour)
		job.SetScheduledAt(pastTime)

		// Should be ready to process
		if !job.IsReadyToProcess() {
			t.Errorf("Expected past scheduled job to be ready to process")
		}

		// Job with no schedule
		job2 := models.NewEmailJob("notification", "user@example.com")
		if !job2.IsReadyToProcess() {
			t.Errorf("Expected unscheduled job to be ready to process")
		}
	})
}

func TestEmailJobTemplateHandling(t *testing.T) {
	t.Run("Template Setting", func(t *testing.T) {
		job := models.NewEmailJob("email_verification", "user@example.com")
		
		templateID := "email_verification"
		templateData := map[string]any{
			"user_name":        "John Doe",
			"verification_url": "https://example.com/verify?token=abc123",
		}

		job.SetTemplate(templateID, templateData)

		if job.TemplateID == nil || *job.TemplateID != templateID {
			t.Errorf("Expected template ID to be set to %s", templateID)
		}

		if job.TemplateData == nil || (*job.TemplateData)["user_name"] != "John Doe" {
			t.Errorf("Expected template data to be set correctly")
		}
	})

	t.Run("Subject Setting", func(t *testing.T) {
		job := models.NewEmailJob("email_verification", "user@example.com")
		
		subject := "Verify your email address"
		job.SetSubject(subject)

		if job.Subject == nil || *job.Subject != subject {
			t.Errorf("Expected subject to be set to %s", subject)
		}
	})
}

func TestEmailJobProcessingDuration(t *testing.T) {
	t.Run("Processing Duration Calculation", func(t *testing.T) {
		job := models.NewEmailJob("email_verification", "user@example.com")

		// No processing time if not started
		if job.GetProcessingDuration() != nil {
			t.Errorf("Expected no processing duration for unstarted job")
		}

		// Start processing
		job.MarkAsProcessing()
		time.Sleep(10 * time.Millisecond) // Simulate processing time

		// Complete processing
		job.MarkAsCompleted()

		duration := job.GetProcessingDuration()
		if duration == nil {
			t.Errorf("Expected processing duration to be calculated")
		}

		if *duration < 10*time.Millisecond {
			t.Errorf("Expected processing duration to be at least 10ms, got %v", duration)
		}
	})
}

// Benchmark tests for performance comparison
func BenchmarkFastPathJobCreation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		job := models.NewEmailJob("notification", "user@example.com")
		job.SetTemplate("notification", map[string]any{
			"user_name": "John Doe",
			"message":   "Test message",
		})
		job.SetSubject("Test Subject")
		_ = job.ShouldBeTracked() // Simulate decision making
	}
}

func BenchmarkTrackedPathJobCreation(b *testing.B) {
	for i := 0; i < b.N; i++ {
		job := models.NewEmailJob("email_verification", "user@example.com")
		job.SetTemplate("email_verification", map[string]any{
			"user_name":        "John Doe",
			"verification_url": "https://example.com/verify?token=abc123",
		})
		job.SetSubject("Verify your email")
		_ = job.ShouldBeTracked() // Simulate decision making
	}
} 