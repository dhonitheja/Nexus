
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client

func initRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})
}

// CheckCache attempts to retrieve a query result from Redis
func CheckCache(ctx context.Context, key string) (string, error) {
	val, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", nil // Cache miss
	} else if err != nil {
		return "", err
	}
	return val, nil
}

// SetCache stores a query result in Redis with a TTL (30s default)
func SetCache(ctx context.Context, key string, val string) error {
	return rdb.Set(ctx, key, val, 30*time.Second).Err()
}

// AllowRequest checks if a tenant has exceeded their rate limit (Fixed Window)
// Returns true if allowed, false if limit exceeded
func AllowRequest(ctx context.Context, tenantID string, limit int64) (bool, error) {
	key := fmt.Sprintf("rate_limit:%s", tenantID)
	
	// Atomic INCR + EXPIRE
	pipe := rdb.Pipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, 1*time.Second) // 1 second window
	_, err := pipe.Exec(ctx)
	
	if err != nil {
		return false, err
	}
	
	count, _ := incr.Result()
	return count <= limit, nil
}

// AcquireSemaphore attempts to acquire a concurrency slot for a tenant
// Returns true if acquired (allow query), false if limit reached
func AcquireSemaphore(ctx context.Context, tenantID string, maxConcurrent int64) (bool, error) {
	key := fmt.Sprintf("concurrent_queries:%s", tenantID)

	// Increment current active queries
	count, err := rdb.Incr(ctx, key).Result()
	if err != nil {
		return false, err
	}

	// If we just started, set an expiration (safety valve if process crashes without releasing)
	if count == 1 {
		rdb.Expire(ctx, key, 60*time.Second) 
	}

	if count > maxConcurrent {
		// Limit exceeded, decrement immediately and reject
		rdb.Decr(ctx, key)
		return false, nil
	}

	return true, nil
}

// ReleaseSemaphore decrements the concurrency counter
func ReleaseSemaphore(ctx context.Context, tenantID string) {
	key := fmt.Sprintf("concurrent_queries:%s", tenantID)
	rdb.Decr(ctx, key)
}
