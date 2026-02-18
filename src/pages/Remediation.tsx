import { useState } from 'react';
import { Play, RefreshCcw, Terminal } from 'lucide-react';
import styles from './Overview.module.css';

const Remediation = () => {
    const [running, setRunning] = useState<number | null>(null);

    const workflows = [
        { id: 1, name: 'Restart Pods (Rolling)', target: 'payment-processor', risk: 'low', lastRun: '2 days ago' },
        { id: 2, name: 'Flush Redis Cache', target: 'cache-layer', risk: 'medium', lastRun: '5 hours ago' },
        { id: 3, name: 'Scale Up DB Replicas', target: 'db-primary', risk: 'high', lastRun: 'Never' },
        { id: 4, name: 'Block IP Range', target: 'Global Firewall', risk: 'medium', lastRun: '1 hour ago' },
    ];

    const handleRun = (id: number) => {
        setRunning(id);
        setTimeout(() => setRunning(null), 3000);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Active Defense</h1>
                <div className={styles.controls}>
                    <button className={styles.button} style={{ background: '#f85149' }}>Emergency Stop</button>
                    <span className={styles.badge}>Live Mode</span>
                </div>
            </header>

            <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
                <div className={styles.card}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={20} /> remediation_workflows.yaml
                    </h3>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #30363d', color: '#8b949e', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Workflow Name</th>
                                <th style={{ padding: '1rem' }}>Target System</th>
                                <th style={{ padding: '1rem' }}>Risk Level</th>
                                <th style={{ padding: '1rem' }}>Last Execution</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workflows.map(w => (
                                <tr key={w.id} style={{ borderBottom: '1px solid #21262d' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{w.name}</td>
                                    <td style={{ padding: '1rem', color: '#8b949e' }}>{w.target}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            background: w.risk === 'high' ? 'rgba(248, 81, 73, 0.15)' : w.risk === 'medium' ? 'rgba(210, 153, 34, 0.15)' : 'rgba(63, 185, 80, 0.15)',
                                            color: w.risk === 'high' ? '#f85149' : w.risk === 'medium' ? '#d29922' : '#3fb950'
                                        }}>
                                            {w.risk.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#8b949e' }}>{w.lastRun}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleRun(w.id)}
                                            disabled={running === w.id}
                                            className={styles.button}
                                            style={{
                                                background: running === w.id ? '#21262d' : '#1f6feb',
                                                width: '100px',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {running === w.id ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}
                                            <span style={{ marginLeft: '0.5rem' }}>{running === w.id ? 'Running' : 'Execute'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.grid} style={{ marginTop: '2rem' }}>
                <div className={styles.card}>
                    <h3>Audit Log</h3>
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#8b949e', fontFamily: 'monospace' }}>
                        <div style={{ marginBottom: '0.5rem' }}>[10:42:15] User "admin" executed "Block IP Range" (Success)</div>
                        <div style={{ marginBottom: '0.5rem' }}>[09:15:22] System auto-scaled "payment-processor" to 5 replicas</div>
                        <div style={{ marginBottom: '0.5rem' }}>[08:30:00] Daily backup completed</div>
                    </div>
                </div>
                <div className={styles.card}>
                    <h3>Approval Requests</h3>
                    <div style={{ marginTop: '1rem', textAlign: 'center', color: '#8b949e', fontStyle: 'italic' }}>
                        No pending approvals
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Remediation;
