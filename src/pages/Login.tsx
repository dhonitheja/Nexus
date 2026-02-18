import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Simple state to simulate auth
    const handleLogin = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // In real app, integrate with OAuth/LDAP
        if (email && password) {
            localStorage.setItem('user', JSON.stringify({ email }));
            navigate('/');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.bgBlob}></div>
            <div className={styles.loginCard}>
                <h2 className={styles.title}>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="email">Work Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="user@nexus.io"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                    <button type="submit" className={styles.button}>Authenticate</button>
                    <p style={{ marginTop: '1rem', color: '#8b949e', fontSize: '0.8rem' }}>
                        Protected by Nexus Shield™
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
