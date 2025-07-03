package processor

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"booking-system/email-worker/database/models"
	"booking-system/email-worker/queue"
	"booking-system/email-worker/services"
)

// Processor manages multiple workers for email processing
type Processor struct {
	workers       []*Worker
	queue         queue.Queue
	emailService  *services.EmailService
	logger        *zap.Logger
	config        *ProcessorConfig
	stopChan      chan struct{}
	wg            sync.WaitGroup
	stats         *ProcessorStats
	statsMutex    sync.RWMutex
}

// ProcessorConfig holds processor configuration
type ProcessorConfig struct {
	WorkerCount   int           `mapstructure:"worker_count"`
	BatchSize     int           `mapstructure:"batch_size"`
	PollInterval  time.Duration `mapstructure:"poll_interval"`
	MaxRetries    int           `mapstructure:"max_retries"`
	RetryDelay    time.Duration `mapstructure:"retry_delay"`
	ProcessTimeout time.Duration `mapstructure:"process_timeout"`
	CleanupInterval time.Duration `mapstructure:"cleanup_interval"`
}

// ProcessorStats holds processor statistics
type ProcessorStats struct {
	TotalJobsProcessed   int64     `json:"total_jobs_processed"`
	SuccessfulJobs       int64     `json:"successful_jobs"`
	FailedJobs           int64     `json:"failed_jobs"`
	RetriedJobs          int64     `json:"retried_jobs"`
	AverageProcessingTime time.Duration `json:"average_processing_time"`
	LastProcessedAt      time.Time `json:"last_processed_at"`
	QueueSize            int64     `json:"queue_size"`
	ActiveWorkers        int       `json:"active_workers"`
}

// NewProcessor creates a new processor instance
func NewProcessor(queue queue.Queue, emailService *services.EmailService, config *ProcessorConfig, logger *zap.Logger) *Processor {
	return &Processor{
		queue:        queue,
		emailService: emailService,
		logger:       logger,
		config:       config,
		stopChan:     make(chan struct{}),
		stats:        &ProcessorStats{},
	}
}

// Start starts the processor and all workers
func (p *Processor) Start() error {
	p.logger.Info("Starting email processor",
		zap.Int("worker_count", p.config.WorkerCount),
		zap.Int("batch_size", p.config.BatchSize),
		zap.Duration("poll_interval", p.config.PollInterval),
	)

	// Create and start workers
	p.workers = make([]*Worker, p.config.WorkerCount)
	for i := 0; i < p.config.WorkerCount; i++ {
		workerConfig := &WorkerConfig{
			BatchSize:      p.config.BatchSize,
			PollInterval:   p.config.PollInterval,
			MaxRetries:     p.config.MaxRetries,
			RetryDelay:     p.config.RetryDelay,
			ProcessTimeout: p.config.ProcessTimeout,
		}

		worker := NewWorker(i+1, p.queue, p.emailService, workerConfig, p.logger)
		p.workers[i] = worker
		worker.Start()
	}

	// Start background tasks
	p.wg.Add(3)
	go p.scheduledJobsProcessor()
	go p.cleanupTask()
	go p.statsCollector()

	p.logger.Info("Email processor started successfully")
	return nil
}

// Stop stops the processor and all workers
func (p *Processor) Stop() error {
	p.logger.Info("Stopping email processor")

	// Stop background tasks
	close(p.stopChan)
	p.wg.Wait()

	// Stop all workers
	for _, worker := range p.workers {
		worker.Stop()
	}

	p.logger.Info("Email processor stopped")
	return nil
}

// scheduledJobsProcessor processes scheduled jobs
func (p *Processor) scheduledJobsProcessor() {
	defer p.wg.Done()

	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	defer ticker.Stop()

	for {
		select {
		case <-p.stopChan:
			return
		case <-ticker.C:
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			err := p.queue.ProcessScheduledJobs(ctx)
			cancel()

			if err != nil {
				p.logger.Error("Failed to process scheduled jobs", zap.Error(err))
			}
		}
	}
}

