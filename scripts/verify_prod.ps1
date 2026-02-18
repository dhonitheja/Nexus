
Write-Host "🚀 Starting Production Verification Suite..." -ForegroundColor Cyan

# 1. Start Infrastructure
Write-Host "1. Spinning up Docker containers (Production Mode)..."
docker-compose up -d --build

# 2. Wait for API Health
Write-Host "2. Probing API Health (http://localhost:8080/health)..."
$retries = 30
$healthy = $false
while ($retries -gt 0) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method Get -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API is Healthy!" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
        $retries--
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $healthy) {
    Write-Error "`n❌ API failed to start or is unreachable."
    exit 1
}

# 3. run Load Test (k6)
Write-Host "`n3. Running Load Test (100k events/sec simulation)..."
if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "Found local k6 binary."
    # API_URL env var passed automatically if set, otherwise default
    k6 run tests/load/ingestion_test.js
} else {
    Write-Host "Local k6 not found. Using Docker image (grafana/k6)..."
    # Mount current directory to /tests inside container
    # Use host.docker.internal for Windows/Mac Docker Desktop to reach host localhost
    docker run --rm -i `
        -v ${PWD}/tests:/tests `
        -e API_URL="http://host.docker.internal:8080" `
        grafana/k6 run /tests/load/ingestion_test.js
}

# 4. Verify Data Query
Write-Host "`n4. Verifying Data Query (Audit Check)..."
$queryBody = @{
    query = "search level=INFO | head 5"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer sk_live_12345"
        "Content-Type" = "application/json"
    }
    $queryResponse = Invoke-RestMethod -Uri "http://localhost:8080/query/spl" -Method Post -Body $queryBody -Headers $headers
    
    if ($queryResponse) {
        Write-Host "✅ Query Returned Data:" -ForegroundColor Green
        Write-Host ($queryResponse | ConvertTo-Json -Depth 2)
    } else {
        Write-Warning "⚠️ Query succeeded but returned no data (Log buffer might be processing)."
    }
} catch {
    Write-Error "❌ Query Failed: $_"
}

Write-Host "`n🎉 Production Verification Complete!" -ForegroundColor Cyan
Write-Host "Access UI at http://localhost:3000"
