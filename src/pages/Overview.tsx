
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, Activity, Clock, Database, Server } from 'lucide-react';
import styles from './Overview.module.css';
import { generateMetrics } from '../lib/mockData';

const Overview = () => {
    // Keep internal visualization state for smoothness
    const [data, setData] = useState(generateMetrics(20, 100, 10));

    // Real Stats from API (static for now, replace with API call)
    const stats = {
        totalRequests: "1.2M",
        avgLatency: "45ms",
        errorRate: "0.04%",
        dbLoad: "64%"
    };

    useEffect(() => {
        // Stats Polling
        const fetchStats = async () => {
            try {
                // In production, these would be calls to NexusAPI.getMetrics()
                // const metrics = await NexusAPI.getMetrics('overview');
                // setStats(metrics);
            } catch (e) {
                console.error("Failed to fetch overview metrics", e);
            }
        };

        fetchStats();
        const statInterval = setInterval(fetchStats, 5000);

        // Chart Simulation (for Visual Fluidity until we have real high-freq metrics)
        const chartInterval = setInterval(() => {
            setData(current => {
                const last = current[current.length - 1];
                const nextTime = new Date().toLocaleTimeString();
                const nextValue = Math.max(0, last.value + (Math.random() - 0.5) * 20);
                return [...current.slice(1), { time: nextTime, value: Math.round(nextValue) }];
            });
        }, 2000);

        return () => {
            clearInterval(statInterval);
            clearInterval(chartInterval);
        };
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>System Overview</h1>
                <div className={styles.controls}>
                    <select className={styles.select}>
                        <option>Last 1 Hour</option>
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                    </select>
                    <button className={styles.button}>Export Report</button>
                </div>
            </header>

            <div className={styles.grid}>
                <StatCard
                    title="Total Requests"
                    value={stats.totalRequests}
                    change="+12.5%"
                    trend="up"
                    icon={Activity}
                    color="#3b82f6"
                />
                <StatCard
                    title="Avg Latency"
                    value={stats.avgLatency}
                    change="-2.1%"
                    trend="down"
                    icon={Clock}
                    color="#10b981"
                />
                <StatCard
                    title="Error Rate"
                    value={stats.errorRate}
                    change="+0.01%"
                    trend="up"
                    icon={Server}
                    color="#ef4444"
                />
                <StatCard
                    title="Database Load"
                    value={stats.dbLoad}
                    change="+5.4%"
                    trend="up"
                    icon={Database}
                    color="#f59e0b"
                />
            </div>

            <div className={styles.chartsSection}>
                <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
                    <div className={styles.chartHeader}>
                        <h3>Traffic Volume (RPS)</h3>
                        <span className={styles.badge}>Live</span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
    <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <div style={{ padding: '8px', borderRadius: '8px', background: `${color}20` }}>
                <Icon size={20} color={color} />
            </div>
        </div>
        <div className={styles.cardValue}>{value}</div>
        <div className={`${styles.cardChange} ${trend === 'up' ? (title === 'Error Rate' || title === 'Avg Latency' ? styles.negative : styles.positive) : (title === 'Error Rate' || title === 'Avg Latency' ? styles.positive : styles.negative)}`}>
            {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span>{change} vs last hour</span>
        </div>
    </div>
);

export default Overview;
