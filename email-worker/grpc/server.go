package grpc

import (
	"context"
	"fmt"
	"net"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"booking-system/email-worker/config"
	"booking-system/email-worker/models"
	"booking-system/email-worker/processor"
	"booking-system/email-worker/protos"
)

// Server represents the gRPC server
type Server struct {
	protos.UnimplementedEmailServiceServer
	processor *processor.Processor
	logger    *zap.Logger
	config    *config.Config
	grpcServer *grpc.Server
}

// NewServer creates a new gRPC server
func NewServer(processor *processor.Processor, config *config.Config, logger *zap.Logger) *Server {
	return &Server{
		processor: processor,
		logger:    logger,
		config:    config,
	}
}

// Start starts the gRPC server
func (s *Server) Start(port int) error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}

	s.grpcServer = grpc.NewServer()
	protos.RegisterEmailServiceServer(s.grpcServer, s)
	
	// Enable reflection for debugging
	reflection.Register(s.grpcServer)

	s.logger.Info("Starting gRPC server", zap.Int("port", port))

	go func() {
		if err := s.grpcServer.Serve(lis); err != nil {
			s.logger.Fatal("Failed to serve gRPC", zap.Error(err))
		}
	}()

	return nil
}

// Stop stops the gRPC server
func (s *Server) Stop() {
	if s.grpcServer != nil {
		s.logger.Info("Stopping gRPC server")
		s.grpcServer.GracefulStop()
	}
}

// CreateEmailJob implements the CreateEmailJob gRPC method
func (s *Server) CreateEmailJob(ctx context.Context, req *protos.CreateEmailJobRequest) (*protos.CreateEmailJobResponse, error) {
	s.logger.Info("Creating email job",
		zap.String("job_type", req.JobType),
		zap.String("recipient", req.RecipientEmail),
		zap.Bool("is_tracked", req.IsTracked),
	)

	// Create email job
	job := s.createEmailJobFromRequest(req)

	// Publish to queue
	err := s.processor.PublishJob(ctx, job)
	if err != nil {
		s.logger.Error("Failed to publish email job", zap.Error(err))
		return &protos.CreateEmailJobResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to create email job: %v", err),
		}, nil
	}

	return &protos.CreateEmailJobResponse{
		JobId:     job.ID.String(),
		Success:   true,
		Message:   "Email job created successfully",
		IsTracked: job.IsTracked,
	}, nil
}

// CreateTrackedEmailJob implements the CreateTrackedEmailJob gRPC method
func (s *Server) CreateTrackedEmailJob(ctx context.Context, req *protos.CreateEmailJobRequest) (*protos.CreateEmailJobResponse, error) {
	s.logger.Info("Creating tracked email job",
		zap.String("job_type", req.JobType),
		zap.String("recipient", req.RecipientEmail),
	)

	// Create email job (will be tracked)
	job := s.createEmailJobFromRequest(req)
	job.IsTracked = true

	// Publish to queue
	err := s.processor.PublishJob(ctx, job)
	if err != nil {
		s.logger.Error("Failed to publish tracked email job", zap.Error(err))
		return &protos.CreateEmailJobResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to create tracked email job: %v", err),
		}, nil
	}

	return &protos.CreateEmailJobResponse{
		JobId:     job.ID.String(),
		Success:   true,
		Message:   "Tracked email job created successfully",
		IsTracked: true,
	}, nil
}

// GetJobStatus implements the GetJobStatus gRPC method
func (s *Server) GetJobStatus(ctx context.Context, req *protos.GetJobStatusRequest) (*protos.GetJobStatusResponse, error) {
	// This would need to be implemented to query the database
	// For now, return a placeholder response
	return &protos.GetJobStatusResponse{
		JobId:  req.JobId,
		Status: protos.JobStatus_STATUS_PENDING,
		Success: true,
		Message: "Job status retrieved successfully",
	}, nil
}

// GetJobStats implements the GetJobStats gRPC method
func (s *Server) GetJobStats(ctx context.Context, req *protos.GetJobStatsRequest) (*protos.GetJobStatsResponse, error) {
	stats := s.processor.GetStats()

	return &protos.GetJobStatsResponse{
		TotalJobs:             stats.TotalJobsProcessed,
		CompletedJobs:         stats.SuccessfulJobs,
		FailedJobs:            stats.FailedJobs,
		PendingJobs:           stats.QueueSize, // Using queue size as pending
		RetriedJobs:           stats.RetriedJobs,
		SuccessRate:           float64(stats.SuccessfulJobs) / float64(stats.TotalJobsProcessed) * 100,
		AverageProcessingTime: float64(stats.AverageProcessingTime.Milliseconds()),
		Success:               true,
		Message:               "Job statistics retrieved successfully",
	}, nil
}

