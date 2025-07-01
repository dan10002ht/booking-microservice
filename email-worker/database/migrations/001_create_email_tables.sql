-- Email Worker Database Migration
-- Create email-related tables for the booking system

-- Email Jobs Table
CREATE TABLE email_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- 'verification', 'password_reset', 'welcome', 'security', 'invitation'
    priority INTEGER DEFAULT 2, -- 1=high, 2=normal, 3=low
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
    user_id UUID, -- UUID from auth-service
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    template_data JSONB, -- JSON data for template variables
    provider VARCHAR(20) DEFAULT 'sendgrid', -- 'sendgrid', 'ses', 'smtp'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    sent_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Table
CREATE TABLE email_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- 'email_verification', 'password_reset', 'welcome'
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables JSONB, -- JSON array of variable names
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Tracking Table
CREATE TABLE email_tracking (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES email_jobs(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    message_id VARCHAR(255), -- Provider's message ID
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'opened', 'clicked'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounce_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_email_jobs_status ON email_jobs(status);
CREATE INDEX idx_email_jobs_priority ON email_jobs(priority DESC);
CREATE INDEX idx_email_jobs_job_type ON email_jobs(job_type);
CREATE INDEX idx_email_jobs_user_id ON email_jobs(user_id);
CREATE INDEX idx_email_jobs_email ON email_jobs(email);
CREATE INDEX idx_email_jobs_scheduled_at ON email_jobs(scheduled_at);
CREATE INDEX idx_email_jobs_created_at ON email_jobs(created_at);

CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX idx_email_tracking_job_id ON email_tracking(job_id);
CREATE INDEX idx_email_tracking_provider ON email_tracking(provider);
CREATE INDEX idx_email_tracking_status ON email_tracking(status);
CREATE INDEX idx_email_tracking_message_id ON email_tracking(message_id);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
(
    'email_verification',
    'Verify Your Email Address - Booking System',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body>
    <h2>Welcome to Booking System!</h2>
    <p>Hi {{firstName}},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="{{verificationUrl}}">Verify Email Address</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn''t create an account, you can safely ignore this email.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Welcome to Booking System!

Hi {{firstName}},

Please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in 24 hours.

If you didn''t create an account, you can safely ignore this email.

Best regards,
Booking System Team',
    '["firstName", "verificationUrl"]'
),
(
    'password_reset',
    'Reset Your Password - Booking System',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
</head>
<body>
    <h2>Password Reset Request</h2>
    <p>Hi {{firstName}},</p>
    <p>You requested to reset your password. Click the link below to set a new password:</p>
    <p><a href="{{resetUrl}}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn''t request this, you can safely ignore this email.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Password Reset Request

Hi {{firstName}},

You requested to reset your password. Click the link below to set a new password:

{{resetUrl}}

This link will expire in 1 hour.

If you didn''t request this, you can safely ignore this email.

Best regards,
Booking System Team',
    '["firstName", "resetUrl"]'
),
(
    'welcome',
    'Welcome to Booking System!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
</head>
<body>
    <h2>Welcome to Booking System!</h2>
    <p>Hi {{firstName}},</p>
    <p>Thank you for joining Booking System. Your account has been successfully created!</p>
    <p>You can now start booking events and managing your account.</p>
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Welcome to Booking System!

Hi {{firstName}},

Thank you for joining Booking System. Your account has been successfully created!

You can now start booking events and managing your account.

If you have any questions, feel free to contact our support team.

Best regards,
Booking System Team',
    '["firstName"]'
),
(
    'organization_invitation',
    'You''re Invited to Join {{organizationName}} - Booking System',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Organization Invitation</title>
</head>
<body>
    <h2>Organization Invitation</h2>
    <p>Hi {{firstName}},</p>
    <p>You have been invited to join <strong>{{organizationName}}</strong> on Booking System.</p>
    <p>Role: {{roleName}}</p>
    <p>Click the link below to accept the invitation:</p>
    <p><a href="{{invitationUrl}}">Accept Invitation</a></p>
    <p>This invitation will expire in 7 days.</p>
    <p>Best regards,<br>Booking System Team</p>
</body>
</html>',
    'Organization Invitation

Hi {{firstName}},

You have been invited to join {{organizationName}} on Booking System.

Role: {{roleName}}

Click the link below to accept the invitation:

{{invitationUrl}}

This invitation will expire in 7 days.

Best regards,
Booking System Team',
    '["firstName", "organizationName", "roleName", "invitationUrl"]'
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_jobs_updated_at BEFORE UPDATE ON email_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_tracking_updated_at BEFORE UPDATE ON email_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 