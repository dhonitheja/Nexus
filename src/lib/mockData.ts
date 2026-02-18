
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export interface MetricPoint {
  time: string;
  value: number;
}

const services = ['web-client', 'api-gateway', 'auth-service', 'payment-processor', 'db-primary', 'cache-layer'];
const messages = {
  INFO: ['Request processed successfully', 'Health check passed', 'Cache warm-up complete', 'User logged in'],
  WARN: ['High latency detected', 'Memory usage > 80%', 'Rate limit approaching', 'Deprecation warning'],
  ERROR: ['Connection refused', 'Timeout awaiting response', 'Transaction failed', 'Null pointer exception'],
  DEBUG: ['Payload: { user_id: 123 }', 'Query execution time: 12ms', 'Parsing config file', 'Step 4 complete']
};

export const generateLogs = (count: number): LogEntry[] => {
  return Array.from({ length: count }).map(() => {
    const level = Math.random() > 0.9 ? 'ERROR' : Math.random() > 0.7 ? 'WARN' : 'INFO';
    const service = services[Math.floor(Math.random() * services.length)];
    const messageList = messages[level as keyof typeof messages];
    const message = messageList[Math.floor(Math.random() * messageList.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString(),
      level: level as LogEntry['level'],
      service,
      message: `${service}: ${message}`
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const generateMetrics = (points: number, baseValue: number, volatility: number): MetricPoint[] => {
  const data: MetricPoint[] = [];
  let currentValue = baseValue;
  const now = Date.now();

  for (let i = points; i >= 0; i--) {
    const time = new Date(now - i * 60000).toLocaleTimeString(); // every minute
    const change = (Math.random() - 0.5) * volatility;
    currentValue = Math.max(0, currentValue + change);
    data.push({ time, value: Math.round(currentValue) });
  }
  return data;
};

export interface ServiceNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'broler';
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  throughput: number;
  errorRate: number;
}

export interface ServiceLink {
  source: string;
  target: string;
  value: number; // traffic volume
}

export interface TraceSpan {
  id: string;
  traceId: string;
  service: string;
  operation: string;
  startTime: number;
  duration: number;
  status: 'ok' | 'error';
  parentId?: string;
}

export const generateServiceMap = () => {
  const nodes: ServiceNode[] = [
    { id: 'web-client', name: 'Web Client', type: 'service', status: 'healthy', latency: 45, throughput: 1200, errorRate: 0.01 },
    { id: 'api-gateway', name: 'API Gateway', type: 'service', status: 'healthy', latency: 25, throughput: 1150, errorRate: 0.02 },
    { id: 'auth-service', name: 'Auth Service', type: 'service', status: 'warning', latency: 120, throughput: 400, errorRate: 2.5 },
    { id: 'payment-processor', name: 'Payment Processor', type: 'service', status: 'healthy', latency: 85, throughput: 150, errorRate: 0.1 },
    { id: 'db-primary', name: 'Primary DB', type: 'database', status: 'healthy', latency: 5, throughput: 800, errorRate: 0.0 },
    { id: 'cache-layer', name: 'Redis Cache', type: 'cache', status: 'healthy', latency: 1, throughput: 2000, errorRate: 0.0 },
    { id: 'email-service', name: 'Email Service', type: 'service', status: 'healthy', latency: 200, throughput: 50, errorRate: 0.5 },
  ];

  const links: ServiceLink[] = [
    { source: 'web-client', target: 'api-gateway', value: 100 },
    { source: 'api-gateway', target: 'auth-service', value: 80 },
    { source: 'api-gateway', target: 'payment-processor', value: 40 },
    { source: 'auth-service', target: 'db-primary', value: 70 },
    { source: 'auth-service', target: 'cache-layer', value: 90 },
    { source: 'payment-processor', target: 'db-primary', value: 40 },
    { source: 'payment-processor', target: 'email-service', value: 20 },
  ];

  return { nodes, links };
};

export const generateTrace = (traceId: string): TraceSpan[] => {
  const startTime = Date.now();
  return [
    { id: '1', traceId, service: 'web-client', operation: 'checkout', startTime, duration: 450, status: 'ok' },
    { id: '2', traceId, service: 'api-gateway', operation: 'POST /checkout', startTime: startTime + 50, duration: 380, status: 'ok', parentId: '1' },
    { id: '3', traceId, service: 'auth-service', operation: 'validate_token', startTime: startTime + 80, duration: 120, status: 'ok', parentId: '2' },
    { id: '4', traceId, service: 'cache-layer', operation: 'get_session', startTime: startTime + 90, duration: 5, status: 'ok', parentId: '3' },
    { id: '5', traceId, service: 'db-primary', operation: 'get_user', startTime: startTime + 110, duration: 15, status: 'ok', parentId: '3' },
    { id: '6', traceId, service: 'payment-processor', operation: 'charge_card', startTime: startTime + 220, duration: 180, status: 'ok', parentId: '2' },
    { id: '7', traceId, service: 'db-primary', operation: 'save_transaction', startTime: startTime + 350, duration: 20, status: 'ok', parentId: '6' },
  ];
};

