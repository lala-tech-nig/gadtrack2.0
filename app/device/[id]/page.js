'use client';
import { useState, useEffect, use } from 'react'; // React 19 use API
import { useRouter } from 'next/navigation';

export default function DeviceDetail({ params }) {
    // Unwrap params using React 19's use() if needed, but in Next.js 15+ async params are common. 
    // Wait, Next.js 15+ params are async. Let's handle that safely.
    // Actually, in the latest Next.js versions params is a Promise.
    // Let's assume params is a promise and await it or use `use`. 
    // Since I can't easily check the Next version specifics for this exact workspace beyond 16.1.1 (very new), I'll treat it as async.

    const { id } = use(params);

    const [device, setDevice] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // ... existing useEffect ...

    // ... existing fetchDevice ...

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Mark device as ${newStatus.toUpperCase()}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/devices/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchDevice(); // Refresh
                toast.success(`Device marked as ${newStatus}`);
            }
        } catch (err) { console.error(err); }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmittingComment(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/devices/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text: newComment })
            });

            if (res.ok) {
                setNewComment('');
                fetchDevice();
                toast.success('Comment added!');
            }
        } catch (err) {
            toast.error('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    // ... handleTransfer ...

    if (loading) return <div className="container" style={{ paddingTop: '2rem' }}>Loading...</div>;
    if (!device) return null;

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <button onClick={() => router.back()} className="btn btn-secondary" style={{ marginBottom: '20px' }}>&larr; Back to Dashboard</button>

            <div className="card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{device.brand} {device.model}</h1>
                        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '5px' }}>SN: {device.serialNumber}</p>
                        {device.imei && <p style={{ fontSize: '1.1rem', color: '#666' }}>IMEI: {device.imei}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ marginBottom: '10px', fontSize: '1.2rem' }}>Status</p>
                        <div className={`badge ${device.status === 'stolen' ? 'badge-stolen' : 'badge-active'}`} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
                            {device.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                <hr style={{ margin: '30px 0', borderColor: '#eee' }} />

                <div style={{ display: 'grid', mdGridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Actions</h3>

                        <div style={{ marginBottom: '30px' }}>
                            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Update Status</p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {device.status !== 'active' && (
                                    <button onClick={() => handleStatusChange('active')} className="btn" style={{ background: 'var(--success)', color: 'white' }}>Mark Active/Found</button>
                                )}
                                {device.status !== 'stolen' && (
                                    <button onClick={() => handleStatusChange('stolen')} className="btn btn-danger">Mark Stolen</button>
                                )}
                                {device.status !== 'lost' && (
                                    <button onClick={() => handleStatusChange('lost')} className="btn" style={{ background: '#FF9800', color: 'white' }}>Mark Lost</button>
                                )}
                                {/* New Statuses */}
                                <button onClick={() => handleStatusChange('sold')} className="btn btn-secondary">Mark Sold</button>
                                <button onClick={() => handleStatusChange('dashed')} className="btn btn-secondary">Mark Dashed (Gift)</button>
                                <button onClick={() => handleStatusChange('scrapped')} className="btn btn-secondary">Mark Scrapped</button>
                            </div>
                        </div>

                        <div>
                            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Transfer Ownership</p>
                            {!isTransferring ? (
                                <button onClick={() => setIsTransferring(true)} className="btn btn-primary">Initiate Transfer</button>
                            ) : (
                                <form onSubmit={handleTransfer} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Recipient Email</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={transferEmail}
                                        onChange={e => setTransferEmail(e.target.value)}
                                        required
                                        placeholder="buyer@example.com"
                                        style={{ marginBottom: '10px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn btn-primary">Send Request</button>
                                        <button type="button" onClick={() => setIsTransferring(false)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div>
                        {/* Comments Section */}
                        <h3 style={{ marginBottom: '15px' }}>Owner Comments</h3>
                        <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <form onSubmit={handleAddComment}>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    placeholder="Add a public comment (e.g., 'Screen replaced', 'Receipt available')..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                ></textarea>
                                <button disabled={submittingComment} type="submit" className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    {submittingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </form>
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '2rem' }}>
                            {device.comments && device.comments.length > 0 ? (
                                device.comments.map((c, i) => (
                                    <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                                        <p style={{ fontSize: '0.9rem' }}>{c.text}</p>
                                        <small className="text-muted">By You on {new Date(c.date).toLocaleDateString()}</small>
                                    </div>
                                ))
                            ) : <p className="text-muted">No comments yet.</p>}
                        </div>

                        <h3 style={{ marginBottom: '20px' }}>History Log</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {device.history.slice().reverse().map((log, index) => (
                                <div key={index} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                    <p style={{ fontWeight: '600' }}>{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                                    <p style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(log.date).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
