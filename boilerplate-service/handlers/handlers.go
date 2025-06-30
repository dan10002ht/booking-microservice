package handlers

import (
	"boilerplate-service/metrics"
	"boilerplate-service/services"
)

type Handlers struct {
	Health *HealthHandler
	Status *StatusHandler
	User   *UserHandler
	Admin  *AdminHandler
}

func NewHandlers(services *services.Services, metrics *metrics.Metrics) *Handlers {
	return &Handlers{
		Health: NewHealthHandler(services, metrics),
		Status: NewStatusHandler(services, metrics),
		User:   NewUserHandler(services, metrics),
		Admin:  NewAdminHandler(services, metrics),
	}
} 