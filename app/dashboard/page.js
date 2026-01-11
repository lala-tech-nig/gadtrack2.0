'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, profile
    const [devices, setDevices] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDevice, setNewDevice] = useState({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });

    // Profile State
    const [profileData, setProfileData] = useState({ name: '', nin: '' });
    const [loadingProfile, setLoadingProfile] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth');
            return;
        }
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);
        setProfileData({ name: storedUser?.name || '', nin: storedUser?.nin || '' });

        fetchData(token);
    }, [router]);

    const fetchData = async (token) => {
        try {
            const [devRes, transRes] = await Promise.all([
                fetch('/api/devices/my-devices', { headers: { 'x-auth-token': token } }),
                fetch('/api/transfers/pending', { headers: { 'x-auth-token': token } })
            ]);

            if (devRes.ok) setDevices(await devRes.json());
            if (transRes.ok) setTransfers(await transRes.json());
        } catch (err) {
            console.error(err);
            toast.error('Failed to load dashboard data');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || 'Update failed');

            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Profile updated successfully!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newDevice)
            });
            if (res.ok) {
                setShowAddForm(false);
                setNewDevice({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });
                fetchData(token);
                toast.success('Device registered successfully!');
            } else {
                const data = await res.json();
                toast.error(data.msg);
            }
        } catch (err) {
            toast.error('Failed to add device');
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'profile', label: 'My Profile' }
    ];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
            {/* Header */}
            <header className="navbar" style={{ marginBottom: '2rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Welcome, <span className="text-primary font-semibold">{user.name}</span></span>
                        <button onClick={() => { localStorage.clear(); router.push('/auth'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>Logout</button>
                    </div>
                </div>
            </header>

            <main className="container">
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                fontWeight: '500',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-light)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode='wait'>
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {/* Stats / Quick Actions */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Total Devices</h3>
                                    <p className="stat-value">{devices.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Pending Transfers</h3>
                                    <p className="stat-value" style={{ color: '#2563EB' }}>{transfers.length}</p>
                                </div>
                                <div className="flex items-center">
                                    <AnimatedButton onClick={() => setShowAddForm(!showAddForm)} className="btn-primary" style={{ width: '100%', height: '100%', fontSize: '1.125rem' }}>
                                        {showAddForm ? 'Cancel Registration' : '+ Register Device'}
                                    </AnimatedButton>
                                </div>
                            </div>

                            {/* Add Device Form */}
                            <AnimatePresence>
                                {showAddForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="card"
                                        style={{ overflow: 'hidden', marginBottom: '2rem' }}
                                    >
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Register New Gadget</h3>
                                        <form onSubmit={handleAddDevice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                            <AnimatedInput label="Brand" name="brand" value={newDevice.brand} onChange={e => setNewDevice({ ...newDevice, brand: e.target.value })} required />
                                            <AnimatedInput label="Model" name="model" value={newDevice.model} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} required />
                                            <AnimatedInput label="Serial Number" name="serialNumber" value={newDevice.serialNumber} onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })} required />
                                            <AnimatedInput label="Color" name="color" value={newDevice.color} onChange={e => setNewDevice({ ...newDevice, color: e.target.value })} />
                                            <AnimatedInput label="IMEI (Optional)" name="imei" value={newDevice.imei} onChange={e => setNewDevice({ ...newDevice, imei: e.target.value })} />
                                            <AnimatedInput label="Details" name="details" value={newDevice.details} onChange={e => setNewDevice({ ...newDevice, details: e.target.value })} />
                                            <div style={{ gridColumn: '1 / -1', paddingTop: '1rem' }}>
                                                <AnimatedButton type="submit" className="btn-primary">Complete Registration</AnimatedButton>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Device List */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {devices.map(device => (
                                    <Link href={`/device/${device._id}`} key={device._id} style={{ display: 'block' }}>
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="card"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{device.brand}</h3>
                                                    <p style={{ color: 'var(--text-secondary)' }}>{device.model}</p>
                                                </div>
                                                <span className={`badge ${device.status === 'active' ? 'badge-active' : 'badge-stolen'}`}>
                                                    {device.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                <p>SN: {device.serialNumber}</p>
                                                <p>Color: {device.color}</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="card"
                            style={{ maxWidth: '42rem', margin: '0 auto' }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Profile Settings</h2>
                            <form onSubmit={handleUpdateProfile}>
                                <AnimatedInput
                                    label="Full Name"
                                    value={profileData.name}
                                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                />
                                <AnimatedInput
                                    label="National ID (NIN)"
                                    value={profileData.nin}
                                    onChange={e => setProfileData({ ...profileData, nin: e.target.value })}
                                    placeholder="Enter your NIN"
                                />
                                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Role: <span className="text-primary font-semibold" style={{ textTransform: 'uppercase' }}>{user.role}</span></p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Email: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{user.email}</span></p>
                                    <AnimatedButton type="submit" loading={loadingProfile} className="btn-primary">
                                        Update Profile
                                    </AnimatedButton>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
