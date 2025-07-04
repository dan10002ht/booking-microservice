package grpc

import (
	"context"
	"time"

	"booking-system/email-worker/protos"
	"booking-system/email-worker/services"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// EmailVerificationServer implements the EmailVerificationService gRPC server
type EmailVerificationServer struct {
	protos.UnimplementedEmailVerificationServiceServer
	verificationService *services.EmailVerificationService
}

// NewEmailVerificationServer creates a new email verification server
func NewEmailVerificationServer(verificationService *services.EmailVerificationService) *EmailVerificationServer {
	return &EmailVerificationServer{
		verificationService: verificationService,
	}
}

// SendVerificationEmail sends a verification email with PIN code
func (s *EmailVerificationServer) SendVerificationEmail(
	ctx context.Context,
	req *protos.SendVerificationEmailRequest,
) (*protos.SendVerificationEmailResponse, error) {
	// Validate request
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.UserEmail == "" {
		return nil, status.Error(codes.InvalidArgument, "user_email is required")
	}
	if req.UserName == "" {
		return nil, status.Error(codes.InvalidArgument, "user_name is required")
	}

	// Prepare verification data
	data := services.VerificationData{
		UserID:         req.UserId,
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		PinCode:        req.PinCode,
		ExpiryTime:     int(req.ExpiryTime),
		VerificationURL: req.VerificationUrl,
	}

	// Send verification email
	err := s.verificationService.SendVerificationEmail(ctx, data)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to send verification email: %v", err)
	}

	// Calculate expiry timestamp
	expiryTime := time.Now().Add(time.Duration(data.ExpiryTime) * time.Minute)

	return &protos.SendVerificationEmailResponse{
		Success:          true,
		Message:          "Verification email sent successfully",
		JobId:            req.UserId, // Using user_id as job_id for tracking
		PinCode:          data.PinCode,
		ExpiryTimestamp:  expiryTime.Unix(),
	}, nil
}

// SendVerificationReminder sends a reminder email for unverified users
func (s *EmailVerificationServer) SendVerificationReminder(
	ctx context.Context,
	req *protos.SendVerificationReminderRequest,
) (*protos.SendVerificationReminderResponse, error) {
	// Validate request
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.UserEmail == "" {
		return nil, status.Error(codes.InvalidArgument, "user_email is required")
	}
	if req.UserName == "" {
		return nil, status.Error(codes.InvalidArgument, "user_name is required")
	}

	// Prepare verification data
	data := services.VerificationData{
		UserID:         req.UserId,
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		VerificationURL: req.VerificationUrl,
	}

	// Send verification reminder
	err := s.verificationService.SendVerificationReminder(ctx, data)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to send verification reminder: %v", err)
	}

	// Calculate expiry timestamp (30 minutes for reminder)
	expiryTime := time.Now().Add(30 * time.Minute)

	return &protos.SendVerificationReminderResponse{
		Success:          true,
		Message:          "Verification reminder sent successfully",
		JobId:            req.UserId,
		PinCode:          data.PinCode,
		ExpiryTimestamp:  expiryTime.Unix(),
	}, nil
}

// ValidatePinCode validates a PIN code
func (s *EmailVerificationServer) ValidatePinCode(
	ctx context.Context,
	req *protos.ValidatePinCodeRequest,
) (*protos.ValidatePinCodeResponse, error) {
	// Validate request
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.PinCode == "" {
		return nil, status.Error(codes.InvalidArgument, "pin_code is required")
	}

	// Convert expiry timestamp to time
	expiryTime := time.Unix(req.ExpiryTimestamp, 0)

	// Validate PIN code
	valid := s.verificationService.ValidatePinCode(req.PinCode, req.PinCode, expiryTime)
	expired := time.Now().After(expiryTime)

	var message string
	if expired {
		message = "PIN code has expired"
	} else if !valid {
		message = "Invalid PIN code"
	} else {
		message = "PIN code is valid"
	}

	return &protos.ValidatePinCodeResponse{
		Valid:   valid && !expired,
		Message: message,
		Expired: expired,
	}, nil
}

// ResendVerificationEmail resends a verification email
func (s *EmailVerificationServer) ResendVerificationEmail(
	ctx context.Context,
	req *protos.ResendVerificationEmailRequest,
) (*protos.ResendVerificationEmailResponse, error) {
	// Validate request
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.UserEmail == "" {
		return nil, status.Error(codes.InvalidArgument, "user_email is required")
	}
	if req.UserName == "" {
		return nil, status.Error(codes.InvalidArgument, "user_name is required")
	}

	// Prepare verification data
	data := services.VerificationData{
		UserID:         req.UserId,
		UserEmail:      req.UserEmail,
		UserName:       req.UserName,
		VerificationURL: req.VerificationUrl,
	}

	// Send verification email (this will generate a new PIN code)
	err := s.verificationService.SendVerificationEmail(ctx, data)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to resend verification email: %v", err)
	}

	// Calculate expiry timestamp
	expiryTime := time.Now().Add(15 * time.Minute)

	return &protos.ResendVerificationEmailResponse{
		Success:          true,
		Message:          "Verification email resent successfully",
		JobId:            req.UserId,
		PinCode:          data.PinCode,
		ExpiryTimestamp:  expiryTime.Unix(),
	}, nil
} 