
package spl

import (
	"errors"
	"fmt"
	"hash/fnv"
	"strings"
	"time"
)

// AST Definitions
type Query struct {
	Filters      []Filter
	Aggregation  *Aggregation
	TimeRange    TimeRange
	Limit        int
	Sort         Order
}

type Filter struct {
	Field    string
	Operator string
	Value    string
}

type Aggregation struct {
	Function string // e.g., count, avg
	Field    string
	GroupBy  string
}

type TimeRange struct {
	Start time.Time // Default: -1h
	End   time.Time // Default: Now
}

type Order struct {
	Field      string
	Descending bool
}

// Guardrails
const (
	MaxLimit       = 10000
	MaxHoursRange  = 720 // 30 days
	DefaultTimeout = 30 * time.Second
)

// Parse converts raw SPL string into a structured Query AST
// Example: "search level=ERROR service=auth | stats count by user | sort -count | head 50"
func Parse(spl string) (*Query, error) {
	q := &Query{
		Limit: 100, // Default limit
		TimeRange: TimeRange{
			Start: time.Now().Add(-1 * time.Hour),
			End:   time.Now(),
		},
	}

	parts := strings.Split(spl, "|")
	for i, part := range parts {
		part = strings.TrimSpace(part)
		if i == 0 {
			// Phase 1: Search / Filter
			if err := parseSearch(part, q); err != nil {
				return nil, err
			}
		} else {
			// Phase 2: Pipe Commands
			cmd := strings.Fields(part)[0]
			switch cmd {
			case "stats":
				if err := parseStats(part, q); err != nil {
					return nil, err
				}
			case "sort":
				if err := parseSort(part, q); err != nil {
					return nil, err
				}
			case "head":
				if err := parseHead(part, q); err != nil {
					return nil, err
				}
			default:
				return nil, fmt.Errorf("unknown command: %s", cmd)
			}
		}
	}

	// 2. Apply Guardrails
	if q.Limit > MaxLimit {
		q.Limit = MaxLimit
	}
	duration := q.TimeRange.End.Sub(q.TimeRange.Start)
	if duration.Hours() > MaxHoursRange {
		return nil, fmt.Errorf("time range exceeds maximum allowed (%d hours)", MaxHoursRange)
	}

	return q, nil
}

func parseSearch(raw string, q *Query) error {
	raw = strings.TrimPrefix(raw, "search ")
	tokens := strings.Fields(raw) // Simple tokenizer
	for _, token := range tokens {
		if strings.Contains(token, "=") {
			kv := strings.SplitN(token, "=", 2)
			q.Filters = append(q.Filters, Filter{
				Field:    kv[0],
				Operator: "=",
				Value:    kv[1],
			})
		} else {
			// Free text search (handled as broad match)
			q.Filters = append(q.Filters, Filter{
				Field:    "_raw",
				Operator: "LIKE",
				Value:    token,
			})
		}
	}
	return nil
}

func parseStats(raw string, q *Query) error {
	// Format: stats count by user
	// Format: stats avg(latency) by service
	parts := strings.Fields(raw)
	if len(parts) < 2 {
		return errors.New("invalid stats syntax")
	}

	agg := &Aggregation{}
	
	// Check for 'by' clause
	byIndex := -1
	for i, p := range parts {
		if p == "by" {
			byIndex = i
			break
		}
	}

	funcPart := parts[1] // count or avg(latency)
	if strings.Contains(funcPart, "(") {
		// avg(latency)
		fp := strings.TrimSuffix(funcPart, ")")
		split := strings.Split(fp, "(")
		agg.Function = split[0]
		agg.Field = split[1]
	} else {
		// count
		agg.Function = funcPart
		agg.Field = "*"
	}

	if byIndex != -1 && byIndex+1 < len(parts) {
		agg.GroupBy = parts[byIndex+1]
	}

	q.Aggregation = agg
	return nil
}

func parseSort(raw string, q *Query) error {
	// Format: sort -count
	parts := strings.Fields(raw)
	if len(parts) < 2 {
		return errors.New("invalid sort syntax")
	}
	field := parts[1]
	desc := false
	if strings.HasPrefix(field, "-") {
		desc = true
		field = strings.TrimPrefix(field, "-")
	} else if strings.HasPrefix(field, "+") {
		field = strings.TrimPrefix(field, "+")
	}
	q.Sort = Order{Field: field, Descending: desc}
	return nil
}

func parseHead(raw string, q *Query) error {
	// Format: head 50
	parts := strings.Fields(raw)
	if len(parts) < 2 {
		return errors.New("invalid head syntax")
	}
	var limit int
	fmt.Sscanf(parts[1], "%d", &limit)
	q.Limit = limit
	return nil
}

// GenerateSQL converts the AST to ClickHouse SQL
func (q *Query) ToSQL(table string, tenantID string) (string, []interface{}) {
	var whereClauses []string
	var args []interface{}

	// Enforce Tenant Isolation
	whereClauses = append(whereClauses, "org_id = ?")
	args = append(args, tenantID)

	// Time Range
	whereClauses = append(whereClauses, "timestamp >= ? AND timestamp <= ?")
	args = append(args, q.TimeRange.Start, q.TimeRange.End)

	// Filters
	for _, f := range q.Filters {
		if f.Operator == "=" {
			whereClauses = append(whereClauses, fmt.Sprintf("%s = ?", f.Field))
			args = append(args, f.Value)
		} else if f.Operator == "LIKE" {
			whereClauses = append(whereClauses, "message LIKE ?")
			args = append(args, "%"+f.Value+"%")
		}
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Build Query
	query := ""
	if q.Aggregation != nil {
		// Aggregation Query
		groupBy := ""
		if q.Aggregation.GroupBy != "" {
			groupBy = fmt.Sprintf("GROUP BY %s", q.Aggregation.GroupBy)
		}
		
		funcSQL := ""
		if q.Aggregation.Function == "count" {
			funcSQL = "count(*)"
		} else {
			funcSQL = fmt.Sprintf("%s(%s)", q.Aggregation.Function, q.Aggregation.Field)
		}

		query = fmt.Sprintf("SELECT %s, %s FROM %s WHERE %s %s LIMIT %d", 
			q.Aggregation.GroupBy, funcSQL, table, whereSQL, groupBy, q.Limit)
	} else {
		// Raw Log Search
		query = fmt.Sprintf("SELECT timestamp, level, service, message FROM %s WHERE %s ORDER BY timestamp DESC LIMIT %d", 
			table, whereSQL, q.Limit)
	}

	return query, args
}

// ComputeHash generates a cache key
func (q *Query) ComputeHash(tenantID string) string {
	h := fnv.New64a()
	h.Write([]byte(tenantID))
	h.Write([]byte(fmt.Sprintf("%v", q)))
	return fmt.Sprintf("%x", h.Sum64())
}
