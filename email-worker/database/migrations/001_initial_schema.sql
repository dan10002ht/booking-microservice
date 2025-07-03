-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for email worker service
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Jobs Table
CREATE TABLE email_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    template_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    user_id UUID, -- UUID from auth-service (optional)
    provider VARCHAR(20) DEFAULT 'sendgrid', -- 'sendgrid', 'ses', 'smtp'
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE email_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    html_template TEXT,
    text_template TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Tracking Table
CREATE TABLE email_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES email_jobs(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    message_id VARCHAR(255),
    status VARCHAR(50),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    error_message TEXT,
    bounce_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_email_jobs_status ON email_jobs(status);
CREATE INDEX idx_email_jobs_priority ON email_jobs(priority);
CREATE INDEX idx_email_jobs_scheduled_at ON email_jobs(scheduled_at);
CREATE INDEX idx_email_jobs_created_at ON email_jobs(created_at);
CREATE INDEX idx_email_jobs_recipient_email ON email_jobs(recipient_email);
CREATE INDEX idx_email_jobs_template_id ON email_jobs(template_id);
CREATE INDEX idx_email_jobs_user_id ON email_jobs(user_id);
CREATE INDEX idx_email_jobs_job_type ON email_jobs(job_type);

CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX idx_email_templates_name ON email_templates(name);

CREATE INDEX idx_email_tracking_job_id ON email_tracking(job_id);
CREATE INDEX idx_email_tracking_status ON email_tracking(status);
CREATE INDEX idx_email_tracking_provider ON email_tracking(provider);
CREATE INDEX idx_email_tracking_created_at ON email_tracking(created_at);

-- Insert default templates
INSERT INTO email_templates (id, name, subject, html_template, text_template, variables) VALUES
(
    'email_verification',
    'Email Verification',
    'Verify your email address',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification</title>
</head>
<body>
    <h1>Welcome to Booking System!</h1>
    <p>Hi {{.Name}},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{{.VerificationURL}}">Verify Email</a>
    <p>If you did not create an account, please ignore this email.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Welcome to Booking System!

Hi {{.Name}},

Please verify your email address by clicking the link below:
{{.VerificationURL}}

If you did not create an account, please ignore this email.

Best regards,
Booking System Team',
    '{"Name": "string", "VerificationURL": "string"}'
),
(
    'password_reset',
    'Password Reset',
    'Reset your password',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
</head>
<body>
    <h1>Password Reset Request</h1>
    <p>Hi {{.Name}},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="{{.ResetURL}}">Reset Password</a>
    <p>This link will expire in {{.ExpiryHours}} hours.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Password Reset Request

Hi {{.Name}},

You requested a password reset. Click the link below to reset your password:
{{.ResetURL}}

This link will expire in {{.ExpiryHours}} hours.

If you did not request this, please ignore this email.

Best regards,
Booking System Team',
    '{"Name": "string", "ResetURL": "string", "ExpiryHours": "number"}'
),
(
    'welcome_email',
    'Welcome Email',
    'Welcome to Booking System!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome to Booking System!</h1>
    <p>Hi {{.Name}},</p>
    <p>Thank you for joining Booking System. We are excited to have you on board!</p>
    <p>You can now start booking events and managing your account.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Welcome to Booking System!

Hi {{.Name}},

Thank you for joining Booking System. We are excited to have you on board!

You can now start booking events and managing your account.

Best regards,
Booking System Team',
    '{"Name": "string"}'
),
(
    'booking_confirmation',
    'Booking Confirmation',
    'Your booking has been confirmed',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Confirmation</title>
</head>
<body>
    <h1>Booking Confirmation</h1>
    <p>Hi {{.Name}},</p>
    <p>Your booking has been confirmed!</p>
    <h2>Booking Details:</h2>
    <ul>
        <li><strong>Event:</strong> {{.EventName}}</li>
        <li><strong>Date:</strong> {{.EventDate}}</li>
        <li><strong>Time:</strong> {{.EventTime}}</li>
        <li><strong>Venue:</strong> {{.Venue}}</li>
        <li><strong>Ticket Quantity:</strong> {{.TicketQuantity}}</li>
        <li><strong>Total Amount:</strong> {{.TotalAmount}}</li>
    </ul>
    <p>Booking ID: {{.BookingID}}</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Booking Confirmation

Hi {{.Name}},

Your booking has been confirmed!

Booking Details:
- Event: {{.EventName}}
- Date: {{.EventDate}}
- Time: {{.EventTime}}
- Venue: {{.Venue}}
- Ticket Quantity: {{.TicketQuantity}}
- Total Amount: {{.TotalAmount}}

Booking ID: {{.BookingID}}

Best regards,
Booking System Team',
    '{"Name": "string", "EventName": "string", "EventDate": "string", "EventTime": "string", "Venue": "string", "TicketQuantity": "number", "TotalAmount": "string", "BookingID": "string"}'
),
(
    'organization_invitation',
    'Organization Invitation',
    'You have been invited to join an organization',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Organization Invitation</title>
</head>
<body>
    <h1>Organization Invitation</h1>
    <p>Hi {{.Name}},</p>
    <p>You have been invited to join <strong>{{.OrganizationName}}</strong> on Booking System.</p>
    <p>Role: {{.Role}}</p>
    <p>Click the link below to accept the invitation:</p>
    <a href="{{.InvitationURL}}">Accept Invitation</a>
    <p>This invitation will expire in {{.ExpiryDays}} days.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Organization Invitation

Hi {{.Name}},

You have been invited to join {{.OrganizationName}} on Booking System.

Role: {{.Role}}

Click the link below to accept the invitation:
{{.InvitationURL}}

This invitation will expire in {{.ExpiryDays}} days.

Best regards,
Booking System Team',
    '{"Name": "string", "OrganizationName": "string", "Role": "string", "InvitationURL": "string", "ExpiryDays": "number"}'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_jobs_updated_at BEFORE UPDATE ON email_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 