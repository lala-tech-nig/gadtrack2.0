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
    const [loading, setLoading] = useState(true);
    const [transferEmail, setTransferEmail] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchDevice();
    }, [id]); // eslint-disable-line

    const fetchDevice = async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/auth');

        try {
            // We can re-use the public lookup or a specific protected ID endpoint. 
            // Let's use lookup logic but maybe we need a direct ID endpoint in backend?
            // Actually, let's use the 'my-devices' list and filter, OR add a specific GET /devices/:id endpoint.
            // I didn't add GET /devices/:id in backend explicitly for owners, but I can use the lookup logic via Serial if I knew it, 
            // OR better add a GET /api/devices/:id to backend.
            // Wait, I implemented `GET /lookup/:query` which takes serial or IMEI. 
            // But for dashboard details by ID, I should probably have a direct ID fetch or just filter from my-devices for safety if I don't want to add more backend code.
            // Optimization: Let's add GET /api/devices/:id to `server/routes/devices.js` or just iterate `my-devices` for now to save a backend restart if not needed.
            // Actually, I can just use `my-devices` and find the one with matching ID. It's safe enough for MVP.

            const res = await fetch('/api/devices/my-devices', { headers: { 'x-auth-token': token } });
            const devices = await res.json();
            const found = devices.find(d => d._id === id);

            if (found) {
                setDevice(found);
            } else {
                // Might be a transfer history item or just not found
                alert('Device not found or not owned by you');
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Mark device as ${newStatus}?`)) return;
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
            }
        } catch (err) { console.error(err); }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ deviceId: id, toUserEmail: transferEmail })
            });

            if (res.ok) {
                alert('Transfer initiated! The recipient must accept it from their dashboard.');
                setIsTransferring(false);
            } else {
                const data = await res.json();
                alert(data.msg);
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="container">Loading...</div>;
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
                        <div style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            borderRadius: '25px',
                            background: device.status === 'stolen' ? 'var(--danger)' : (device.status === 'active' ? 'var(--success)' : '#999'),
                            color: '#fff',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            {device.status}
                        </div>
                    </div>
                </div>

                <hr style={{ margin: '30px 0', borderColor: '#eee' }} />

                <div style={{ display: 'grid', mdGridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Actions</h3>

                        <div style={{ marginBottom: '30px' }}>
                            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Update Status</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {device.status !== 'active' && (
                                    <button onClick={() => handleStatusChange('active')} className="btn" style={{ background: 'var(--success)', color: 'white' }}>Mark Active/Found</button>
                                )}
                                {device.status !== 'stolen' && (
                                    <button onClick={() => handleStatusChange('stolen')} className="btn btn-danger">Mark Stolen</button>
                                )}
                                {device.status !== 'lost' && (
                                    <button onClick={() => handleStatusChange('lost')} className="btn" style={{ background: '#FF9800', color: 'white' }}>Mark Lost</button>
                                )}
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
