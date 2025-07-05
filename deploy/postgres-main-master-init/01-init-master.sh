#!/bin/bash

# Initialize main database master for booking_system
set -e

echo "🔧 Initializing main database master..."

# Create replicator user for replication
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator WITH REPLICATION PASSWORD 'replicator_pass';
    
    -- Create email-worker tables
    CREATE TABLE IF NOT EXISTS email_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(100) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        template_name VARCHAR(100),
        template_data JSONB,
        priority INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        variables JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES email_jobs(id),
        provider VARCHAR(50),
        message_id VARCHAR(255),
        status VARCHAR(50),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_priority ON email_jobs(priority);
    CREATE INDEX IF NOT EXISTS idx_email_jobs_scheduled_at ON email_jobs(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_email_tracking_job_id ON email_tracking(job_id);
    CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);

    -- Insert default email templates
    INSERT INTO email_templates (name, subject, html_content, text_content) VALUES
    ('welcome_email', 'Welcome to Booking System!', 
     '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining our platform.</p>',
     'Welcome {{user_name}}! Thank you for joining our platform.'),
    ('email_verification', 'Verify Your Email Address',
     '<h1>Email Verification</h1><p>Please click the link to verify your email: {{verification_link}}</p>',
     'Email Verification: Please click the link to verify your email: {{verification_link}}')
    ON CONFLICT (name) DO NOTHING;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO booking_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO booking_user;
EOSQL

echo "✅ Main database master initialized successfully!" 