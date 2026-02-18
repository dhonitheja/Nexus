import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Activity, Settings, ShieldCheck, Network, Cpu, Brain, Search as SearchIcon } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Enterprise Dashboard', path: '/' },
        { icon: SearchIcon, label: 'Visual Analytics', path: '/search' },
        { icon: List, label: 'Log Stream', path: '/logs' },
        { icon: Activity, label: 'Metrics', path: '/metrics' },
        { icon: Network, label: 'Service Map', path: '/service-map' },
        { icon: Cpu, label: 'Tracing', path: '/tracing' },
        { icon: Brain, label: 'AI Insights', path: '/insights' },
        { icon: ShieldCheck, label: 'Active Defense', path: '/remediation' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <div className={styles.logoIcon}>N</div>
                <h1 className={styles.logoText}>Nexus</h1>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive ? styles.active : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span className={styles.label}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.status}>
                <div style={{ marginBottom: '0.5rem' }}>Cluster: prod-us-east-1</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.statusIndicator}></span>
                    <span>System Healthy</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
