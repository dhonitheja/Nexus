# Production Implementation Guide

> **CRITICAL**: Before proceeding, ensure you have read and committed to the **[Core Architecture Standards](./ARCHITECTURE.md)**. These decisions (Multi-tenancy, SLA, Retention) are foundational and cannot be easily changed later.

Currently, this application runs in **"Prototype Mode"** using simulated data (`mockData.ts`) and a local query engine (`splEngine.ts`). To move to a **Production Enterprise Environment**, you need to implement a real backend architecture.

## 1. High-Level Architecture

```mermaid
graph TD
    A[Servers/Microservices] -->|Logs & Metrics| B[Data Collector (Vector/FluentBit)]
    B -->|Stream| C[Ingestion API (Go/Node.js)]
    C -->|Logs| D[(ClickHouse / Elasticsearch)]
    C -->|Metrics| E[(Prometheus / VictoriaMetrics)]
    F[Nexus Desktop App] -->|Queries| C
```

## 2. Recommended Technology Stack

For a high-performance, cost-effective production stack (similar to Datadog/Splunk but self-hosted):

| Component | Recommendation | Why? |
|-----------|---------------|------|
| **Log Storage** | **ClickHouse** | 100x faster than Elasticsearch for logs, highly compressed, standard SQL. |
| **Metrics DB** | **VictoriaMetrics** | Drop-in Prometheus replacement, scales easier, uses less RAM. |
| **Ingestion** | **Vector.dev** | Ultra-fast Rust-based data shipper to collect logs/metrics from your servers. |
| **Backend API** | **Go (Golang)** | High concurrency for handling search queries and real-time streams. |
| **Auth** | **Keycloak** | Open-source Identity Provider (SAML/OIDC) for Enterprise RBAC. |

## 3. Step-by-Step Implementation Plan

### Phase 1: The Backend API
Create a unified API Gateway that the Nexus Frontend will talk to instead of `mockData.ts`.

1.  **Create a Backend Service** (e.g., `nexus-api`):
    *   `POST /ingest/logs` - Receives logs from agents.
    *   `POST /query/spl` - Receives SPL strings, translates them to SQL (ClickHouse) or PromQL (Prometheus), and returns JSON.
    *   `GET /metrics` - Proxies metric queries.

2.  **Replace Frontend Logic**:
    *   Modify `src/lib/splEngine.ts` to forward the SPL query string to your backend API instead of processing locally.
    *   Modify `src/pages/Overview.tsx` to fetch metric data from the API.

### Phase 2: Data Ingestion (Getting Data IN)
You need to get data from your servers into the database.

1.  **Install Vector** on your servers.
2.  **Configure Vector** to read log files (`/var/log/*.log`) and send them to your `nexus-api`.
    ```toml
    [sinks.nexus_api]
    type = "http"
    uri = "https://your-nexus-api.com/ingest/logs"
    encoding.codec = "json"
    ```

### Phase 3: The Query Engine (The "Brain")
This is the hardest part of building a Splunk alternative. You need to translate the pipe syntax (`|`) into database queries.

*   **Example Translation**:
    *   Splunk: `search level=ERROR | stats count by service`
    *   ClickHouse SQL: `SELECT service, count(*) FROM logs WHERE level='ERROR' GROUP BY service`

*   **Implementation Strategy**:
    *   Write a distinct parser in your Backend API that takes the raw string, breaks it by the `|` character, and builds a SQL query dynamically.

## 4. Scalability Considerations

*   **Buffering**: Use **Kafka** or **Redpanda** between the Ingestion API and the Database if you handle millions of logs per second.
*   **Tiered Storage**: Move logs older than 7 days to S3/MinIO to save money on SSD storage.

## 5. Security Checklist
*   [ ] Enable TLS/SSL on all endpoints.
*   [ ] Implement Service Accounts for your agents (Vector) to authenticate against the API.
*   [ ] Use OIDC to connect the React Frontend to your company's SSO (Okta/Azure AD).

## 6. Storage Optimization (ClickHouse)

To enable the `TO VOLUME` TTL policy, you must add the following **Storage Policy** to your `clickhouse/config.xml`:

