package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"

	"booking-system/email-worker/models"
)

// RedisQueue implements queue interface using Redis
type RedisQueue struct {
	client   *redis.Client
	logger   *zap.Logger
	queueName string
}

// NewRedisQueue creates a new Redis queue instance
func NewRedisQueue(addr, password string, db int, queueName string, logger *zap.Logger) *RedisQueue {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisQueue{
		client:    client,
		logger:    logger,
		queueName: queueName,
	}
}

// Publish adds an email job to the queue
func (q *RedisQueue) Publish(ctx context.Context, job *models.EmailJob) error {
	// Serialize job to JSON
	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	// Add to queue with priority
	score := float64(time.Now().Unix())
	if job.Priority > 0 {
		// Higher priority jobs get lower scores (processed first)
		score = float64(time.Now().Unix()) - float64(job.Priority*1000)
	}

	// Use Redis sorted set for priority queue
	err = q.client.ZAdd(ctx, q.queueName, &redis.Z{
		Score:  score,
		Member: jobData,
	}).Err()

	if err != nil {
		return fmt.Errorf("failed to add job to queue: %w", err)
	}

	q.logger.Info("Job added to queue",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("recipient", job.RecipientEmail),
		zap.Int("priority", job.Priority),
		zap.Bool("tracked", job.IsTracked),
	)

	return nil
}

// Consume retrieves and removes the next job from the queue
func (q *RedisQueue) Consume(ctx context.Context) (*models.EmailJob, error) {
	// Get the job with the lowest score (highest priority)
	result, err := q.client.ZPopMin(ctx, q.queueName, 1).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, ErrQueueEmpty
		}
		return nil, fmt.Errorf("failed to consume job: %w", err)
	}

	if len(result) == 0 {
		return nil, ErrQueueEmpty
	}

	// Deserialize job
	var job models.EmailJob
	err = json.Unmarshal([]byte(result[0].Member.(string)), &job)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	q.logger.Info("Job consumed from queue",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("recipient", job.RecipientEmail),
	)

	return &job, nil
}

// ConsumeBatch retrieves multiple jobs from the queue
func (q *RedisQueue) ConsumeBatch(ctx context.Context, batchSize int) ([]*models.EmailJob, error) {
	// Get multiple jobs with lowest scores
	result, err := q.client.ZPopMin(ctx, q.queueName, int64(batchSize)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, ErrQueueEmpty
		}
		return nil, fmt.Errorf("failed to consume batch: %w", err)
	}

	if len(result) == 0 {
		return nil, ErrQueueEmpty
	}

	jobs := make([]*models.EmailJob, 0, len(result))
	for _, item := range result {
		var job models.EmailJob
		err := json.Unmarshal([]byte(item.Member.(string)), &job)
		if err != nil {
			q.logger.Error("Failed to unmarshal job in batch", zap.Error(err))
			continue
		}
		jobs = append(jobs, &job)
	}

	q.logger.Info("Batch consumed from queue",
		zap.Int("batch_size", len(jobs)),
	)

	return jobs, nil
}

// Size returns the current queue size
func (q *RedisQueue) Size(ctx context.Context) (int64, error) {
	size, err := q.client.ZCard(ctx, q.queueName).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get queue size: %w", err)
	}
	return size, nil
}

// Clear removes all jobs from the queue
func (q *RedisQueue) Clear(ctx context.Context) error {
	err := q.client.Del(ctx, q.queueName).Err()
	if err != nil {
		return fmt.Errorf("failed to clear queue: %w", err)
	}
	return nil
}

// Health checks if the queue is healthy
func (q *RedisQueue) Health(ctx context.Context) error {
	_, err := q.client.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("queue health check failed: %w", err)
	}
	return nil
}

// Close closes the Redis connection
func (q *RedisQueue) Close() error {
	return q.client.Close()
}

// PublishScheduled publishes a job for scheduled delivery
func (q *RedisQueue) PublishScheduled(ctx context.Context, job *models.EmailJob, scheduledAt time.Time) error {
	// Serialize job to JSON
	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal scheduled job: %w", err)
	}

	// Use scheduled time as score
	score := float64(scheduledAt.Unix())

	// Add to scheduled queue
	err = q.client.ZAdd(ctx, q.getScheduledQueueName(), &redis.Z{
		Score:  score,
		Member: jobData,
	}).Err()

	if err != nil {
		return fmt.Errorf("failed to add scheduled job: %w", err)
	}

	q.logger.Info("Scheduled job added to queue",
		zap.String("job_id", job.ID.String()),
		zap.String("job_type", job.JobType),
		zap.String("recipient", job.RecipientEmail),
		zap.Time("scheduled_at", scheduledAt),
	)

	return nil
}

// ProcessScheduledJobs moves ready scheduled jobs to the main queue
func (q *RedisQueue) ProcessScheduledJobs(ctx context.Context) error {
	now := float64(time.Now().Unix())
	
	// Get all jobs that are ready to be processed
	result, err := q.client.ZRangeByScore(ctx, q.getScheduledQueueName(), &redis.ZRangeBy{
		Min: "0",
		Max: fmt.Sprintf("%f", now),
	}).Result()

	if err != nil {
		return fmt.Errorf("failed to get scheduled jobs: %w", err)
	}

	if len(result) == 0 {
		return nil
	}

	// Move ready jobs to main queue
	for _, jobData := range result {
		var job models.EmailJob
		err := json.Unmarshal([]byte(jobData), &job)
		if err != nil {
			q.logger.Error("Failed to unmarshal scheduled job", zap.Error(err))
			continue
		}

		// Add to main queue
		err = q.Publish(ctx, &job)
		if err != nil {
			q.logger.Error("Failed to move scheduled job to main queue", 
				zap.String("job_id", job.ID.String()),
				zap.Error(err))
			continue
		}

		// Remove from scheduled queue
		q.client.ZRem(ctx, q.getScheduledQueueName(), jobData)
	}

	if len(result) > 0 {
		q.logger.Info("Processed scheduled jobs",
			zap.Int("count", len(result)),
		)
	}

	return nil
}

// getScheduledQueueName returns the name of the scheduled queue
func (q *RedisQueue) getScheduledQueueName() string {
	return q.queueName + ":scheduled"
}

// Queue errors
var (
	ErrQueueEmpty = fmt.Errorf("queue is empty")
) 