// cleanupTask performs periodic cleanup
func (p *Processor) cleanupTask() {
	defer p.wg.Done()

	ticker := time.NewTicker(p.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-p.stopChan:
			return
		case <-ticker.C:
			p.performCleanup()
		}
	}
}

// performCleanup performs cleanup tasks
func (p *Processor) performCleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Clean up old jobs (older than 30 days)
	cutoffTime := time.Now().AddDate(0, 0, -30)
	err := p.emailService.CleanupOldJobs(ctx, cutoffTime)
	if err != nil {
		p.logger.Error("Failed to cleanup old jobs", zap.Error(err))
	}

	p.logger.Info("Cleanup completed")
}

// statsCollector collects and updates statistics
func (p *Processor) statsCollector() {
	defer p.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.stopChan:
			return
		case <-ticker.C:
			p.updateStats()
		}
	}
}

// updateStats updates processor statistics
func (p *Processor) updateStats() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get queue size
	queueSize, err := p.queue.Size(ctx)
	if err != nil {
		p.logger.Error("Failed to get queue size", zap.Error(err))
		queueSize = -1
	}

	// Get database stats
	dbStats, err := p.emailService.GetStats(ctx)
	if err != nil {
		p.logger.Error("Failed to get database stats", zap.Error(err))
	}

	p.statsMutex.Lock()
	p.stats.QueueSize = queueSize
	if dbStats != nil {
		p.stats.TotalJobsProcessed = dbStats.TotalJobs
		p.stats.SuccessfulJobs = dbStats.CompletedJobs
		p.stats.FailedJobs = dbStats.FailedJobs
	}
	p.stats.ActiveWorkers = len(p.workers)
	p.statsMutex.Unlock()
}

// GetStats returns current processor statistics
func (p *Processor) GetStats() *ProcessorStats {
	p.statsMutex.RLock()
	defer p.statsMutex.RUnlock()

	// Create a copy to avoid race conditions
	stats := *p.stats
	return &stats
}

// Health checks if the processor is healthy
func (p *Processor) Health(ctx context.Context) error {
	// Check queue health
	err := p.queue.Health(ctx)
	if err != nil {
		return err
	}

	// Check database health
	err = p.emailService.HealthCheck(ctx)
	if err != nil {
		return err
	}

	// Check if workers are running
	activeWorkers := 0
	for _, worker := range p.workers {
		stats := worker.GetStats()
		if stats["status"] == "running" {
			activeWorkers++
		}
	}

	if activeWorkers == 0 {
		return fmt.Errorf("no active workers")
	}

	return nil
}

// PublishJob publishes a job to the queue
func (p *Processor) PublishJob(ctx context.Context, job *models.EmailJob) error {
	// Publish to queue
	err := p.queue.Publish(ctx, job)
	if err != nil {
		return fmt.Errorf("failed to publish job to queue: %w", err)
	}

	p.logger.Info("Job published to queue",
		zap.String("job_id", job.ID),
		zap.String("template_name", job.TemplateName),
		zap.Strings("recipients", []string(job.To)),
	)

	return nil
}

// PublishScheduledJob publishes a job for scheduled delivery
func (p *Processor) PublishScheduledJob(ctx context.Context, job *models.EmailJob, scheduledAt time.Time) error {
	// If job should be tracked, save to database first
	if job.ShouldBeTracked() {
		job.IsTracked = true
		err := p.emailService.CreateTrackedEmailJob(ctx, job)
		if err != nil {
			return fmt.Errorf("failed to create tracked scheduled job: %w", err)
		}
	}

	// Publish to scheduled queue
	err := p.queue.PublishScheduled(ctx, job, scheduledAt)
	if err != nil {
		return fmt.Errorf("failed to publish scheduled job: %w", err)
	}

	p.logger.Info("Scheduled job published to queue",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("recipient", job.RecipientEmail),
		zap.Time("scheduled_at", scheduledAt),
		zap.Bool("tracked", job.IsTracked),
	)

	return nil
}

// GetWorkerStats returns statistics for all workers
func (p *Processor) GetWorkerStats() []map[string]interface{} {
	stats := make([]map[string]interface{}, len(p.workers))
	for i, worker := range p.workers {
		stats[i] = worker.GetStats()
	}
	return stats
} 