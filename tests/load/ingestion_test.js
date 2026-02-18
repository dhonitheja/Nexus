
import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users (ingesters)
        { duration: '1m', target: 100 }, // Stay at 100 users - simulate high load
        { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';
const TOKEN = 'sk_live_12345'; // Use a valid mock token

export default function () {
    const payload = JSON.stringify([
        {
            timestamp: new Date().toISOString(),
            service: 'payment-processor',
            level: 'INFO',
            message: `Transaction processed successfully: ${randomString(8)}`,
            trace_id: randomString(16),
        },
        {
            timestamp: new Date().toISOString(),
            service: 'auth-service',
            level: 'DEBUG',
            message: `User login attempt: ${randomString(6)}`,
        }
    ]);

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
    };

    const res = http.post(`${BASE_URL}/ingest/logs`, payload, params);

    check(res, {
        'is status 202': (r) => r.status === 202,
    });

    sleep(1);
}
