# Nexus Product Roadmap 2026-2027

To build the world's most performant, cost-effective, and open observability platform.

## 🌟 Current Capabilities (v1.0 - "Foundation")
*   **Log Management**: High-throughput ingestion (Kafka/Redpanda) → Real-time Processing (Go) → Columnar Storage (ClickHouse).
*   **Metrics & Alerting**: Prometheus-compatible scraping, VictoriaMetrics long-term storage, and Alertmanager routing (Slack/PagerDuty).
*   **Enterprise Security**: Role-Based Access Control (RBAC), HSTS/CSP headers, Audit Logging, and Rate Limiting.
*   **Dashboarding**: React-based visualization framework with live WebSocket updates.

---

## 🚀 Near-Term Roadmap (Q1-Q2 2026)

### 1. Distributed Tracing & APM
**Goal:** Complete the "Three Pillars of Observability" (Logs, Metrics, Traces).
*   **OpenTelemetry Support**: Native ingestion of OTLP traces.
*   **Service Maps**: Auto-generate dependency graphs based on trace spans.
*   **Latency Analysis**: Waterfall visualizations for request bottlenecks using Jaeger or Tempo backend integration.

### 2. Intelligent AIOps
**Goal:** Move from "What happened?" to "Why did it happen?".
*   **Anomaly Detection**: Train lightweight ML models on historical metric data in VictoriaMetrics to detect deviations (e.g., CPU spikes, error rate jumps).
*   **Log Clustering**: Automatically group millions of similar log lines into "patterns" to reduce noise during incidents.
*   **Predictive Alerting**: Forecast disk usage and saturation to alert *before* an outage occurs.

### 3. Advanced Visualization
**Goal:** Empower users to explore data without writing SQL.
*   **Visual Query Builder**: Drag-and-drop interface to generate PromQL and SQL queries.
*   **Custom Dashboards**: Save and share dashboard layouts with team members.
*   **PDF Reporting**: Scheduled executive summaries for compliance and uptime SLAs.

---

## 🔮 Long-Term Vision (2026+)

### 1. "Self-Healing" Infrastructure
**Goal:** Automate remediation.
*   **Webhook Actions**: Trigger webhooks in response to alerts (e.g., restart a pod, scale an ASG).
*   **Runbook Automation**: Execute predefined scripts/Ansible playbooks when specific alerts fire.

### 2. Cost Intelligence
**Goal:** Make observability affordable at scale.
*   **Tiered Storage**: Automatically move older logs to S3/GCS (Cold Storage) for cheaper retention.
*   **Cardinality Analysis**: Identify and block high-cardinality metrics that bloat storage costs.

### 3. Edge Observability
**Goal:** Monitor IoT and edge devices.
*   **Lightweight Agent**: A Rust-based agent optimized for low-resource environments (compile Vector to WASM?).
*   **Offline Buffering**: Store telemetry locally on devices when connectivity is lost and upload later.
