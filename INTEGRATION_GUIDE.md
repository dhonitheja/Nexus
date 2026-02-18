# Nexus Integration Guide

## 1. Alerting Integrations (Slack, Email, PagerDuty)

Your alerting stack is running! To connect it to your communication channels, edit the configuration file:

**File:** `infrastructure/alertmanager/alertmanager.yml`

### Slack
1. Create a [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks).
2. Update the config:
   ```yaml
   receivers:
     - name: 'slack-critical'
       slack_configs:
         - api_url: '<YOUR_SLACK_WEBHOOK_URL>'
           channel: '#alerts'
   ```

### PagerDuty
Add a PagerDuty receiver:
```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_INTEGRATION_KEY'
```

---

## 2. Application Integration (Sending Telemetry)

### Node.js (Logs & Metrics)

Install the client:
```bash
npm install prom-client winston
```

**Metrics Middleware (Express):**
```javascript
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

**Sending Logs:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Http({
      host: 'localhost',
      port: 8080,
      path: '/ingest/logs',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    })
  ]
});

logger.error('Database connection failed', { service: 'payments-api' });
```

### Python (Logs)

```python
import logging
import requests

class NexusHandler(logging.Handler):
    def emit(self, record):
        log_entry = {
            "level": record.levelname,
            "message": record.getMessage(),
            "service": "my-python-app"
        }
        try:
            requests.post("http://localhost:8080/ingest/logs", json=log_entry, timeout=1)
        except:
            pass

logger = logging.getLogger("nexus")
logger.addHandler(NexusHandler())
logger.error("Something went wrong!")
```

## 3. Kubernetes Integration

To run Nexus inside Kubernetes and scrape pods automatically:

1. **Deploy the Agent (Vector or Promtail):**
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: vector-config
   data:
     vector.toml: |
       [sources.k8s_logs]
       type = "kubernetes_logs"
       
       [sinks.nexus]
       type = "http"
       uri = "http://nexus-service:8080/ingest/logs"
       encoding.codec = "json"
   ```

2. **Annotate Pods for Metrics:**
   ```yaml
   metadata:
     annotations:
       prometheus.io/scrape: "true"
       prometheus.io/port: "8080"
   ```

## 4. Testing the Integration

**Trigger a Test Alert:**
You can manually fire a test alert to verify your Slack/Email integration:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:9093/api/v1/alerts" -Method POST -Body '[{"labels":{"alertname":"TestAlert","severity":"critical"},"annotations":{"summary":"Integration Test","description":"This is a test alert from Nexus."}}]' -ContentType "application/json"
```
