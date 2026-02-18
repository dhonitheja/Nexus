
import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';
import styles from './Overview.module.css';

const Insights = () => {
    const [insights] = useState([
        { id: 1, type: 'anomaly', severity: 'medium', title: 'Unusual Latency Spike', desc: 'API Gateway latency increased by 300% (p99) compared to last week.', time: '10 mins ago' },
        { id: 2, type: 'optimization', severity: 'low', title: 'Inefficient Database Query', desc: 'Query on users table performs full table scan. Suggested index: (email, status).', time: '1 hour ago' },
        { id: 3, type: 'security', severity: 'high', title: 'Suspicious Login Pattern', desc: 'Multiple failed login attempts from diverse IPs targeting admin account.', time: '2 hours ago' },
        { id: 4, type: 'prediction', severity: 'info', title: 'Capacity Forecast', desc: 'Based on current growth, database storage will reach 85% capacity in 3 days.', time: '4 hours ago' },
    ]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'anomaly': return <AlertCircle size={24} color="#f59e0b" />;
            case 'optimization': return <Sparkles size={24} color="#58a6ff" />;
            case 'security': return <CheckCircle size={24} color="#f85149" />;
            case 'prediction': return <BrainCircuit size={24} color="#8b949e" />;
            default: return <Sparkles />;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>AI Insights (Watchdog)</h1>
                <div className={styles.controls}>
                    <button className={styles.button}>Train Model</button>
                    <span className={styles.badge}>Auto-Analysis Active</span>
                </div>
            </header>

            <div className={styles.grid}>
                {insights.map(insight => (
                    <div key={insight.id} className={styles.card} style={{ borderLeft: `4px solid ${insight.severity === 'high' ? '#f85149' : insight.severity === 'medium' ? '#f59e0b' : '#3fb950'}` }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            {getIcon(insight.type)}
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{insight.title}</h3>
                        </div>
                        <p style={{ color: '#8b949e', marginBottom: '1rem', lineHeight: '1.5' }}>{insight.desc}</p>
                        <div style={{ fontSize: '0.75rem', color: '#6e7681', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{insight.type.toUpperCase()}</span>
                            <span>{insight.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Insights;
