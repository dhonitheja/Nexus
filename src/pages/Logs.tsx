
import { useState } from 'react';
import { Search, Filter, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import styles from './Logs.module.css';

const Logs = () => {
    const [query, setQuery] = useState('service="auth-service" level=ERROR');

    const mockLogs = [
        { id: 1, time: '2023-10-27 10:23:45', level: 'ERROR', service: 'auth-service', message: 'Failed to authenticate user: Connection timeout' },
        { id: 2, time: '2023-10-27 10:23:44', level: 'WARN', service: 'api-gateway', message: 'High latency detected on /api/v1/login' },
        { id: 3, time: '2023-10-27 10:23:42', level: 'INFO', service: 'payment-processor', message: 'Transaction 5521 processed successfully' },
        { id: 4, time: '2023-10-27 10:23:40', level: 'DEBUG', service: 'web-client', message: 'Rendered component Header in 12ms' },
        { id: 5, time: '2023-10-27 10:23:38', level: 'INFO', service: 'db-primary', message: 'Query executed: SELECT * FROM users WHERE id=?' },
        { id: 6, time: '2023-10-27 10:23:35', level: 'ERROR', service: 'auth-service', message: 'Invalid token signature' },
    ];

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertCircle size={16} color="#ef4444" />;
            case 'WARN': return <AlertTriangle size={16} color="#f59e0b" />;
            case 'INFO': return <Info size={16} color="#3b82f6" />;
            case 'DEBUG': return <CheckCircle size={16} color="#6b7280" />;
            default: return null;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.searchInput}
                        placeholder="Search logs..."
                    />
                    <button className={styles.searchButton}>Search</button>
                </div>
                <div className={styles.filters}>
                    <button className={styles.filterBtn}><Filter size={16} /> Filters</button>
                    <select className={styles.timeSelect}>
                        <option>Last 15 minutes</option>
                        <option>Last 1 hour</option>
                        <option>Last 24 hours</option>
                    </select>
                </div>
            </header>

            <div className={styles.logList}>
                <div className={styles.logHeader}>
                    <div style={{ width: '180px' }}>Timestamp</div>
                    <div style={{ width: '80px' }}>Level</div>
                    <div style={{ width: '150px' }}>Service</div>
                    <div style={{ flex: 1 }}>Message</div>
                </div>
                {mockLogs.map(log => (
                    <div key={log.id} className={styles.logRow}>
                        <div className={styles.timestamp}>{log.time}</div>
                        <div className={`${styles.level} ${styles[log.level.toLowerCase()]}`}>
                            {getIcon(log.level)}
                            <span>{log.level}</span>
                        </div>
                        <div className={styles.service}>{log.service}</div>
                        <div className={styles.message}>{log.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Logs;
