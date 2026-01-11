'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
      const res = await fetch(`/api/devices/lookup/${query}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Device not found');
      setResult(data);
      toast.success('Device found!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
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
              Secure Your <span className="text-primary">Digital Life</span>
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
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: `8px solid ${result.status === 'stolen' ? 'var(--danger)' : 'var(--success)'}` }}>

              {/* Header */}
              <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{result.brand} {result.model}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>SN: {result.serialNumber} • IMEI: {result.imei || 'N/A'}</p>
                  </div>
                  <span className={`badge ${result.status === 'stolen' ? 'badge-stolen' : 'badge-active'}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Device Details</h3>
                    <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Color</span>
                        <span className="font-semibold">{result.color || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Current Owner</span>
                        <span className="font-semibold">{result.owner?.name ? `${result.owner.name.substring(0, 3)}***` : 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Registered</span>
                        <span className="font-semibold">{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {result.status !== 'stolen' ? (
                    <div style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ color: 'var(--primary-dark)', marginBottom: '1rem', fontWeight: '500' }}>✨ Interested in this device?</p>
                      <Link href="/auth" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                        Login to Request Transfer
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => toast.success('Police notified! Stay safe.')}
                      className="btn btn-danger"
                      style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', animation: 'pulse 1.5s infinite' }}
                    >
                      ⚠ REPORT DEVICE FOUND
                    </button>
                  )}
                </div>

                {/* Timeline History */}
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Ownership History</h3>
                  <div className="timeline">
                    {result.history && result.history.map((record, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className={`timeline-dot ${record.action.includes('stolen') ? 'timeline-dot-danger' : 'timeline-dot-success'}`}></div>
                        <div className="timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div className="font-bold">{record.action.replace(/_/g, ' ')}</div>
                            <time className="timeline-date">
                              {new Date(record.date).toLocaleDateString()}
                            </time>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Owner: <span className="font-semibold">{record.owner?.name || 'System'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
            <div key={i} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
