'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/devices/lookup/${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Device not found');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="animate-slide-up">
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>
            Secure Your <span style={{ color: 'var(--primary)' }}>Gadgets</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            The #1 platform to eradicate gadget theft in Africa. key in your device history to verify ownership before you buy.
          </p>

          <form onSubmit={handleLookup} style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Enter IMEI or Serial Number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: '20px', fontSize: '1.2rem', borderRadius: '50px', paddingRight: '120px' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ position: 'absolute', right: '5px', top: '5px', bottom: '5px', borderRadius: '40px', padding: '0 30px' }}
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </form>

          {error && (
            <div className="animate-fade-in" style={{ marginTop: '20px', color: 'var(--danger)', fontWeight: 'bold' }}>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Result Section */}
      {result && (
        <section className="container animate-fade-in" style={{ padding: '40px 0' }}>
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto', borderLeft: `8px solid ${result.status === 'stolen' ? 'var(--danger)' : 'var(--success)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '2rem' }}>{result.brand} {result.model}</h2>
              <span
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: result.status === 'stolen' ? '#ffebee' : '#e8f5e9',
                  color: result.status === 'stolen' ? 'var(--danger)' : 'var(--success)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {result.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Serial Number</p>
                <p style={{ fontWeight: '600' }}>{result.serialNumber}</p>
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Color</p>
                <p style={{ fontWeight: '600' }}>{result.color}</p>
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Current Owner</p>
                <p style={{ fontWeight: '600' }}>{result.owner?.name?.substring(0, 3)}*** (Hidden)</p>
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Last Updated</p>
                <p style={{ fontWeight: '600' }}>{new Date(result.history[result.history.length - 1].date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Panic Button Logic */}
            {result.status !== 'stolen' && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#fff3e0', borderRadius: '8px' }}>
                <p style={{ marginBottom: '10px' }}><strong>Buying this device?</strong> Ask the seller to transfer ownership to you securely via Gadtrack.</p>
                <Link href="/auth" className="btn btn-primary">Login to Accept Transfer</Link>
              </div>
            )}

            {result.status === 'stolen' && (
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button className="btn btn-danger animate-pulse" onClick={() => alert('Panic Alert Triggered! Authorities Notified.')} style={{ width: '100%', fontSize: '1.2rem' }}>
                  ⚠ REPORT FOUND / PANIC
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="container" style={{ padding: '80px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Register Gadgets</h3>
          <p style={{ color: '#666' }}>Add all your devices to your secure digital vault. Keep track of serials and receipts.</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Transfer Ownership</h3>
          <p style={{ color: '#666' }}>Selling your phone? Transfer it legally and transparently to the new owner.</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Device History</h3>
          <p style={{ color: '#666' }}>Check the full lifecycle of a used device before buying. Avoid stolen goods.</p>
        </div>
      </section>
    </div>
  );
}
