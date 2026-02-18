
# 2. Query Guardrails & Timeouts
## Scenario: Long-Running Query Mitigation
If a user runs a massive aggregation that bypasses basic filters:
1.  **Strict Context Timeout**: The Go backend (`handleQuery`) now enforces a **hard 30-second context timeout**.
2.  **Database Kill**: If ClickHouse is still processing when the context is cancelled, the connection is dropped.
3.  **Remediation Action**: 
    ```sql
    -- Manually kill query in ClickHouse if stuck
    SELECT query_id, user, elapsed FROM system.processes WHERE elapsed > 30;
    KILL QUERY WHERE query_id = '<id>';
    ```

# 3. Security Hardening
## Headers Mesh
The API now automatically injects enterprise security headers:
*   `Strict-Transport-Security`: Forces HTTPS.
*   `Content-Security-Policy`: Restricts script sources.
*   `X-Frame-Options`: Prevents clickjacking.

## Container & Vulnerability Scanning
**Protocol**: Before any deployment to Prod:
1.  Run `trivy image nexus/api:latest`
2.  Reject build if `CRITICAL` vulnerabilities found.
