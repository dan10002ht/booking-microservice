package templates

import (
	"bytes"
	"fmt"
	"text/template"

	"booking-system/email-worker/models"
)

// Engine handles template rendering
type Engine struct {
	funcMap template.FuncMap
}

// NewEngine creates a new template engine
func NewEngine() *Engine {
	return &Engine{
		funcMap: template.FuncMap{
			"formatDate": func(format string, date any) string {
				// TODO: Implement date formatting
				return fmt.Sprintf("%v", date)
			},
			"formatCurrency": func(amount any) string {
				// TODO: Implement currency formatting
				return fmt.Sprintf("$%.2f", amount)
			},
		},
	}
}

// Render renders an email template with the given data
func (e *Engine) Render(template *models.EmailTemplate, data map[string]any) (string, string, string, error) {
	var subject, htmlBody, textBody string
	var err error

	// Render subject
	if template.Subject != nil {
		subject, err = e.renderText(*template.Subject, data)
		if err != nil {
			return "", "", "", fmt.Errorf("failed to render subject: %w", err)
		}
	}

	// Render HTML template
	if template.HTMLTemplate != nil && *template.HTMLTemplate != "" {
		htmlBody, err = e.renderHTML(*template.HTMLTemplate, data)
		if err != nil {
			return "", "", "", fmt.Errorf("failed to render HTML template: %w", err)
		}
	}

	// Render text template
	if template.TextTemplate != nil && *template.TextTemplate != "" {
		textBody, err = e.renderText(*template.TextTemplate, data)
		if err != nil {
			return "", "", "", fmt.Errorf("failed to render text template: %w", err)
		}
	}

	return subject, htmlBody, textBody, nil
}

// renderHTML renders HTML template
func (e *Engine) renderHTML(tmpl string, variables map[string]any) (string, error) {
	t, err := template.New("html").Funcs(e.funcMap).Parse(tmpl)
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, variables); err != nil {
		return "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	return buf.String(), nil
}

// renderText renders text template
func (e *Engine) renderText(tmpl string, variables map[string]any) (string, error) {
	t, err := template.New("text").Funcs(e.funcMap).Parse(tmpl)
	if err != nil {
		return "", fmt.Errorf("failed to parse text template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, variables); err != nil {
		return "", fmt.Errorf("failed to execute text template: %w", err)
	}

	return buf.String(), nil
}

// ValidateTemplate validates a template
func (e *Engine) ValidateTemplate(tmpl string) error {
	_, err := template.New("validation").Funcs(e.funcMap).Parse(tmpl)
	if err != nil {
		return fmt.Errorf("invalid template: %w", err)
	}
	return nil
} 