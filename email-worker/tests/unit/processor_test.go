package unit

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"booking-system/email-worker/models"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/queue"
)

// MockQueue is a mock implementation of Queue interface
type MockQueue struct {
	mock.Mock
}

func (m *MockQueue) Push(ctx context.Context, job *models.EmailJob) error {
	args := m.Called(ctx, job)
	return args.Error(0)
}

func (m *MockQueue) Pop(ctx context.Context) (*models.EmailJob, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailJob), args.Error(1)
}

func (m *MockQueue) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockEmailService is a mock implementation of EmailService
type MockEmailService struct {
	mock.Mock
}

func (m *MockEmailService) CreateEmailJob(ctx context.Context, job *models.EmailJob) error {
	args := m.Called(ctx, job)
	return args.Error(0)
}

func (m *MockEmailService) GetEmailJob(ctx context.Context, id uuid.UUID) (*models.EmailJob, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailJob), args.Error(1)
}

func (m *MockEmailService) ProcessJob(ctx context.Context, job *models.EmailJob) error {
	args := m.Called(ctx, job)
	return args.Error(0)
}

func (m *MockEmailService) ProcessJobWithRetry(ctx context.Context, job *models.EmailJob) error {
	args := m.Called(ctx, job)
	return args.Error(0)
}

func (m *MockEmailService) GetEmailTemplate(ctx context.Context, id string) (*models.EmailTemplate, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailTemplate), args.Error(1)
}

func (m *MockEmailService) CreateEmailTemplate(ctx context.Context, template *models.EmailTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockEmailService) UpdateEmailTemplate(ctx context.Context, template *models.EmailTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockEmailService) DeleteEmailTemplate(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockEmailService) GetEmailTracking(ctx context.Context, jobID uuid.UUID) (*models.EmailTracking, error) {
	args := m.Called(ctx, jobID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EmailTracking), args.Error(1)
}

func TestProcessor_Start(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     2,
		BatchSize:       10,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Wait a bit for workers to start
	time.Sleep(200 * time.Millisecond)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)
}

func TestProcessor_ProcessJobs(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Test data
	job := &models.EmailJob{
		ID:             uuid.New(),
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		Status:         "pending",
	}

	// Expectations
	mockQueue.On("Pop", mock.Anything).Return(job, nil).Once()
	mockEmailService.On("ProcessJobWithRetry", mock.Anything, job).Return(nil).Once()

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Wait for job to be processed
	time.Sleep(300 * time.Millisecond)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Assert
	mockQueue.AssertExpectations(t)
	mockEmailService.AssertExpectations(t)
}

func TestProcessor_ProcessJobsWithError(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Test data
	job := &models.EmailJob{
		ID:             uuid.New(),
		JobType:        "verification",
		RecipientEmail: "test@example.com",
		Status:         "pending",
	}

	// Expectations - Job processing fails
	mockQueue.On("Pop", mock.Anything).Return(job, nil).Once()
	mockEmailService.On("ProcessJobWithRetry", mock.Anything, job).Return(assert.AnError).Once()

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Wait for job to be processed
	time.Sleep(300 * time.Millisecond)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Assert
	mockQueue.AssertExpectations(t)
	mockEmailService.AssertExpectations(t)
}

func TestProcessor_ProcessJobsWithQueueError(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Expectations - Queue returns error
	mockQueue.On("Pop", mock.Anything).Return(nil, assert.AnError).Once()

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Wait for error to be handled
	time.Sleep(300 * time.Millisecond)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Assert
	mockQueue.AssertExpectations(t)
}

func TestProcessor_ProcessJobsWithNoJobs(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Expectations - Queue returns no jobs
	mockQueue.On("Pop", mock.Anything).Return(nil, queue.ErrNoJobs).Once()

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Wait for no jobs to be handled
	time.Sleep(300 * time.Millisecond)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Assert
	mockQueue.AssertExpectations(t)
}

func TestProcessor_Stop(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Expectations
	mockQueue.On("Close").Return(nil).Once()

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Assert
	mockQueue.AssertExpectations(t)
}

func TestProcessor_IsRunning(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     1,
		BatchSize:       1,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Initially not running
	assert.False(t, proc.IsRunning())

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Now running
	assert.True(t, proc.IsRunning())

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Not running again
	assert.False(t, proc.IsRunning())
}

func TestProcessor_GetStats(t *testing.T) {
	// Setup
	mockQueue := &MockQueue{}
	mockEmailService := &MockEmailService{}
	logger := zap.NewNop()

	config := &processor.ProcessorConfig{
		WorkerCount:     2,
		BatchSize:       10,
		PollInterval:    100 * time.Millisecond,
		MaxRetries:      3,
		RetryDelay:      1 * time.Second,
		ProcessTimeout:  30 * time.Second,
		CleanupInterval: 1 * time.Minute,
	}

	proc := processor.NewProcessor(mockQueue, mockEmailService, config, logger)

	// Get stats before starting
	stats := proc.GetStats()
	assert.Equal(t, 0, stats.JobsProcessed)
	assert.Equal(t, 0, stats.JobsFailed)
	assert.Equal(t, 0, stats.ActiveWorkers)

	// Start processor
	err := proc.Start()
	assert.NoError(t, err)

	// Get stats while running
	stats = proc.GetStats()
	assert.Equal(t, 2, stats.ActiveWorkers)

	// Stop processor
	err = proc.Stop()
	assert.NoError(t, err)

	// Get stats after stopping
	stats = proc.GetStats()
	assert.Equal(t, 0, stats.ActiveWorkers)
} 