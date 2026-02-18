
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Overview.module.css';
import { generateServiceMap } from '../lib/mockData';
import type { ServiceNode, ServiceLink } from '../lib/mockData';

const ServiceMap = () => {
    const [data, setData] = useState<{ nodes: ServiceNode[], links: ServiceLink[] }>({ nodes: [], links: [] });

    useEffect(() => {
        setData(generateServiceMap());
    }, []);

    // Simple layout for the mock data
    const positions: Record<string, { x: number, y: number }> = {
        'web-client': { x: 100, y: 300 },
        'api-gateway': { x: 400, y: 300 },
        'auth-service': { x: 700, y: 150 },
        'payment-processor': { x: 700, y: 450 },
        'db-primary': { x: 1000, y: 300 },
        'cache-layer': { x: 1000, y: 100 },
        'email-service': { x: 1000, y: 500 },
    };

    const getColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#3fb950';
            case 'warning': return '#d29922';
            case 'critical': return '#f85149';
            default: return '#58a6ff';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Service Map</h1>
                <div className={styles.controls}>
                    <span className={styles.badge}>Live Topology</span>
                </div>
            </header>

            <div className={styles.card} style={{ height: '600px', position: 'relative', overflow: 'hidden' }}>
                <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    </defs>
                    {data.links.map((link, i) => {
                        const start = positions[link.source];
                        const end = positions[link.target];
                        if (!start || !end) return null;

                        // Calculate midpoint for label
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;

                        return (
                            <g key={i}>
                                <motion.line
                                    x1={start.x} y1={start.y}
                                    x2={end.x} y2={end.y}
                                    stroke="#30363d"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                                <text x={midX} y={midY - 10} fill="#8b949e" fontSize="10" textAnchor="middle">{link.value} req/s</text>
                                <circle cx={midX} cy={midY} r={3} fill="#58a6ff" className="animate-pulse" />
                            </g>
                        );
                    })}
                </svg>

                {data.nodes.map((node) => {
                    const pos = positions[node.id];
                    if (!pos) return null;

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                position: 'absolute',
                                left: pos.x - 60,
                                top: pos.y - 40,
                                width: '120px',
                                padding: '10px',
                                borderRadius: '8px',
                                background: '#161b22',
                                border: `2px solid ${getColor(node.status)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                zIndex: 10
                            }}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{node.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>{node.latency}ms | {node.errorRate}% err</div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ServiceMap;
