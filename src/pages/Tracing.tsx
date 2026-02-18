
import { useState, useEffect } from 'react';
import { generateTrace } from '../lib/mockData';
import type { TraceSpan } from '../lib/mockData';
import styles from './Overview.module.css';

const Tracing = () => {
    const [traceId] = useState('0x12345abcdef');
    const [spans, setSpans] = useState<TraceSpan[]>([]);

    useEffect(() => {
        setSpans(generateTrace(traceId));
    }, [traceId]);

    const maxDuration = Math.max(...spans.map(s => (s.startTime - spans[0]?.startTime) + s.duration));
    const startOffset = spans[0]?.startTime || 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Tracing - {traceId}</h1>
            </header>

            <div className={styles.card}>
                <div style={{ display: "flex", borderBottom: "1px solid #30363d", padding: "10px", fontWeight: "bold" }}>
                    <div style={{ width: "200px" }}>Service</div>
                    <div style={{ flex: 1 }}>Timeline</div>
                    <div style={{ width: "80px" }}>Duration</div>
                </div>
                {spans.map((span) => {
                    const relativeStart = span.startTime - startOffset;
                    const leftPercent = (relativeStart / maxDuration) * 100;
                    const widthPercent = (span.duration / maxDuration) * 100;

                    return (
                        <div key={span.id} style={{ display: "flex", borderBottom: "1px solid #30363d", padding: "10px", alignItems: "center" }}>
                            <div style={{ width: "200px", color: "#58a6ff" }}>
                                <div style={{ fontSize: "0.9rem" }}>{span.service}</div>
                                <div style={{ fontSize: "0.75rem", color: "#8b949e" }}>{span.operation}</div>
                            </div>
                            <div style={{ flex: 1, position: "relative", height: "24px" }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: `${leftPercent}%`,
                                        width: `${Math.max(widthPercent, 0.5)}%`,
                                        backgroundColor: span.status === 'error' ? '#f85149' : '#3fb950',
                                        height: "100%",
                                        borderRadius: "4px",
                                        opacity: 0.8
                                    }}
                                />
                            </div>
                            <div style={{ width: "80px", textAlign: "right", fontSize: "0.85rem" }}>{span.duration}ms</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Tracing;
