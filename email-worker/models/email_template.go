package models

import (
	"fmt"
	"time"
)

// EmailTemplate represents an email template in the system
type EmailTemplate struct {
	ID           string            `db:"id" json:"id"`
	Name         string            `db:"name" json:"name"`
	Subject      *string           `db:"subject" json:"subject"`
	HTMLTemplate *string           `db:"html_template" json:"html_template"`
	TextTemplate *string           `db:"text_template" json:"text_template"`
	Variables    *map[string]string `db:"variables" json:"variables"`
	IsActive     bool              `db:"is_active" json:"is_active"`
	CreatedAt    time.Time         `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time         `db:"updated_at" json:"updated_at"`
}

// NewEmailTemplate creates a new EmailTemplate
func NewEmailTemplate(id, name string) *EmailTemplate {
	return &EmailTemplate{
		ID:        id,
		Name:      name,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// SetSubject sets the subject for the template
func (t *EmailTemplate) SetSubject(subject string) {
	t.Subject = &subject
	t.UpdatedAt = time.Now()
}

// SetHTMLTemplate sets the HTML template content
func (t *EmailTemplate) SetHTMLTemplate(htmlTemplate string) {
	t.HTMLTemplate = &htmlTemplate
	t.UpdatedAt = time.Now()
}

// SetTextTemplate sets the text template content
func (t *EmailTemplate) SetTextTemplate(textTemplate string) {
	t.TextTemplate = &textTemplate
	t.UpdatedAt = time.Now()
}

// SetVariables sets the template variables
func (t *EmailTemplate) SetVariables(variables map[string]string) {
	t.Variables = &variables
	t.UpdatedAt = time.Now()
}

// SetActive sets the active status
func (t *EmailTemplate) SetActive(isActive bool) {
	t.IsActive = isActive
	t.UpdatedAt = time.Now()
}

// HasHTMLTemplate checks if the template has HTML content
func (t *EmailTemplate) HasHTMLTemplate() bool {
	return t.HTMLTemplate != nil && *t.HTMLTemplate != ""
}

// HasTextTemplate checks if the template has text content
func (t *EmailTemplate) HasTextTemplate() bool {
	return t.TextTemplate != nil && *t.TextTemplate != ""
}

// GetVariable returns a template variable value
func (t *EmailTemplate) GetVariable(key string) (string, bool) {
	if t.Variables == nil {
		return "", false
	}
	value, exists := (*t.Variables)[key]
	return value, exists
}

// Validate checks if the template is valid
func (t *EmailTemplate) Validate() error {
	if t.ID == "" {
		return fmt.Errorf("template ID is required")
	}
	if t.Name == "" {
		return fmt.Errorf("template name is required")
	}
	if !t.HasHTMLTemplate() && !t.HasTextTemplate() {
		return fmt.Errorf("template must have either HTML or text content")
	}
	return nil
} 