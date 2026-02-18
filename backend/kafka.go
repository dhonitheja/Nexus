package main

import (
	"log"
	"os"
	"strings"
	"time"

	kafka "github.com/segmentio/kafka-go"
)

// Global Kafka Writer (Shared, Thread-safe)
var kafkaWriter *kafka.Writer

func initKafka() {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "redpanda:9092"
	}

	kafkaWriter = &kafka.Writer{
		Addr:         kafka.TCP(strings.Split(brokers, ",")...),
		Topic:        "nexus-logs",
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    100,
		BatchTimeout: 100 * time.Millisecond,
	}
	log.Printf("Kafka writer initialized for brokers: %s", brokers)
}
