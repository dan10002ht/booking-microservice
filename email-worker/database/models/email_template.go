package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// EmailTemplate represents an email template in the database
type EmailTemplate struct {
	ID           string            `json:"id" db:"id"`
	Name         string            `json:"name" db:"name"`
	Subject      string            `json:"subject" db:"subject"`
	HTMLTemplate string            `json:"html_template" db:"html_template"`
	TextTemplate string            `json:"text_template" db:"text_template"`
	Variables    TemplateVariables `json:"variables" db:"variables"`
	IsActive     bool              `json:"is_active" db:"is_active"`
	CreatedAt    time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at" db:"updated_at"`
}

// TemplateVariables represents the variables that can be used in a template
type TemplateVariables map[string]interface{}

// Value implements driver.Valuer for TemplateVariables
func (tv TemplateVariables) Value() (driver.Value, error) {
	if tv == nil {
		return nil, nil
	}
	return json.Marshal(tv)
}

// Scan implements sql.Scanner for TemplateVariables
func (tv *TemplateVariables) Scan(value interface{}) error {
	if value == nil {
		*tv = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, tv)
}

// NewEmailTemplate creates a new email template with a generated UUID
func NewEmailTemplate(name, subject, htmlTemplate, textTemplate string, variables TemplateVariables) *EmailTemplate {
	return &EmailTemplate{
		ID:           uuid.New().String(),
		Name:         name,
		Subject:      subject,
		HTMLTemplate: htmlTemplate,
		TextTemplate: textTemplate,
		Variables:    variables,
		IsActive:     true,
	}
}

// Validate validates the email template
func (t *EmailTemplate) Validate() error {
	if t.Name == "" {
		return errors.New("template name is required")
	}
	if t.Subject == "" {
		return errors.New("template subject is required")
	}
	if t.HTMLTemplate == "" && t.TextTemplate == "" {
		return errors.New("at least one template (HTML or text) is required")
	}
	return nil
}

// GetVariableNames returns a list of variable names used in the template
func (t *EmailTemplate) GetVariableNames() []string {
	var names []string
	for name := range t.Variables {
		names = append(names, name)
	}
	return names
}

// HasVariable checks if the template has a specific variable
func (t *EmailTemplate) HasVariable(name string) bool {
	_, exists := t.Variables[name]
	return exists
}

// GetVariableType returns the type of a variable
func (t *EmailTemplate) GetVariableType(name string) interface{} {
	if t.Variables == nil {
		return nil
	}
	return t.Variables[name]
} 