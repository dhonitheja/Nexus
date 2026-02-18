
CREATE DATABASE IF NOT EXISTS nexus;

USE nexus;

-- 1. Create Storage Policy (Requires config.xml setup in production)
-- In a real cluster, you would define <storage_configuration> in config.xml
-- to map 'hot_vol' to SSD, 'cold_vol' to HDD, and 's3_vol' to S3.

-- 2. Create Validation Table with Tiered Storage Architecture
CREATE TABLE IF NOT EXISTS logs (
    timestamp DateTime64(3),
    
    -- Tenant Isolation (Primary Sort Key)
    org_id LowCardinality(String),
    
    -- Metadata (Optimized for fast filtering)
    service LowCardinality(String),
    level LowCardinality(String),
    trace_id String,
    
    -- Content (Compressed)
    message String CODEC(ZSTD(1)),
    body String CODEC(ZSTD(3)), -- Higher compression for raw JSON
    
    -- Indexing for Text Search (Bloom Filter)
    INDEX message_idx message TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 8192
)
ENGINE = MergeTree()
-- Partitioning: Breaks data into days. 
-- Efficient for "Drop Partition" operations and time-range queries.
PARTITION BY toYYYYMMDD(timestamp)

-- Primary Key: Physically sorts data on disk.
-- 1. org_id: Keeps all tenant data contiguous (Critical for isolation)
-- 2. timestamp: Optimizes time-range scans
-- 3. service: Secondary filter
ORDER BY (org_id, timestamp, service)

-- TTL (Time To Live) / Data Lifecycle Management
-- Note: 'TO VOLUME' requires storage_policy to be configured. 
-- Schema below implements the logic requested.
TTL timestamp + INTERVAL 7 DAY TO VOLUME 'cold_disk',
    timestamp + INTERVAL 30 DAY TO VOLUME 's3_bucket',
    timestamp + INTERVAL 365 DAY DELETE;

-- Settings to optimize ingestion
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;
