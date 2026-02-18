
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	IngestedLogs = promauto.NewCounter(prometheus.CounterOpts{
		Name: "nexus_logs_ingested_total",
		Help: "The total number of processed log entries",
	})
	
	IngestionErrors = promauto.NewCounter(prometheus.CounterOpts{
		Name: "nexus_ingestion_errors_total",
		Help: "Total number of failed ingestion requests",
	})

	QueryDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "nexus_query_duration_seconds",
		Help:    "Time taken to execute SPL queries",
		Buckets: prometheus.DefBuckets,
	})

	ActiveTenants = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "nexus_active_tenants",
		Help: "Number of tenants currently sending data",
	})
)
