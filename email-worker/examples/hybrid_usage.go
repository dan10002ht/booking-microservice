package main

import (
	"fmt"
	"time"

	"booking-system/email-worker/models"
)

// Example demonstrating the hybrid approach:
// - Fast path: Queue-based processing for regular emails
// - Tracked path: Database + Queue for important emails

func main() {
	// Initialize your processor (this would be done in main.go)
	// processor := initializeProcessor()

	// Example 1: Fast path - Regular notification email (not tracked)
	fmt.Println("=== Example 1: Fast Path (Regular Email) ===")
	sendRegularEmail()

	// Example 2: Tracked path - Important email (tracked in database)
	fmt.Println("\n=== Example 2: Tracked Path (Important Email) ===")
	sendImportantEmail()

	// Example 3: Scheduled email
	fmt.Println("\n=== Example 3: Scheduled Email ===")
	sendScheduledEmail()

	// Example 4: High priority email
	fmt.Println("\n=== Example 4: High Priority Email ===")
	sendHighPriorityEmail()
}

// sendRegularEmail demonstrates the fast path for regular emails
func sendRegularEmail() {
	// Create a regular notification email (not tracked)
	job := models.NewEmailJob("notification", "user@example.com")
	job.SetTemplate("notification", map[string]any{
		"user_name": "John Doe",
		"message":   "Your booking has been updated",
	})
	job.SetSubject("Booking Update")

	// This job will be processed quickly via queue only
	// No database tracking, faster processing
	fmt.Printf("Regular email job created: %s\n", job.ID)
	fmt.Printf("Will be tracked: %t\n", job.ShouldBeTracked())
	fmt.Printf("Processing: Fast queue-based only\n")
}

// sendImportantEmail demonstrates the tracked path for important emails
func sendImportantEmail() {
	// Create an important email (automatically tracked)
	job := models.NewEmailJob("email_verification", "user@example.com")
	job.SetTemplate("email_verification", map[string]any{
		"user_name":        "John Doe",
		"verification_url": "https://example.com/verify?token=abc123",
	})
	job.SetSubject("Verify your email address")

	// This job will be tracked in database AND processed via queue
	// Important emails are automatically tracked
	fmt.Printf("Important email job created: %s\n", job.ID)
	fmt.Printf("Will be tracked: %t\n", job.ShouldBeTracked())
	fmt.Printf("Processing: Database tracking + Queue processing\n")
}

// sendScheduledEmail demonstrates scheduled email delivery
func sendScheduledEmail() {
	// Create a scheduled email
	job := models.NewEmailJob("reminder", "user@example.com")
	job.SetTemplate("reminder", map[string]any{
		"user_name": "John Doe",
		"event":     "Team Meeting",
		"time":      "2:00 PM",
	})
	job.SetSubject("Reminder: Team Meeting")
	
	// Schedule for tomorrow at 9 AM
	scheduledTime := time.Now().Add(24 * time.Hour).Truncate(time.Hour).Add(9 * time.Hour)
	job.SetScheduledAt(scheduledTime)

	// Scheduled emails are automatically tracked
	fmt.Printf("Scheduled email job created: %s\n", job.ID)
	fmt.Printf("Will be tracked: %t\n", job.ShouldBeTracked())
	fmt.Printf("Scheduled for: %s\n", scheduledTime.Format("2006-01-02 15:04:05"))
	fmt.Printf("Processing: Database tracking + Scheduled queue\n")
}

// sendHighPriorityEmail demonstrates high priority email
func sendHighPriorityEmail() {
	// Create a high priority email
	job := models.NewEmailJob("payment_confirmation", "user@example.com")
	job.SetTemplate("payment_confirmation", map[string]any{
		"user_name":     "John Doe",
		"amount":        "$99.99",
		"transaction_id": "TXN123456",
	})
	job.SetSubject("Payment Confirmation")
	job.SetPriority(3) // High priority

	// High priority emails are automatically tracked
	fmt.Printf("High priority email job created: %s\n", job.ID)
	fmt.Printf("Will be tracked: %t\n", job.ShouldBeTracked())
	fmt.Printf("Priority: %d\n", job.Priority)
	fmt.Printf("Processing: Database tracking + Priority queue\n")
}

// Example of how services would use the email worker
func exampleServiceUsage() {
	// In your auth service, booking service, etc.
	
	// For regular notifications (fast path)
	sendWelcomeNotification("user@example.com", "John Doe")
	
	// For important emails (tracked path)
	sendEmailVerification("user@example.com", "John Doe", "verification_token")
	sendPasswordReset("user@example.com", "reset_token")
	
	// For business-critical emails (tracked path)
	sendPaymentConfirmation("user@example.com", "John Doe", "$99.99", "TXN123")
	sendBookingConfirmation("user@example.com", "John Doe", "Event Name", "2024-01-15")
}

// Service functions that would be called from other services
func sendWelcomeNotification(email, userName string) {
	job := models.NewEmailJob("welcome", email)
	job.SetTemplate("welcome", map[string]any{
		"user_name": userName,
	})
	job.SetSubject("Welcome to our platform!")
	
	// Fast path - no tracking needed for welcome emails
	// publishToQueue(job)
}

func sendEmailVerification(email, userName, token string) {
	job := models.NewEmailJob("email_verification", email)
	job.SetTemplate("email_verification", map[string]any{
		"user_name":        userName,
		"verification_url": fmt.Sprintf("https://example.com/verify?token=%s", token),
	})
	job.SetSubject("Verify your email address")
	
	// Tracked path - important for user onboarding
	// createTrackedJob(job)
}

func sendPasswordReset(email, token string) {
	job := models.NewEmailJob("password_reset", email)
	job.SetTemplate("password_reset", map[string]any{
		"reset_url": fmt.Sprintf("https://example.com/reset?token=%s", token),
	})
	job.SetSubject("Reset your password")
	
	// Tracked path - important for security
	// createTrackedJob(job)
}

func sendPaymentConfirmation(email, userName, amount, transactionID string) {
	job := models.NewEmailJob("payment_confirmation", email)
	job.SetTemplate("payment_confirmation", map[string]any{
		"user_name":     userName,
		"amount":        amount,
		"transaction_id": transactionID,
	})
	job.SetSubject("Payment Confirmation")
	job.SetPriority(3) // High priority
	
	// Tracked path - critical for business
	// createTrackedJob(job)
}

func sendBookingConfirmation(email, userName, eventName, eventDate string) {
	job := models.NewEmailJob("booking_confirmation", email)
	job.SetTemplate("booking_confirmation", map[string]any{
		"user_name":  userName,
		"event_name": eventName,
		"event_date": eventDate,
	})
	job.SetSubject("Booking Confirmation")
	job.SetPriority(2) // Medium priority
	
	// Tracked path - important for customer service
	// createTrackedJob(job)
}

// Helper functions (these would be implemented in the actual service)
func publishToQueue(job *models.EmailJob) {
	// This would publish directly to the queue for fast processing
	fmt.Printf("Publishing job %s to queue (fast path)\n", job.ID)
}

func createTrackedJob(job *models.EmailJob) {
	// This would save to database first, then publish to queue
	fmt.Printf("Creating tracked job %s (database + queue path)\n", job.ID)
} 