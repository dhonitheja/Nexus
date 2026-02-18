
package audit

import (
	"encoding/json"
	"fmt"
	"time"
)

type AuditEvent struct {
	Timestamp string `json:"timestamp"`
	Actor     string `json:"actor"`   // User ID or Service Account
	Role      string `json:"role"`    // RBAC Role
	Action    string `json:"action"`  // QUERY, INGEST, DELETE, LOGIN
	Resource  string `json:"resource"` // The target (e.g., "logs", "dashboard:123")
	Details   string `json:"details,omitempty"`
	Status    string `json:"status"`  // SUCCESS, FAILURE
	IPAddress string `json:"ip_address"`
}

// Log records an audit event securely
// In production, this should write to a separate, immutable audit log (e.g., S3 worm-locked bucket)
func Log(actor, role, action, resource, details, status, ip string) {
	event := AuditEvent{
		Timestamp: time.Now().Format(time.RFC3339),
		Actor:     actor,
		Role:      role,
		Action:    action,
		Resource:  resource,
		Details:   details,
		Status:    status,
		IPAddress: ip,
	}

	// 1. Structural Logging (JSON) to stdout (captured by FluentBit/Vector)
	val, _ := json.Marshal(event)
	fmt.Printf("AUDIT_LOG: %s\n", string(val))

	// 2. TODO: Asynchronously push to dedicated Audit Service or Immutable Storage
}
