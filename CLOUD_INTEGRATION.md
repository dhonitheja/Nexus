# Cloud Integration Guide

This guide explains how to ship logs and metrics from major cloud providers (AWS, Azure, GCP) to your Nexus Observability Platform.

The recommended approach is to use **Vector** (by Datadog) or **Fluent Bit** as an edge agent in your cloud environment to collect telemetry and push it to your Nexus HTTP endpoints.

---

## ☁️ AWS (Amazon Web Services)

### Option 1: AWS Lambda (Serverless)
Deploy a Lambda function subscribed to CloudWatch Logs that forwards logs to Nexus.

1. **Create a Lambda Function:**
   - Runtime: Node.js 20.x
   - Env Vars: `NEXUS_ENDPOINT=https://your-nexus-domain.com/ingest/logs`, `API_KEY=sk_live_...`

   ```javascript
   const https = require('https');

   exports.handler = async (event) => {
       const logEvents = event.awslogs.data; // Decode base64 & gzip
       // ... (decoding logic standard for CloudWatch) ...
       
       const payload = JSON.stringify({
           service: "aws-lambda",
           logs: decodedLogs.logEvents
       });

       // POST to Nexus
       // ...
   };
   ```

### Option 2: EC2 / ECS (Vector Agent)
Run Vector as a daemon or sidecar.

**vector.toml:**
```toml
[sources.cloudwatch]
type = "aws_cloudwatch_logs"
region = "us-east-1"
group_names = ["/aws/lambda/my-app", "production-api"]
auth.access_key_id = "${AWS_ACCESS_KEY_ID}"
auth.secret_access_key = "${AWS_SECRET_ACCESS_KEY}"

[sinks.nexus]
type = "http"
uri = "https://your-nexus-domain.com/ingest/logs"
encoding.codec = "json"
auth.strategy = "bearer"
auth.token = "${NEXUS_API_KEY}"
```

---

## 🔷 Microsoft Azure

### Azure Event Hubs Approach
Azure Monitor > Diagnostic Settings > Stream to Event Hub > Vector (Event Hub Source) > Nexus.

1. **Create Event Hub Namespace & Event Hub**.
2. **Configure Diagnostic Settings** on your Resources (VMs, App Service) to stream logs to that Event Hub.
3. **Run Vector** (e.g. in Azure Container Apps) to consume the Event Hub and push to Nexus.

**vector.toml:**
```toml
[sources.azure_logs]
type = "azure_eventhub"
namespace = "my-eventhub-ns"
name = "logs-hub"
group = "$Default"
connection_string = "${AZURE_CONNECTION_STRING}"

[sinks.nexus]
type = "http"
uri = "https://your-nexus-domain.com/ingest/logs"
encoding.codec = "json"
auth.strategy = "bearer"
auth.token = "${NEXUS_API_KEY}"
```

---

## 🌈 Google Cloud Platform (GCP)

### Pub/Sub Approach
Cloud Logging > Log Router Sink > Pub/Sub Topic > Vector (Pub/Sub Source) > Nexus.

1. **Create a Pub/Sub Topic** (e.g., `nexus-logs`).
2. **Create a Log Sink** in Cloud Logging:
   - Destination: `pubsub.googleapis.com/projects/my-project/topics/nexus-logs`
   - Filter: `severity >= WARNING` (optional)
3. **Run Vector** (e.g. in Cloud Run or GKE) to consume the topic.

**vector.toml:**
```toml
[sources.gcp_logs]
type = "gcp_pubsub"
project = "my-project-id"
subscription = "nexus-sub"
credentials_path = "/path/to/service-account.json"

[sinks.nexus]
type = "http"
uri = "https://your-nexus-domain.com/ingest/logs"
encoding.codec = "json"
auth.strategy = "bearer"
auth.token = "${NEXUS_API_KEY}"
```
