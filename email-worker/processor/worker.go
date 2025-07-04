package processor

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"

	"booking-system/email-worker/models"
	"booking-system/email-worker/queue"
	"booking-system/email-worker/services"
)

// Worker processes email jobs from the queue
type Worker struct {
	id           int
	queue        queue.Queue
	emailService *services.EmailService
	logger       *zap.Logger
	stopChan     chan struct{}
	wg           sync.WaitGroup
	config       *WorkerConfig
}

// WorkerConfig holds worker configuration
type WorkerConfig struct {
	BatchSize     int           `mapstructure:"batch_size"`
	PollInterval  time.Duration `mapstructure:"poll_interval"`
	MaxRetries    int           `mapstructure:"max_retries"`
	RetryDelay    time.Duration `mapstructure:"retry_delay"`
	ProcessTimeout time.Duration `mapstructure:"process_timeout"`
}

// NewWorker creates a new worker instance
func NewWorker(id int, queue queue.Queue, emailService *services.EmailService, config *WorkerConfig, logger *zap.Logger) *Worker {
	return &Worker{
		id:           id,
		queue:        queue,
		emailService: emailService,
		logger:       logger.With(zap.Int("worker_id", id)),
		stopChan:     make(chan struct{}),
		config:       config,
	}
}

// Start starts the worker
func (w *Worker) Start() {
	w.logger.Info("Starting email worker")
	w.wg.Add(1)
	go w.run()
}

// Stop stops the worker
func (w *Worker) Stop() {
	w.logger.Info("Stopping email worker")
	close(w.stopChan)
	w.wg.Wait()
	w.logger.Info("Email worker stopped")
}

// run is the main worker loop
func (w *Worker) run() {
	defer w.wg.Done()

	ticker := time.NewTicker(w.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-w.stopChan:
			return
		case <-ticker.C:
			w.processJobs()
		}
	}
}

// processJobs processes jobs from the queue
func (w *Worker) processJobs() {
	ctx, cancel := context.WithTimeout(context.Background(), w.config.ProcessTimeout)
	defer cancel()

	// Try to consume a batch of jobs
	jobs, err := w.queue.ConsumeBatch(ctx, w.config.BatchSize)
	if err != nil {
		if err == queue.ErrQueueEmpty {
			// No jobs available, this is normal
			return
		}
		w.logger.Error("Failed to consume jobs from queue", zap.Error(err))
		return
	}

	if len(jobs) == 0 {
		return
	}

	w.logger.Info("Processing batch of jobs", zap.Int("count", len(jobs)))

	// Process jobs concurrently
	var wg sync.WaitGroup
	for _, job := range jobs {
		wg.Add(1)
		go func(j *models.EmailJob) {
			defer wg.Done()
			w.processJob(ctx, j)
		}(job)
	}

	wg.Wait()
}

// processJob processes a single email job
func (w *Worker) processJob(ctx context.Context, job *models.EmailJob) {
	startTime := time.Now()
	
	w.logger.Info("Processing email job",
		zap.String("job_id", job.ID.String()),
		zap.String("template", job.TemplateName),
		zap.Strings("recipients", job.To),
	)

	// Update job status
	job.MarkAsProcessing()
	updateErr := w.emailService.UpdateJobStatus(ctx, job.ID.String(), string(job.Status))
	if updateErr != nil {
		w.logger.Error("Failed to update job status", 
			zap.String("job_id", job.ID.String()),
			zap.Error(updateErr))
	}

	// Process the email
	err := w.emailService.ProcessEmailJob(ctx, job)
	
	processingTime := time.Since(startTime)

	if err != nil {
		w.logger.Error("Failed to process email job",
			zap.String("job_id", job.ID.String()),
			zap.String("template", job.TemplateName),
			zap.Error(err),
			zap.Duration("processing_time", processingTime),
		)

		// Handle retry logic
		w.handleJobFailure(ctx, job, err)
		return
	}

	// Mark job as completed
	job.MarkAsCompleted()
	completeErr := w.emailService.UpdateJobStatus(ctx, job.ID.String(), string(job.Status))
	if completeErr != nil {
		w.logger.Error("Failed to update job status to completed", 
			zap.String("job_id", job.ID.String()),
			zap.Error(completeErr))
	}

	w.logger.Info("Email job processed successfully",
		zap.String("job_id", job.ID.String()),
		zap.String("template", job.TemplateName),
		zap.Duration("processing_time", processingTime),
	)
}

// handleJobFailure handles job processing failures
func (w *Worker) handleJobFailure(ctx context.Context, job *models.EmailJob, err error) {
	if !job.CanRetry() {
		// Max retries reached, mark as failed
		job.MarkAsFailed()
		updateErr := w.emailService.UpdateJobStatus(ctx, job.ID.String(), string(job.Status))
		if updateErr != nil {
			w.logger.Error("Failed to update job status to failed", 
				zap.String("job_id", job.ID.String()),
				zap.Error(updateErr))
		}

		w.logger.Error("Email job failed permanently",
			zap.String("job_id", job.ID.String()),
			zap.String("template", job.TemplateName),
			zap.Int("retry_count", job.RetryCount),
			zap.Error(err),
		)
		return
	}

	// Increment retry count
	job.IncrementRetry()
	
	job.MarkAsRetrying()
	updateErr := w.emailService.UpdateJobStatus(ctx, job.ID.String(), string(job.Status))
	if updateErr != nil {
		w.logger.Error("Failed to update job status to retrying", 
			zap.String("job_id", job.ID.String()),
			zap.Error(updateErr))
	}

	// Calculate retry delay with exponential backoff
	retryDelay := w.calculateRetryDelay(job.RetryCount)

	w.logger.Info("Scheduling job retry",
		zap.String("job_id", job.ID.String()),
		zap.String("template", job.TemplateName),
		zap.Int("retry_count", job.RetryCount),
		zap.Duration("retry_delay", retryDelay),
		zap.Error(err),
	)

	// Schedule retry
	go func() {
		time.Sleep(retryDelay)
		
		// Re-queue the job
		requeueErr := w.queue.Publish(context.Background(), job)
		if requeueErr != nil {
			w.logger.Error("Failed to requeue job for retry",
				zap.String("job_id", job.ID.String()),
				zap.Error(requeueErr))
		}
	}()
}

// calculateRetryDelay calculates the delay for retry with exponential backoff
func (w *Worker) calculateRetryDelay(retryCount int) time.Duration {
	// Base delay with exponential backoff
	delay := w.config.RetryDelay * time.Duration(1<<retryCount)
	
	// Cap the delay at 1 hour
	maxDelay := time.Hour
	if delay > maxDelay {
		delay = maxDelay
	}
	
	return delay
}

// GetStats returns worker statistics
func (w *Worker) GetStats() map[string]interface{} {
	queueSize, err := w.queue.Size(context.Background())
	if err != nil {
		w.logger.Error("Failed to get queue size", zap.Error(err))
		queueSize = -1
	}

	return map[string]interface{}{
		"worker_id":  w.id,
		"queue_size": queueSize,
		"status":     "running",
	}
} 