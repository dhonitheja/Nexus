# Nexus Architecture Standards (ADR-001)

These core decisions are locked in to prevent future refactoring. All development must adhere to these standards.

## 1. Tenancy Model: **Multi-Tenant**
*   **Decision**: The system is designed from day one to support multiple isolated tenants (Organizations) within a single deployment.
*   **Implication**:
    *   Every database table (Logs, Metrics, Traces) MUST have an `org_id` column.
    *   All API requests MUST carry an implementation of `X-Org-ID` or derive it from the JWT token.
    *   Data isolation is logical (Row-Level Security), not physical (separate DBs), to maximize resource efficiency.

## 2. Deployment Model: **Hybrid (SaaS-Ready)**
*   **Decision**: The codebase supports both self-hosted (On-Prem / Air-gapped) and Cloud SaaS deployments.
*   **Implication**:
    *   Configuration is driven strictly by Environment Variables (12-Factor App).
    *   External dependencies (S3, Auth0) must have local fallback options (MinIO, Keycloak) for air-gapped modes.

## 3. Service Level Agreement (SLA): **99.9% (High Availability)**
*   **Target**: < 43 minutes of downtime per month.
*   **Implication**:
    *   Critical paths (Ingestion API) must run in N+1 redundancy (minimum 2 replicas).
    *   Database (ClickHouse/VictoriaMetrics) must be clustered with replication enabled.
    *   Ingestion buffers (Kafka/Redpanda) are mandatory to prevent data loss during maintenance.

## 4. Data Retention Strategy
*   **Default Policy**: Partitioning strategy based on efficient storage tiering.
    *   **Hot (NVMe SSD)**: **7 Days**. Instant search (< 1s latency).
    *   **Warm (HDD/Standard SSD)**: **30 Days**. Slower search, lower cost.
    *   **Cold (S3/Blob Storage)**: **365 Days**. For compliance auditing only.
*   **Implication**: ClickHouse tables must use TTL policies to auto-move data to S3 volumes after 7 days.

## 5. Performance Targets
*   **Ingestion Rate**: **100,000 logs/second** per ingestion node.
*   **Search Latency**: P95 < 2 seconds for queries over last 24 hours (Hot Tier).
*   **Implication**:
    *   Use **Rust (Vector)** for data collection.
    *   Use **Go** for high-throughput API processing.
    *   No synchronous database writes in the critical path; always buffer first.
