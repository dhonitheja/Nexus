
import { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Database, Terminal, BarChart2, Table as TableIcon, Play, Pause, Loader, AlertTriangle, XCircle } from 'lucide-react';
import styles from './Overview.module.css';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NexusAPI } from '../lib/api';

const Search = () => {
    const [query, setQuery] = useState('search level=ERROR | stats count by service');
    const [results, setResults] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'events' | 'visualization'>('events');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [stats, setStats] = useState({ rows: 0, elapsed: 0 });

    const abortControllerRef = useRef<AbortController | null>(null);
    const liveStreamCleanupRef = useRef<(() => void) | null>(null);

    // Initial load
    useEffect(() => {
        handleSearch();
        return () => {
            // Cleanup on unmount
            if (abortControllerRef.current) abortControllerRef.current.abort();
            if (liveStreamCleanupRef.current) liveStreamCleanupRef.current();
        };
    }, []);

    // Toggle Live Mode
    useEffect(() => {
        if (isLive) {
            // Start Stream
            setLoading(true); // Initial connecting state
            try {
                const cleanup = NexusAPI.subscribeLiveLogs(
                    query,
                    (log) => {
                        setLoading(false);
                        setResults(prev => [log, ...prev].slice(0, 1000)); // Keep last 1000
                        setStats(prev => ({ ...prev, rows: prev.rows + 1 }));
                    },
                    (err) => {
                        console.error("Stream Error", err);
                        setIsLive(false); // Auto-stop on error
                        setError("Live stream disconnected");
                    }
                );
                liveStreamCleanupRef.current = cleanup;
            } catch (e) {
                setError("Failed to start live stream");
                setIsLive(false);
            }
        } else {
            // Stop Stream
            if (liveStreamCleanupRef.current) {
                liveStreamCleanupRef.current();
                liveStreamCleanupRef.current = null;
            }
        }
    }, [isLive, query]);

    const handleSearch = async () => {
        if (isLive) return; // Don't run static search in live mode

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);
        const startTime = performance.now();

        try {
            const res = await NexusAPI.querySPL(query, controller.signal);
            setResults(res.data);
            setStats({
                rows: res.meta.rows,
                elapsed: performance.now() - startTime
            });

            // Auto-switch tab based on query type
            if (query.includes('stats') && activeTab !== 'visualization') {
                setActiveTab('visualization');
            } else if (!query.includes('stats') && activeTab !== 'events') {
                setActiveTab('events');
            }

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoading(false);
        }
    };

    const isAggregated = query.includes('stats');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Visual Analytics</h1>
                <div className={styles.controls}>
                    {/* Live Mode Toggle */}
                    <button
                        className={styles.button}
                        onClick={() => setIsLive(!isLive)}
                        style={{
                            background: isLive ? 'rgba(248, 81, 73, 0.1)' : 'transparent',
                            color: isLive ? '#f85149' : '#c9d1d9',
                            border: isLive ? '1px solid #f85149' : '1px solid #30363d'
                        }}
                    >
                        {isLive ? <Pause size={16} style={{ marginRight: 8 }} /> : <Play size={16} style={{ marginRight: 8 }} />}
                        {isLive ? 'Stop Live' : 'Go Live'}
                    </button>
                    <button className={styles.button} style={{ background: '#238636' }}>Save Report</button>
                </div>
            </header>

            {/* Search Bar */}
            <div className={styles.card} style={{ marginBottom: '1.5rem', border: isLive ? '1px solid #f85149' : '1px solid #30363d' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <SearchIcon size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLive && handleSearch()}
                            className={styles.input}
                            style={{ width: '100%', paddingLeft: '3rem', fontFamily: 'monospace' }}
                            placeholder='Query: service=payment-processor | stats count by level'
                            disabled={isLive}
                        />
                    </div>
                    {loading && !isLive ? (
                        <button className={styles.button} style={{ background: '#d29922' }} onClick={handleCancel}>
                            <XCircle size={16} /> Cancel
                        </button>
                    ) : (
                        <button
                            className={styles.button}
                            style={{ background: isLive ? '#21262d' : '#1f6feb', opacity: isLive ? 0.5 : 1 }}
                            onClick={handleSearch}
                            disabled={isLive}
                        >
                            <SearchIcon size={16} />
                        </button>
                    )}
                </div>

                {/* Stats & Metadata */}
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span><Database size={12} style={{ marginRight: '4px' }} /> Source: Cluster-1</span>
                        <span><Terminal size={12} style={{ marginRight: '4px' }} /> {isLive ? 'Stream Active' : `${stats.rows} rows (${stats.elapsed.toFixed(0)}ms)`}</span>
                    </div>
                    {isLive && (
                        <span style={{ color: '#f85149', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            <span className="animate-pulse">●</span> LIVE
                        </span>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: 'rgba(248, 81, 73, 0.1)',
                    border: '1px solid #f85149',
                    borderRadius: '6px',
                    color: '#f85149',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            {/* Results Controls */}
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #30363d', display: 'flex', gap: '1rem' }}>
                <button
                    className={styles.button}
                    style={{
                        background: activeTab === 'visualization' ? '#1f6feb' : 'transparent',
                        border: 'none',
                        borderRadius: '0',
                        borderBottom: activeTab === 'visualization' ? '2px solid white' : 'none'
                    }}
                    onClick={() => setActiveTab('visualization')}
                >
                    <BarChart2 size={16} style={{ marginRight: '0.5rem' }} /> Visualization
                </button>
                <button
                    className={styles.button}
                    style={{
                        background: activeTab === 'events' ? '#1f6feb' : 'transparent',
                        border: 'none',
                        borderRadius: '0',
                        borderBottom: activeTab === 'events' ? '2px solid white' : 'none'
                    }}
                    onClick={() => setActiveTab('events')}
                >
                    <TableIcon size={16} style={{ marginRight: '0.5rem' }} /> Events
                </button>
            </div>

            {/* Content Area */}
            <div className={styles.card} style={{ minHeight: '400px', position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(13, 17, 23, 0.8)', zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                    }}>
                        <Loader className="animate-spin" size={32} color="#58a6ff" />
                        <span style={{ marginTop: '1rem', color: '#8b949e' }}>Processing Query...</span>
                    </div>
                )}

                {/* VISUALIZATION TAB */}
                {activeTab === 'visualization' && (
                    <div style={{ width: '100%', height: 400 }}>
                        {isAggregated ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={results}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                                    <XAxis dataKey="name" stroke="#8b949e" />
                                    <YAxis stroke="#8b949e" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
                                        itemStyle={{ color: '#c9d1d9' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="count" fill="#3fb950" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <BarChart2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>No aggregation in query. Try adding "| stats count by service"</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* EVENTS TAB */}
                {activeTab === 'events' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #30363d', textAlign: 'left' }}>
                                    {results.length > 0 ? (
                                        Object.keys(results[0]).map(k => (
                                            <th key={k} style={{ padding: '0.75rem', color: '#8b949e', whiteSpace: 'nowrap' }}>{k}</th>
                                        ))
                                    ) : (
                                        <th style={{ padding: '0.75rem', color: '#8b949e' }}>No Data</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #21262d', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                        {Object.values(r).map((v: any, j) => (
                                            <td key={j} style={{ padding: '0.75rem', color: '#c9d1d9', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {results.length === 0 && !loading && !error && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#8b949e' }}>
                                No results found for this query.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
