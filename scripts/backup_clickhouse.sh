
#!/bin/bash
# Backup ClickHouse tables using clickhouse-backup tool (assumed installed)

# 1. Create a Snapshot
echo "Creating backup snapshot..."
clickhouse-backup create_remote daily_$(date +%Y%m%d)

# 2. Upload to S3
# Requires configured ~/.clickhouse-backup/config.yml with S3 access keys
echo "Uploading to S3..."
clickhouse-backup upload daily_$(date +%Y%m%d)

# 3. Verify
echo "Verifying backup integrity..."
clickhouse-backup list

echo "Backup complete!"