```xml
<storage_configuration>
    <disks>
        <!-- Hot SSD Volume -->
        <hot_ssd>
            <path>/var/lib/clickhouse/data/hot/</path>
        </hot_ssd>
        <!-- Cold HDD Volume -->
        <cold_hdd>
            <path>/mnt/hdd/data/cold/</path>
        </cold_hdd>
        <!-- S3 Object Storage -->
        <s3_bucket>
            <type>s3</type>
            <endpoint>https://s3.us-east-1.amazonaws.com/my-bucket/</endpoint>
            <access_key_id>ACCESS_KEY</access_key_id>
            <secret_access_key>SECRET_KEY</secret_access_key>
        </s3_bucket>
    </disks>
    <policies>
        <tiered_storage>
            <volumes>
                <hot_vol>
                    <disk>hot_ssd</disk>
                </hot_vol>
                <cold_vol>
                    <disk>cold_hdd</disk>
                </hot_vol>
                <s3_vol>
                    <disk>s3_bucket</disk>
                </s3_vol>
            </volumes>
            <move_factor>0.2</move_factor>
        </tiered_storage>
    </policies>
</storage_configuration>
```


This configuration allows ClickHouse to automatically manage data lifecycle based on the TTL rules defined in your schema.

## 7. Performance Testing
Before going live, execute load tests using **k6** or **Locust** to validate system capacity.

A load test script is provided in `tests/load/ingestion_test.js`.

**Commands:**
```bash
# Install k6
brew install k6 # or equivalent

# Run test
k6 run tests/load/ingestion_test.js
```
**Goal:** Intersperse queries and ensure P99 latency < 500ms at 100k/sec ingestion.

## 8. Backup & Disaster Recovery
**ClickHouse** supports automated backups to S3.

1.  Use `clickhouse-backup` utility.
2.  Configure S3 credentials in `~/.clickhouse-backup/config.yml`.
3.  Schedule daily backups using `scripts/backup_clickhouse.sh` via cron.

## 9. CI/CD & DevOps
A robust CI/CD pipeline is critical for zero-downtime deployments.

*   **CI Pipeline**: `.github/workflows/ci.yml` builds and tests every commit.
*   **CD Pipeline**: Use ArgoCD or Flux to deploy Kubernetes manifests (`k8s/`) automatically upon `git push` to `main`.

## Final Production Readiness Checklist

You are **Production-Ready** ONLY if you can check all boxes:

- [ ] **HA Database Cluster**: ClickHouse & VictoriaMetrics running with replication (3 nodes).
- [ ] **Auth Enforced Everywhere**: API validates JWT tokens and permissions (RBAC).
- [ ] **Tenant Isolation Verified**: `org_id` is present in every log line and query filter.
- [ ] **Load Tested**: Verified 2x expected traffic with `k6`.
- [ ] **Backup Tested**: Successfully restored a backup from S3 to a fresh cluster.
- [ ] **TLS Enabled**: HTTPS via Cert-Manager on all endpoints.
- [ ] **Monitoring Active**: Prometheus scraping `/metrics` and alerting on high error rates.
- [ ] **Query Guardrails**: Limits on max results and time ranges are enforced in SPL parser.
- [ ] **No Hardcoded Secrets**: All credentials loaded from Environment Variables / K8s Secrets.
- [ ] **No Local File Dependencies**: State is stored in Persistent Volumes or S3.

**Launch Protocol:**
1.  Spin up infrastructure: `kubectl apply -f k8s/`.
2.  Run `k6` load test.
3.  Deploy Frontend & API.
4.  Onboard first tenant.

## 10. The Final Gate & Runbooks

You are entering **Stage 4: Enterprise Launch Hardening**.

### Security & Hardening Checklist
- [x] **Zero-Downtime Updates**: API gracefully drains connections on SIGTERM.
- [x] **Distributed Rate Limiting**: Per-tenant limits (100 RPS) enforced via Redis.
- [x] **Secrets Management**: Credentials stored in `k8s/10-secrets.yaml` (Upgrade to Vault for Corp).
- [x] **Alerting Configured**: Prometheus rules in `k8s/11-prometheus-rules.yaml`.

### Production Runbooks (Example)

**Scenario 1: Ingestion API Latency Spike**
1.  Check `rate(nexus_ingestion_errors_total)` in Grafana.
2.  Check Kafka Lag: `kafka_consumergroup_lag > 10000`.
3.  **Remediation**: Scale up `nexus-api` replicas or increase Kafka partitions.

**Scenario 2: ClickHouse Disk Full**
1.  Alert triggers `node_filesystem_avail_bytes < 10%`.
2.  **Remediation**:
    *   Immediate: `ALTER TABLE logs DROP PARTITION 20230101` (Oldest data).
    *   Permanent: Resize PVC or adjust TTL policy in `01_schema.sql`.

**Scenario 3: Bad Query freezes DB**
1.  Alert triggers `HighQueryLatency`.
2.  Identify tenant: `top_queries` dashboard.
3.  **Remediation**:
    *   Kill query: `KILL QUERY WHERE query_id='...'`
    *   Ban tenant temporarily via RBAC.

### Final Verdict
This platform is now architected for resilience, security, and scale. It is ready for internal corporate adoption or a Beta SaaS launch.



