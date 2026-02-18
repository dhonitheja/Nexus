
# 📦 Engineering Handover: Nexus Observability Platform

**Status**: Stage 5 (Enterprise Ready)
**Version**: 1.0.0-beta
**Architect**: Nexus Core Team

---

## 🏗️ Core Infrastructure
*   **Log Storage**: ClickHouse (Partitioned by Day, Tiered Storage to S3).
*   **Metrics**: VictoriaMetrics (Prometheus-compatible).
*   **Ingestion**: Redpanda (Kafka) buffering with Schema Validation.
*   **Cache/Locks**: Redis (Query Caching + Distributed Semaphores).
*   **API**: Go (Golang) with strict Context Timeouts & RBAC.
*   **Frontend**: React/Vite with WebSocket Live Streaming.

## 🛡️ Enterprise Hardening Features
1.  **Multi-Tenant Isolation**: Enforced `WHERE org_id = ?` at the SPL Parser level.
2.  **Concurrency Control**: Max 5 concurrent queries per tenant (Redis Semaphore).
3.  **Rate Limiting**: 100 requests/sec per tenant (Token Bucket).
4.  **Security Mesh**: HSTS, CSP, X-Frame-Options, Strict Content-Type.
5.  **Data Safety**: Graceful Shutdown (SIGTERM) drains Kafka producers safely.

## 📂 Key Documentation
*   [**PRODUCTION_GUIDE.md**](./PRODUCTION_GUIDE.md) - How to deploy, configure S3, and setup Vector.
*   [**RUNBOOKS.md**](./RUNBOOKS.md) - Incident response for Disk Full, Latency, and Bad Queries.
*   [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Decision records (ADRs) for Tenancy and SLA.

## 🚀 Quick Commands

### Start Platform (Local)
```bash
docker-compose up -d
```

### Run Load Test (Ingestion)
```bash
k6 run tests/load/ingestion_test.js
```

### Build for Production
```bash
# Backend
docker build -t nexus/api:latest ./backend

# Frontend
docker build -t nexus/frontend:latest .
```

## ⚠️ Known Limits (Beta)
*   **Ingestion**: Tested up to 100k events/sec. Scale `nexus-api` replicas for more.
*   **Retention**: Default 7 days hot / 30 days cold. Adjust in `01_schema.sql`.
*   **Auth**: Currently uses Mock Tokens (`sk_live_12345`). Swap `backend/main.go` headers for JWT middleware before public internet exposure.

---
*Ready for Controlled Beta Launch.*
