'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [devices, setDevices] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDevice, setNewDevice] = useState({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });
    const [refresh, setRefresh] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);

        fetchData(token);
    }, [refresh, router]);

    const fetchData = async (token) => {
        try {
            const [devRes, transRes] = await Promise.all([
                fetch('/api/devices/my-devices', { headers: { 'x-auth-token': token } }),
                fetch('/api/transfers/pending', { headers: { 'x-auth-token': token } })
            ]);

            const devData = await devRes.json();
            const transData = await transRes.json();

            if (devRes.ok) setDevices(devData);
            if (transRes.ok) setTransfers(transData);

        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(newDevice)
            });

            if (res.ok) {
                setShowAddForm(false);
                setNewDevice({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });
                setRefresh(prev => prev + 1);
            } else {
                const data = await res.json();
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptTransfer = async (id) => {
        const token = localStorage.getItem('token');
        if (!confirm('Accept this device transfer?')) return;

        try {
            const res = await fetch(`/api/transfers/${id}/accept`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                alert('Transfer Accepted! Device is now yours.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) return <div className="container" style={{ paddingTop: '50px' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <div className="header">
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Hello, {user.name}</h1>
                    <p style={{ color: '#666' }}>Role: <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--primary)' }}>{user.role}</span></p>
                </div>
                <button className="btn btn-secondary" onClick={() => { localStorage.clear(); router.push('/auth'); }}>Logout</button>
            </div>

            {/* Pending Transfers Alert */}
            {transfers.length > 0 && (
                <div className="card animate-slide-up" style={{ marginBottom: '30px', borderLeft: '5px solid var(--primary)' }}>
                    <h2 style={{ marginBottom: '15px' }}>Incoming Device Transfers ({transfers.length})</h2>
                    {transfers.map(t => (
                        <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                            <div>
                                <p><strong>{t.device.brand} {t.device.model}</strong></p>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>From: {t.fromUser.name} ({t.fromUser.email})</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleAcceptTransfer(t._id)}>Accept</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Devices Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>My Devices</h2>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>+ Add Device</button>
            </div>

            {showAddForm && (
                <div className="card animate-fade-in" style={{ marginBottom: '30px' }}>
                    <h3>Register New Gadget</h3>
                    <form onSubmit={handleAddDevice} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div className="input-group">
                            <label>Brand</label>
                            <input type="text" className="input-field" value={newDevice.brand} onChange={e => setNewDevice({ ...newDevice, brand: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Model</label>
                            <input type="text" className="input-field" value={newDevice.model} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Serial Number</label>
                            <input type="text" className="input-field" value={newDevice.serialNumber} onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>IMEI (Optional)</label>
                            <input type="text" className="input-field" value={newDevice.imei} onChange={e => setNewDevice({ ...newDevice, imei: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Color</label>
                            <input type="text" className="input-field" value={newDevice.color} onChange={e => setNewDevice({ ...newDevice, color: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Details</label>
                            <input type="text" className="input-field" value={newDevice.details} onChange={e => setNewDevice({ ...newDevice, details: e.target.value })} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <button type="submit" className="btn btn-primary">Register Device</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {devices.map(device => (
                    <Link href={`/device/${device._id}`} key={device._id} style={{ display: 'block' }}>
                        <div className="card" style={{ height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '1.2rem' }}>{device.brand} {device.model}</h3>
                                <span style={{
                                    color: device.status === 'stolen' ? 'var(--danger)' : 'var(--success)',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    border: `1px solid ${device.status === 'stolen' ? 'var(--danger)' : 'var(--success)'}`,
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    {device.status.toUpperCase()}
                                </span>
                            </div>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>SN: {device.serialNumber}</p>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Color: {device.color}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {devices.length === 0 && !showAddForm && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <p>You haven't registered any devices yet.</p>
                </div>
            )}
        </div>
    );
}
