package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	EmailJobsProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "email_jobs_processed_total",
			Help: "Total number of email jobs processed",
		},
		[]string{"status", "job_type"},
	)

	EmailJobProcessingDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "email_job_processing_duration_seconds",
			Help:    "Time spent processing email jobs",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"job_type"},
	)
)

func Init() {
	prometheus.MustRegister(EmailJobsProcessed)
	prometheus.MustRegister(EmailJobProcessingDuration)
} 