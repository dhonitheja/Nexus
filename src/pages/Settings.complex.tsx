
import { useState } from 'react';
import { Bell, Plug, Key, Shield, Server, CheckCircle, AlertTriangle, ChevronRight, Save, Activity } from 'lucide-react';
import styles from './Settings.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Integration {
    id: string;
    name: string;
    logo: string;
    description: string;
    connected: boolean;
    category: 'alerting' | 'logging' | 'apm' | 'deployment';
}

interface AlertChannel {
    id: string;
    type: 'slack' | 'email' | 'pagerduty' | 'webhook';
    name: string;
    config: Record<string, string>;
    enabled: boolean;
    events: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
    { id: 'slack', name: 'Slack', logo: '💬', description: 'Send alerts and log summaries to Slack channels.', connected: false, category: 'alerting' },
    { id: 'pagerduty', name: 'PagerDuty', logo: '📟', description: 'Escalate critical incidents to on-call engineers.', connected: false, category: 'alerting' },
    { id: 'email', name: 'Email / SMTP', logo: '📧', description: 'Send alert digests and reports via email.', connected: true, category: 'alerting' },
    { id: 'webhook', name: 'Webhook', logo: '🔗', description: 'Push events to any HTTP endpoint in real time.', connected: false, category: 'alerting' },
    { id: 'datadog', name: 'Datadog', logo: '🐶', description: 'Forward metrics and traces to Datadog.', connected: false, category: 'apm' },
    { id: 'newrelic', name: 'New Relic', logo: '🔮', description: 'Sync APM data and distributed traces.', connected: false, category: 'apm' },
    { id: 'github', name: 'GitHub Actions', logo: '🐙', description: 'Trigger deployments and link deploys to log spikes.', connected: true, category: 'deployment' },
    { id: 'kubernetes', name: 'Kubernetes', logo: '☸️', description: 'Auto-discover pods and correlate logs with pod events.', connected: true, category: 'logging' },
    { id: 'aws', name: 'AWS CloudWatch', logo: '☁️', description: 'Pull CloudWatch logs and metrics into Nexus.', connected: false, category: 'logging' },
    { id: 'gcp', name: 'GCP Logging', logo: '🌐', description: 'Ingest Google Cloud logs via Pub/Sub.', connected: false, category: 'logging' },
    { id: 'sentry', name: 'Sentry', logo: '🛡️', description: 'Link error events from Sentry to your log traces.', connected: false, category: 'apm' },
    { id: 'jira', name: 'Jira', logo: '📋', description: 'Auto-create Jira tickets from critical alerts.', connected: false, category: 'deployment' },
];

const DEFAULT_CHANNELS: AlertChannel[] = [
    {
        id: '1', type: 'email', name: 'Ops Team Email',
        config: { to: 'ops@company.com', smtp: 'smtp.gmail.com:587' },
        enabled: true,
        events: ['critical', 'downtime'],
    },
];

const EVENT_TYPES = [
    { id: 'critical', label: '🔴 Critical Alerts', desc: 'API down, DB unreachable' },
    { id: 'warning', label: '⚠️ Warning Alerts', desc: 'High latency, error spikes' },
    { id: 'downtime', label: '💀 Downtime Detected', desc: 'Service unavailable >1min' },
    { id: 'recovery', label: '✅ Recovery', desc: 'Service back online' },
    { id: 'deploy', label: '🚀 Deployments', desc: 'New version deployed' },
    { id: 'anomaly', label: '🔍 Anomaly Detected', desc: 'Unusual traffic patterns' },
];