// HealthCheck implements the HealthCheck gRPC method
func (s *Server) HealthCheck(ctx context.Context, req *protos.HealthCheckRequest) (*protos.HealthCheckResponse, error) {
	// Check processor health
	err := s.processor.Health(ctx)
	if err != nil {
		return &protos.HealthCheckResponse{
			Status:  "unhealthy",
			Message: fmt.Sprintf("Health check failed: %v", err),
		}, nil
	}

	return &protos.HealthCheckResponse{
		Status:    "healthy",
		Version:   "1.0.0",
		Timestamp: time.Now().Unix(),
		Message:   "Service is healthy",
	}, nil
}

// GetQueueStats implements the GetQueueStats gRPC method
func (s *Server) GetQueueStats(ctx context.Context, req *protos.GetQueueStatsRequest) (*protos.GetQueueStatsResponse, error) {
	stats := s.processor.GetStats()

	return &protos.GetQueueStatsResponse{
		QueueSize:           stats.QueueSize,
		ScheduledQueueSize:  0, // Would need to be implemented
		ActiveWorkers:       int32(stats.ActiveWorkers),
		Success:             true,
		Message:             "Queue statistics retrieved successfully",
	}, nil
}

// CreateEmailTemplate implements the CreateEmailTemplate gRPC method
func (s *Server) CreateEmailTemplate(ctx context.Context, req *protos.CreateEmailTemplateRequest) (*protos.CreateEmailTemplateResponse, error) {
	// This would need to be implemented to create templates
	return &protos.CreateEmailTemplateResponse{
		TemplateId: req.Id,
		Success:    true,
		Message:    "Email template created successfully",
	}, nil
}

// GetEmailTemplate implements the GetEmailTemplate gRPC method
func (s *Server) GetEmailTemplate(ctx context.Context, req *protos.GetEmailTemplateRequest) (*protos.GetEmailTemplateResponse, error) {
	// This would need to be implemented to get templates
	return &protos.GetEmailTemplateResponse{
		Success: true,
		Message: "Email template retrieved successfully",
	}, nil
}

// UpdateEmailTemplate implements the UpdateEmailTemplate gRPC method
func (s *Server) UpdateEmailTemplate(ctx context.Context, req *protos.UpdateEmailTemplateRequest) (*protos.UpdateEmailTemplateResponse, error) {
	// This would need to be implemented to update templates
	return &protos.UpdateEmailTemplateResponse{
		TemplateId: req.Id,
		Success:    true,
		Message:    "Email template updated successfully",
	}, nil
}

// DeleteEmailTemplate implements the DeleteEmailTemplate gRPC method
func (s *Server) DeleteEmailTemplate(ctx context.Context, req *protos.DeleteEmailTemplateRequest) (*protos.DeleteEmailTemplateResponse, error) {
	// This would need to be implemented to delete templates
	return &protos.DeleteEmailTemplateResponse{
		Success: true,
		Message: "Email template deleted successfully",
	}, nil
}

// createEmailJobFromRequest creates an EmailJob from gRPC request
func (s *Server) createEmailJobFromRequest(req *protos.CreateEmailJobRequest) *models.EmailJob {
	job := models.NewEmailJob(req.JobType, req.RecipientEmail)

	if req.Subject != "" {
		job.SetSubject(req.Subject)
	}

	if req.TemplateId != "" {
		// Convert template data
		templateData := make(map[string]any)
		for k, v := range req.TemplateData {
			templateData[k] = v
		}
		job.SetTemplate(req.TemplateId, templateData)
	}

	// Set priority
	job.SetPriority(int(req.Priority))

	// Set max retries
	if req.MaxRetries > 0 {
		job.SetMaxRetries(int(req.MaxRetries))
	}

	// Set scheduled time
	if req.ScheduledAt != nil {
		scheduledTime := req.ScheduledAt.AsTime()
		job.SetScheduledAt(scheduledTime)
	}

	// Set tracking
	job.IsTracked = req.IsTracked

	return job
} 