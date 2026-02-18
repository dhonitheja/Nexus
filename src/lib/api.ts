
export interface LogEntry {
    timestamp: string;
    service: string;
    level: string;
    message: string;
    trace_id?: string;
    org_id?: string;
    [key: string]: any;
}

export interface QueryResult {
    data: LogEntry[];
    meta: {
        rows: number;
        rows_before_limit_at_least?: number;
        statistics?: {
            elapsed: number;
            rows_read: number;
            bytes_read: number;
        };
    };
}

export class NexusAPI {
    private static baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    private static wsURL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/https?/, 'ws');

    private static getToken() {
        // In a real app, integrate with OIDC (Auth0/Keycloak) locally or via cookies
        return localStorage.getItem('nexus_token') || 'sk_live_12345';
    }

    // --- Production Methods ---

    /**
     * Execute an SPL query against the backend.
     * Supports cancellation via AbortSignal.
     */
    static async querySPL(query: string, signal?: AbortSignal, _page = 1, _limit = 100): Promise<QueryResult> {
        const token = this.getToken();

        try {
            const response = await fetch(`${this.baseURL}/query/spl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Sending pagination params (though backend SQL generator needs to support OFFSET)
                // For now, simple query shipping
                body: JSON.stringify({ query }),
                signal
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("Unauthorized: Please log in.");
                if (response.status === 403) throw new Error("Forbidden: Insufficient permissions.");

                let errMsg = 'Query failed';
                try {
                    const err = await response.json();
                    errMsg = err.message || errMsg;
                } catch { }
                throw new Error(errMsg);
            }

            const rawData = await response.json();
            // Handle array response (ClickHouse standard JSON or custom API format)
            // Assuming API returns array or { data: [], meta: {} }
            if (Array.isArray(rawData)) {
                return { data: rawData, meta: { rows: rawData.length } };
            }
            return rawData as QueryResult;
        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            console.error("API Error:", error);

            // Fallback to Mock in Dev ONLY if API fails (for seamless dev experience)
            if (import.meta.env.MODE === 'development') {
                console.warn("Using Mock Data Fallback");
                const { generateLogs } = await import('./mockData');
                const { processSPL } = await import('./splEngine');
                const data = processSPL(generateLogs(100) as Record<string, any>[], query) as LogEntry[];
                return { data, meta: { rows: data.length } };
            }
            throw error;
        }
    }

    /**
     * Open a WebSocket connection for live log streaming.
     */
    static subscribeLiveLogs(
        filters: string,
        onData: (log: LogEntry) => void,
        onError: (err: any) => void
    ): () => void {
        const token = this.getToken();
        // Assuming backend exposes /ws/live?query=...
        const ws = new WebSocket(`${this.wsURL}/ws/live?query=${encodeURIComponent(filters)}&token=${token}`);

        ws.onopen = () => console.log("Live stream connected");

        ws.onmessage = (event) => {
            try {
                const log = JSON.parse(event.data);
                onData(log);
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onerror = (e) => {
            console.error("WS Error", e);
            onError(e);
        };

        ws.onclose = () => console.log("Live stream closed");

        // Return cleanup function
        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }

    static async ingestLogs(logs: LogEntry[]) {
        const token = this.getToken();
        return fetch(`${this.baseURL}/ingest/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(logs)
        });
    }

    // --- Metrics ---
    static async getMetrics(_metricName: string) {
        if (import.meta.env.MODE === 'development') {
            const { generateMetrics } = await import('./mockData');
            return generateMetrics(60, 100, 5);
        }
        // Real implementation would hit /query/metrics...
        return [];
    }
}