const StatusBadge = ({ connected }: { connected: boolean }) => (
    <span className={connected ? styles.badgeConnected : styles.badgeDisconnected}>
        {connected ? <><CheckCircle size={12} /> Connected</> : <><AlertTriangle size={12} /> Not Connected</>}
    </span>
);

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'integrations' | 'alerts' | 'api' | 'security'>('integrations');
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [channels, setChannels] = useState<AlertChannel[]>(DEFAULT_CHANNELS);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Use lazy initialization for random string to keep function pure
    const [apiKey] = useState(() => 'sk_live_' + Math.random().toString(36).substring(2, 10));

    const [saved, setSaved] = useState(false);

    // New channel form state
    const [newChannel, setNewChannel] = useState({ type: 'slack' as AlertChannel['type'], name: '', webhookUrl: '', email: '', events: [] as string[] });

    const handleConnect = (id: string) => {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddChannel = () => {
        if (!newChannel.name) return;
        const channel: AlertChannel = {
            id: Date.now().toString(),
            type: newChannel.type,
            name: newChannel.name,
            config: newChannel.type === 'slack'
                ? { webhookUrl: newChannel.webhookUrl }
                : { to: newChannel.email },
            enabled: true,
            events: newChannel.events,
        };
        setChannels(prev => [...prev, channel]);
        setNewChannel({ type: 'slack', name: '', webhookUrl: '', email: '', events: [] });
    };

    const toggleEvent = (eventId: string) => {
        setNewChannel(prev => ({
            ...prev,
            events: prev.events.includes(eventId)
                ? prev.events.filter(e => e !== eventId)
                : [...prev.events, eventId],
        }));
    };

    const filteredIntegrations = filterCategory === 'all'
        ? integrations
        : integrations.filter(i => i.category === filterCategory);

    const tabs = [
        { id: 'integrations', label: 'Integrations', icon: <Plug size={16} /> },
        { id: 'alerts', label: 'Alert Channels', icon: <Bell size={16} /> },
        { id: 'api', label: 'API & Keys', icon: <Key size={16} /> },
        { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    ] as const;

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Enterprise Settings</h1>
                    <p className={styles.subtitle}>Configure integrations, alerts, and security for your observability platform.</p>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary} ${saved ? styles.btnSaved : ''}`} onClick={handleSave}>
                    {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
                </button>
            </div>

            {/* Tab Nav */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── INTEGRATIONS TAB ── */}
            {activeTab === 'integrations' && (
                <div className={styles.content}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Connect Your Stack</h2>
                        <div className={styles.categoryFilters}>
                            {['all', 'alerting', 'logging', 'apm', 'deployment'].map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.filterBtn} ${filterCategory === cat ? styles.filterBtnActive : ''}`}
                                    onClick={() => setFilterCategory(cat)}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.integrationsGrid}>
                        {filteredIntegrations.map(integration => (
                            <div
                                key={integration.id}
                                className={`${styles.integrationCard} ${integration.connected ? styles.integrationConnected : ''} ${selectedIntegration?.id === integration.id ? styles.integrationSelected : ''}`}
                                onClick={() => setSelectedIntegration(integration)}
                            >
                                <div className={styles.integrationLogo}>{integration.logo}</div>
                                <div className={styles.integrationInfo}>
                                    <div className={styles.integrationName}>{integration.name}</div>
                                    <div className={styles.integrationDesc}>{integration.description}</div>
                                    <StatusBadge connected={integration.connected} />
                                </div>
                                <button
                                    className={`${styles.btn} ${integration.connected ? styles.btnDanger : styles.btnPrimary}`}
                                    onClick={(e) => { e.stopPropagation(); handleConnect(integration.id); }}
                                >
                                    {integration.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Config Panel */}
                    {selectedIntegration && (
                        <div className={styles.configPanel}>
                            <div className={styles.configHeader}>
                                <span className={styles.integrationLogo}>{selectedIntegration.logo}</span>
                                <div>
                                    <h3 className={styles.configTitle}>{selectedIntegration.name} Configuration</h3>
                                    <StatusBadge connected={selectedIntegration.connected} />
                                </div>
                            </div>

                            <div className={styles.configFields}>
                                <label className={styles.label}>API Key / Webhook URL</label>
                                <input className={styles.input} type="password" placeholder="Enter configuration value..." />
                            </div>

                            <div className={styles.configActions}>
                                <button className={`${styles.btn} ${styles.btnSecondary}`}>
                                    <Activity size={14} /> Test Connection
                                </button>
                                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleConnect(selectedIntegration.id)}>
                                    {selectedIntegration.connected ? 'Update & Reconnect' : 'Connect'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── ALERT CHANNELS TAB ── */}
            {activeTab === 'alerts' && (
                <div className={styles.content}>
                    <h2 className={styles.sectionTitle}>Alert Routing</h2>
                    <p className={styles.sectionDesc}>Define where alerts go based on severity and event type.</p>

                    <div className={styles.channelList}>
                        {channels.map(ch => (
                            <div key={ch.id} className={styles.channelCard}>
                                <div className={styles.channelIcon}>
                                    {ch.type === 'slack' ? '💬' : ch.type === 'email' ? '📧' : ch.type === 'pagerduty' ? '📟' : '🔗'}
                                </div>
                                <div className={styles.channelInfo}>
                                    <div className={styles.channelName}>{ch.name}</div>
                                    <div className={styles.channelMeta}>
                                        {ch.type.toUpperCase()} · {ch.events.join(', ') || 'No events selected'}
                                    </div>
                                </div>
                                <div className={styles.channelActions}>
                                    <label className={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={ch.enabled}
                                            onChange={() => setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, enabled: !c.enabled } : c))}
                                        />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                        onClick={() => setChannels(prev => prev.filter(c => c.id !== ch.id))}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── API TAB ── */}
            {activeTab === 'api' && (
                <div className={styles.content}>
                    <h2 className={styles.sectionTitle}>API Management</h2>
                    <div className={styles.apiCard}>
                        <div className={styles.apiCardHeader}>
                            <Server size={20} />
                            <span>Current Production Key</span>
                        </div>
                        <div className={styles.apiKeyDisplay}>
                            <code className={styles.apiKey}>{apiKey}</code>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
                <div className={styles.content}>
                    <h2 className={styles.sectionTitle}>Security Status</h2>
                    <div className={styles.securityGrid}>
                        {[
                            { label: 'HSTS Enforced', status: true },
                            { label: 'CSP Enabled', status: true },
                            { label: 'TLS Encryption', status: false },
                        ].map(item => (
                            <div key={item.label} className={styles.securityItem}>
                                <div className={item.status ? styles.securityOn : styles.securityOff}>
                                    {item.status ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div className={styles.securityLabel}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
