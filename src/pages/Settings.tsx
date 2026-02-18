import styles from './Overview.module.css';

const Settings = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Enterprise Settings</h1>
            </header>
            <div className={styles.card}>
                <h3>Configuration</h3>
                <p style={{ marginTop: '1rem', color: '#ccc' }}>
                    Enterprise settings panel is currently being updated.
                    Please use the configuration files or contact support for manual changes.
                </p>
                <div style={{ marginTop: '2rem' }}>
                    <h4>Current Status</h4>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>✅ Alerting: Active (Prometheus + Alertmanager)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✅ Security: Enforced (HSTS, CSP)</li>
                        <li style={{ marginBottom: '0.5rem' }}>✅ Integrations: 2 Connected</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Settings;
