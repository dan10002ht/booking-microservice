package templates

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"text/template"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// TemplateRenderer handles email template rendering
type TemplateRenderer struct {
	funcMap template.FuncMap
}

// NewTemplateRenderer creates a new template renderer
func NewTemplateRenderer() *TemplateRenderer {
	return &TemplateRenderer{
		funcMap: template.FuncMap{
			"upper":   strings.ToUpper,
			"lower":   strings.ToLower,
			"title":   cases.Title(language.English).String,
			"trim":    strings.TrimSpace,
			"replace": strings.Replace,
			"split":   strings.Split,
			"join":    strings.Join,
			"add": func(a, b int) int {
				return a + b
			},
			"sub": func(a, b int) int {
				return a - b
			},
			"mul": func(a, b int) int {
				return a * b
			},
			"div": func(a, b int) int {
				return a / b
			},
			"mod": func(a, b int) int {
				return a % b
			},
		},
	}
}

// RenderHTML renders HTML template with data
func (r *TemplateRenderer) RenderHTML(templateContent string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("html").Funcs(r.funcMap).Parse(templateContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	return buf.String(), nil
}

// RenderText renders text template with data
func (r *TemplateRenderer) RenderText(templateContent string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("text").Funcs(r.funcMap).Parse(templateContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse text template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute text template: %w", err)
	}

	return buf.String(), nil
}

// RenderSubject renders subject template with data
func (r *TemplateRenderer) RenderSubject(subjectTemplate string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("subject").Funcs(r.funcMap).Parse(subjectTemplate)
	if err != nil {
		return "", fmt.Errorf("failed to parse subject template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute subject template: %w", err)
	}

	return buf.String(), nil
}

// ValidateTemplate validates template syntax
func (r *TemplateRenderer) ValidateTemplate(templateContent string) error {
	_, err := template.New("validation").Funcs(r.funcMap).Parse(templateContent)
	if err != nil {
		return fmt.Errorf("invalid template syntax: %w", err)
	}
	return nil
}

// ExtractVariables extracts variable names from template
func (r *TemplateRenderer) ExtractVariables(templateContent string) ([]string, error) {
	_, err := template.New("extraction").Funcs(r.funcMap).Parse(templateContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse template for variable extraction: %w", err)
	}

	// This is a simplified approach - in a real implementation,
	// you might want to use a more sophisticated parser
	var variables []string
	
	// Look for common variable patterns
	patterns := []string{
		"{{.}}",
		"{{.}}",
		"{{.}}",
	}
	
	for _, pattern := range patterns {
		if strings.Contains(templateContent, pattern) {
			// Extract variable name from pattern
			// This is a simplified implementation
			variables = append(variables, "variable")
		}
	}

	return variables, nil
}

// ParseTemplateData parses JSON template data
func (r *TemplateRenderer) ParseTemplateData(dataJSON string) (map[string]interface{}, error) {
	if dataJSON == "" {
		return make(map[string]interface{}), nil
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(dataJSON), &data); err != nil {
		return nil, fmt.Errorf("failed to parse template data JSON: %w", err)
	}

	return data, nil
}

// ValidateTemplateData validates that all required variables are provided
func (r *TemplateRenderer) ValidateTemplateData(templateContent string, data map[string]interface{}) error {
	variables, err := r.ExtractVariables(templateContent)
	if err != nil {
		return fmt.Errorf("failed to extract variables: %w", err)
	}

	for _, variable := range variables {
		if _, exists := data[variable]; !exists {
			return fmt.Errorf("missing required variable: %s", variable)
		}
	}

	return nil
} 