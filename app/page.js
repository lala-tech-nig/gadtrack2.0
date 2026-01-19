'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      const res = await fetch(`/api/devices/lookup/${query}`, { headers });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Device not found');
      setResult(data);
      if (data.status !== 'stolen') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6600', '#000000', '#f8fafc']
        });
        toast.success('Device found & Safe!');
      } else {
        toast.error('Device reported STOLEN!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-surface)' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <h1 className="hero-title">
              Secure Your <span className="text-gradient">Digital Life</span>
            </h1>
            <p className="hero-subtitle">
              The #1 platform to eradicate gadget theft in Africa. Key in your device history to verify ownership before you buy.
            </p>

            <form onSubmit={handleLookup} className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Enter IMEI or Serial Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary search-btn"
              >
                {loading ? 'Scanning...' : 'Trace It'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Result Section */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="container"
            style={{ marginTop: '-4rem', position: 'relative', zIndex: 20, paddingBottom: '4rem' }}
          >
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: `6px solid ${result.status === 'stolen' ? 'var(--danger)' : 'var(--success)'}`, boxShadow: 'var(--shadow-lg)' }}>

              {/* Conditional Blurred Overlay if result.isBlurred */}
              {result.isBlurred && (
                <div className="blur-overlay" style={{ gap: '1.5rem', padding: '2rem' }}>
                  <div style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', textAlign: 'center', maxWidth: '400px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Restricted Access</h2>
                    <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{result.msg}</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <Link href="/auth" className="btn btn-primary">Login to Unlock</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className={result.isBlurred ? "blur-content" : ""} style={{ padding: '2.5rem', borderBottom: '1px solid var(--border)', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--secondary)' }}>{result.brand} {result.model}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                      SN: <span className="font-semibold text-main">{result.serialNumber || '••••••••'}</span> •
                      IMEI: <span className="font-semibold text-main">{result.imei || '••••••••'}</span>
                    </p>
                  </div>
                  <span className={`badge ${result.status === 'stolen' ? 'badge-stolen' : 'badge-active'}`} style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div className={result.isBlurred ? "blur-content" : ""} style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Device Specs Card */}
                  <div className="card" style={{ padding: '1.5rem', border: 'none', boxShadow: 'none', background: 'white' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Device Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                        <span className="text-muted">Color</span>
                        <span className="font-semibold">{result.color || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                        <span className="text-muted">Current Owner</span>
                        <span className="font-semibold">{result.owner?.name ? `${result.owner.name.substring(0, 3)}***` : 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Registered</span>
                        <span className="font-semibold">{result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {result.status !== 'stolen' ? (
                    <div style={{ background: 'var(--primary-light)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 102, 0, 0.2)' }}>
                      <p style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: '700', fontSize: '1.1rem' }}>✨ Clean & Safe</p>
                      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>This device has a clean history. You can request ownership transfer if you are buying it.</p>
                      <Link href="/auth" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                        Login to Request Transfer
                      </Link>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--danger-light)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger)' }}>
                      <h3 className="text-danger" style={{ marginBottom: '0.5rem' }}>🛑 REPORTED STOLEN</h3>
                      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Do not purchase this device. It has been flagged by the owner.</p>
                      <button
                        onClick={() => toast.success('Police notified! Stay safe.')}
                        className="btn btn-danger"
                        style={{ width: '100%', fontSize: '1.1rem' }}
                      >
                        Report & Notify Police
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline History */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>Ownership History</h3>
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '2rem' }}>
                    {result.history && result.history.map((record, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: '2rem' }}>
                        <div style={{
                          position: 'absolute', left: '-2.6rem', top: '0', width: '1rem', height: '1rem', borderRadius: '50%',
                          background: record.action && record.action.includes('stolen') ? 'var(--danger)' : 'var(--success)',
                          border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}></div>

                        <div className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div className="font-bold" style={{ textTransform: 'capitalize' }}>{record.action ? record.action.replace(/_/g, ' ') : 'Unknown Action'}</div>
                            <time style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                              {new Date(record.date).toLocaleDateString()}
                            </time>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Owner: <span className="font-semibold text-main">{record.owner?.name || 'System'}</span>
                          </div>
                          {record.details && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>"{record.details}"</p>}
                        </div>
                      </div>
                    ))}
                    {!result.history && <p className="text-muted">No history available.</p>}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section className="container">
        <div className="features-grid">
          {[
            { title: 'Register Gadgets', desc: 'Secure digital vault for all your devices.', icon: '🛡️' },
            { title: 'Transfer Ownership', desc: 'Legally transfer devices to new owners.', icon: '🤝' },
            { title: 'Verify History', desc: 'Check device lifecycle before buying.', icon: '🔍' }
          ].map((feature, i) => (
            <div key={i} className="card" style={{ padding: '2rem' }}>
              <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
