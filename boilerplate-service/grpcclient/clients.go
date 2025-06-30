package grpcclient

import (
	"fmt"
	"time"

	"boilerplate-service/config"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Clients struct {
	AuthConn    *grpc.ClientConn
	UserConn    *grpc.ClientConn
	BookingConn *grpc.ClientConn
}

func NewClients(cfg config.GRPCConfig) (*Clients, error) {
	// Create dial options
	dialOpts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(cfg.MaxReceiveMsgSize),
			grpc.MaxCallSendMsgSize(cfg.MaxSendMsgSize),
		),
		grpc.WithKeepaliveParams(grpc.KeepaliveParams{
			Time:    time.Duration(cfg.KeepaliveTimeMs) * time.Millisecond,
			Timeout: time.Duration(cfg.KeepaliveTimeoutMs) * time.Millisecond,
		}),
	}

	// Connect to Auth Service
	authConn, err := grpc.Dial(cfg.AuthServiceURL, dialOpts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}

	// Connect to User Service
	userConn, err := grpc.Dial(cfg.UserServiceURL, dialOpts...)
	if err != nil {
		authConn.Close()
		return nil, fmt.Errorf("failed to connect to user service: %w", err)
	}

	// Connect to Booking Service
	bookingConn, err := grpc.Dial(cfg.BookingServiceURL, dialOpts...)
	if err != nil {
		authConn.Close()
		userConn.Close()
		return nil, fmt.Errorf("failed to connect to booking service: %w", err)
	}

	return &Clients{
		AuthConn:    authConn,
		UserConn:    userConn,
		BookingConn: bookingConn,
	}, nil
}

func (c *Clients) Close() error {
	var errs []error

	if err := c.AuthConn.Close(); err != nil {
		errs = append(errs, fmt.Errorf("failed to close auth connection: %w", err))
	}

	if err := c.UserConn.Close(); err != nil {
		errs = append(errs, fmt.Errorf("failed to close user connection: %w", err))
	}

	if err := c.BookingConn.Close(); err != nil {
		errs = append(errs, fmt.Errorf("failed to close booking connection: %w", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing connections: %v", errs)
	}

	return nil
} 