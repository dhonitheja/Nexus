package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	kafka "github.com/segmentio/kafka-go"
	"nexus-api/pkg/audit"
	"nexus-api/pkg/metrics"
	"nexus-api/pkg/spl"
)

// LogEntry defines the expected schema for incoming logs
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	Service   string `json:"service"`
	Message   string `json:"message"`
	OrgID     string `json:"org_id,omitempty"`
}

// RBAC Definitions
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperator Role = "operator"
	RoleViewer   Role = "viewer"
)

var rolePermissions = map[Role][]string{
	RoleAdmin:    {"query", "ingest", "delete", "manage_users"},
	RoleOperator: {"query", "ingest", "manage_agents"},
	RoleViewer:   {"query"},
}

// Mock Token Store with Roles (replace with JWT validation in production)
var validTokens = map[string]struct {
	TenantID string
	Role     Role
}{
	"sk_live_12345": {"tenant-a", RoleAdmin},
	"sk_test_67890": {"tenant-b", RoleViewer},
}

func hasPermission(role Role, requiredPerm string) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == requiredPerm {
			return true
		}
	}
	return false
}

// securityHeadersMiddleware injects enterprise security headers on every response
func securityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self';")
		next.ServeHTTP(w, r)
	})
}

// authMiddleware validates Bearer token, enforces RBAC, and applies distributed rate limiting
func authMiddleware(requiredPerm string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization Header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization Header Format", http.StatusUnauthorized)
			return
		}

		token := parts[1]
		claims, valid := validTokens[token]
		if !valid {
			http.Error(w, "Invalid Service Token", http.StatusForbidden)
			return
		}

		// RBAC Check
		if requiredPerm != "" && !hasPermission(claims.Role, requiredPerm) {
			http.Error(w, fmt.Sprintf("Forbidden: Role '%s' missing permission '%s'", claims.Role, requiredPerm), http.StatusForbidden)
			return
		}

		// Distributed Rate Limit via Redis (100 req/sec per tenant)
		allowed, err := AllowRequest(context.Background(), claims.TenantID, 100)
		if err != nil {
			log.Printf("Rate limit check error: %v", err)
		}
		if !allowed {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "Rate Limit Exceeded", http.StatusTooManyRequests)
			return
		}

		r.Header.Set("X-Tenant-ID", claims.TenantID)
		r.Header.Set("X-User-Role", string(claims.Role))
		next(w, r)
	}
}

// handleIngest accepts log batches, validates schema, and pushes to Kafka
func handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload []LogEntry
	r.Body = http.MaxBytesReader(w, r.Body, 1024*1024) // 1MB limit

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	tenantID := r.Header.Get("X-Tenant-ID")

	kafkaMessages := make([]kafka.Message, 0, len(payload))
	for i := range payload {
		if payload[i].Timestamp == "" {
			payload[i].Timestamp = time.Now().Format(time.RFC3339)
		}
		if payload[i].Service == "" || payload[i].Level == "" || payload[i].Message == "" {
			http.Error(w, "Schema Violation: service, level, and message are required", http.StatusBadRequest)
			return
		}
		payload[i].OrgID = tenantID // Enforce tenant isolation

		val, _ := json.Marshal(payload[i])
		kafkaMessages = append(kafkaMessages, kafka.Message{
			Key:   []byte(tenantID),
			Value: val,
		})
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := kafkaWriter.WriteMessages(ctx, kafkaMessages...); err != nil {
			log.Printf("ERROR: Failed to push to Kafka: %v", err)
			metrics.IngestionErrors.Inc()
		}
	}()

	metrics.IngestedLogs.Add(float64(len(payload)))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	fmt.Fprintf(w, `{"status":"queued","ingested_count":%d}`, len(payload))
}

// handleQuery parses SPL, enforces guardrails, checks cache, and executes against ClickHouse
func handleQuery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query string `json:"query"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request Body", http.StatusBadRequest)
		return
	}

	tenantID := r.Header.Get("X-Tenant-ID")
	userRole := r.Header.Get("X-User-Role")

	// Hard 30-second timeout for the entire query lifecycle
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Parse SPL query
	q, err := spl.Parse(req.Query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Query Parse Error: %v", err), http.StatusBadRequest)
		return
	}

	// Concurrency guardrail: max 5 simultaneous queries per tenant
	canRun, err := AcquireSemaphore(ctx, tenantID, 5)
	if err != nil {
		log.Printf("Semaphore error for tenant %s: %v", tenantID, err)
	}
	if !canRun {
		http.Error(w, "Query Concurrency Limit Exceeded (max 5 per tenant)", http.StatusTooManyRequests)
		return
	}
	defer ReleaseSemaphore(context.Background(), tenantID)

	// Check cache first
	cacheKey := q.ComputeHash(tenantID)
	if cached, _ := CheckCache(ctx, cacheKey); cached != "" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		w.Write([]byte(cached))
		return
	}

	// Generate SQL — automatically injects WHERE org_id = tenantID
	sqlStr, args := q.ToSQL("logs", tenantID)

	// Check for timeout before executing
	select {
	case <-ctx.Done():
		http.Error(w, "Query Timeout: exceeded 30s limit", http.StatusGatewayTimeout)
		return
	default:
		log.Printf("[%s] Executing: %s args=%v", tenantID, sqlStr, args)
	}

	// Audit log
	audit.Log(tenantID, userRole, "QUERY_EXECUTE", "logs", req.Query, "SUCCESS", r.RemoteAddr)

	// Mock result (replace with real ClickHouse db.QueryContext call)
	result := `[{"timestamp":"2024-01-01T10:00:00Z","service":"auth-service","level":"INFO","message":"User login success"}]`

	go SetCache(context.Background(), cacheKey, result)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.Write([]byte(result))
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	initKafka()
	initRedis()

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Prometheus metrics endpoint
	mux.Handle("/metrics", promhttp.Handler())

	// Ingestion endpoint — requires "ingest" permission
	mux.HandleFunc("/ingest/logs", authMiddleware("ingest", handleIngest))

	// Query endpoint — requires "query" permission, wrapped with Prometheus timer
	mux.HandleFunc("/query/spl", authMiddleware("query", func(w http.ResponseWriter, r *http.Request) {
		timer := prometheus.NewTimer(metrics.QueryDuration)
		defer timer.ObserveDuration()
		handleQuery(w, r)
	}))

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      securityHeadersMiddleware(mux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 35 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in background goroutine
	go func() {
		log.Printf("Nexus API listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %s", err)
		}
	}()

	// Graceful shutdown on SIGTERM / Ctrl+C
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown signal received...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}

	if kafkaWriter != nil {
		kafkaWriter.Close()
	}

	log.Println("Server exited cleanly")
}
