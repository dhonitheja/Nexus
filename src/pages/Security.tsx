
import { Shield, AlertOctagon } from 'lucide-react';
import styles from './Overview.module.css';

const Security = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Security & Compliance</h1>
                <div className={styles.controls}>
                    <button className={styles.button}>Run Scan</button>
                    <span className={styles.badge}>Live Monitoring</span>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Threat Level</h3>
                    <div style={{ fontSize: '2rem', color: '#10b981' }}>Low</div>
                    <div className={styles.cardChange}>No active threats</div>
                </div>
                <div className={styles.card}>
                    <h3>Active Firewalls</h3>
                    <div style={{ fontSize: '2rem', color: '#3b82f6' }}>12/12</div>
                    <div className={styles.cardChange}>All systems go</div>
                </div>
                <div className={styles.card}>
                    <h3>Failed Logins</h3>
                    <div style={{ fontSize: '2rem', color: '#f59e0b' }}>34</div>
                    <div className={styles.cardChange}>Last 24 hours</div>
                </div>
            </div>

            <div className={styles.chartsSection}>
                <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
                    <h3>Recent Security Events</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { id: 1, type: 'SSH Login Attempt', source: '192.168.1.5', status: 'Blocked', severity: 'high' },
                            { id: 2, type: 'Port Scan Detected', source: '10.0.0.4', status: 'Blocked', severity: 'medium' },
                            { id: 3, type: 'Admin Login', source: 'internal', status: 'Success', severity: 'low' },
                        ].map(event => (
                            <div key={event.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${event.severity === 'high' ? '#ef4444' : event.severity === 'medium' ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {event.severity === 'high' ? <AlertOctagon color="#ef4444" /> : <Shield color="#10b981" />}
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{event.type}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Source: {event.source}</div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    background: event.status === 'Blocked' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: event.status === 'Blocked' ? '#ef4444' : '#10b981',
                                    fontSize: '0.8rem',
                                    height: 'fit-content'
                                }}>
                                    {event.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
