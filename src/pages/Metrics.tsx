import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import styles from './Overview.module.css'; // Reusing overview styles for consistency

const Metrics = () => {
    const data = [
        { name: '00:00', uv: 4000, pv: 2400, amt: 2400 },
        { name: '04:00', uv: 3000, pv: 1398, amt: 2210 },
        { name: '08:00', uv: 2000, pv: 9800, amt: 2290 },
        { name: '12:00', uv: 2780, pv: 3908, amt: 2000 },
        { name: '16:00', uv: 1890, pv: 4800, amt: 2181 },
        { name: '20:00', uv: 2390, pv: 3800, amt: 2500 },
        { name: '23:59', uv: 3490, pv: 4300, amt: 2100 },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Infrastructure Metrics</h1>
                <div className={styles.controls}>
                    <button className={styles.button}>Refresh</button>
                    <select className={styles.select}>
                        <option>All Clusters</option>
                    </select>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.chartCard}>
                    <h3>CPU Usage</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                            <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                    <h3>Memory Usage</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                            <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                    <h3>Network I/O</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                            <Bar dataKey="amt" fill="#ffc658" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Metrics;
