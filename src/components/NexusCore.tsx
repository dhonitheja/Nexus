
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Mic, X, Bot, Zap, Terminal } from 'lucide-react';
import styles from './NexusCore.module.css';

const NexusCore = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, type?: 'code' | 'action' }[]>([
        { role: 'ai', text: 'Nexus Core Online. I am monitoring 4,230 services. How can I assist?', type: 'action' }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Keyboard shortcut (Ctrl+K or Cmd+K)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');

        // Simulate AI Processing
        setTimeout(() => {
            let response = "I'm analyzing that request...";
            let type: 'code' | 'action' | undefined;

            if (userMsg.toLowerCase().includes('error')) {
                response = "I found 342 error logs in 'payment-processor' matching that pattern. Would you like me to generate a root cause analysis report?";
                type = 'action';
            } else if (userMsg.toLowerCase().includes('slow') || userMsg.toLowerCase().includes('latency')) {
                response = "Detected P99 latency spike in 'api-gateway'. Correlating with database locks...";
            } else if (userMsg.toLowerCase().includes('fix') || userMsg.toLowerCase().includes('restart')) {
                response = "Initiating automated remediation workflow: 'Restart-K8s-Pod'. Authorization required.";
                type = 'code';
            }

            setMessages(prev => [...prev, { role: 'ai', text: response, type }]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Trigger */}
            <motion.button
                className={styles.trigger}
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Sparkles size={24} color="#fff" />
            </motion.button>

            {/* Main Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
                    >
                        <motion.div
                            className={styles.container}
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        >
                            <div className={styles.header}>
                                <div className={styles.title}>
                                    <Bot size={24} style={{ color: '#58a6ff' }} />
                                    <span>Nexus Core AI</span>
                                    <span className={styles.badge}>PRO</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}><X size={20} /></button>
                            </div>

                            <div className={styles.messages}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.ai}`}>
                                        {msg.role === 'ai' && <div className={styles.avatar}><Sparkles size={14} /></div>}
                                        <div className={styles.bubble}>
                                            {msg.text}
                                            {msg.type === 'action' && (
                                                <div className={styles.actionBlock}>
                                                    <button className={styles.actionBtn}><Zap size={14} /> Execute Fix</button>
                                                    <button className={styles.actionBtn}><Terminal size={14} /> View Logs</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSubmit} className={styles.inputArea}>
                                <div className={styles.inputWrapper}>
                                    <Mic size={20} className={styles.icon} />
                                    <input
                                        type="text"
                                        placeholder="Ask Nexus to analyze logs, fix issues, or scale clusters..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoFocus
                                        className={styles.input}
                                    />
                                    <button type="submit" className={styles.sendBtn}><Send size={18} /></button>
                                </div>
                                <div className={styles.hint}>
                                    Tips: "Why is checkout slow?", "Show me error spikes", "Scale up database"
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NexusCore;
