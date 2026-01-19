'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import PaymentModal from '../components/PaymentModal';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, profile, history
    const [devices, setDevices] = useState([]);
    const [deviceHistory, setDeviceHistory] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDevice, setNewDevice] = useState({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });

    // Profile State
    const [profileData, setProfileData] = useState({ name: '', nin: '' });
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'addDevice' | 'acceptTransfer', data: any }

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
            const [devRes, transRes, historyRes] = await Promise.all([
                fetch('/api/devices/my-devices', { headers: { 'x-auth-token': token } }),
                fetch('/api/transfers/pending', { headers: { 'x-auth-token': token } }),
                fetch('/api/devices/my-devices/history', { headers: { 'x-auth-token': token } })
            ]);

            if (devRes.ok) setDevices(await devRes.json());
            if (transRes.ok) setTransfers(await transRes.json());
            if (historyRes.ok) setDeviceHistory(await historyRes.json());
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

    const handleAcceptTransfer = async (transferId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/transfers/${transferId}/accept`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            const data = await res.json();

            if (res.status === 402 && data.requiresPayment) {
                // Show payment modal
                setPaymentInfo({ type: data.paymentType, amount: data.amount });
                setPendingAction({ type: 'acceptTransfer', data: transferId });
                setShowPaymentModal(true);
                return;
            }

            if (res.ok) {
                toast.success('Transfer accepted successfully!');
                fetchData(token); // Refresh data
            } else {
                toast.error(data.msg || 'Failed to accept transfer');
            }
        } catch (err) {
            toast.error('Error accepting transfer');
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

            const data = await res.json();

            if (res.status === 402 && data.requiresPayment) {
                // Show payment modal
                setPaymentInfo({ type: data.paymentType, amount: data.amount });
                setPendingAction({ type: 'addDevice', data: newDevice });
                setShowPaymentModal(true);
                return;
            }

            if (res.ok) {
                setShowAddForm(false);
                setNewDevice({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });
                fetchData(token);
                toast.success('Device registered successfully!');
            } else {
                toast.error(data.msg);
            }
        } catch (err) {
            toast.error('Failed to add device');
        }
    };

    const handlePaymentSuccess = (updatedUser) => {
        setUser(updatedUser);
        toast.success('Payment successful!');

        // Retry the pending action
        if (pendingAction) {
            if (pendingAction.type === 'addDevice') {
                // Retry device registration
                const token = localStorage.getItem('token');
                fetch('/api/devices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify(pendingAction.data)
                }).then(res => res.json()).then(data => {
                    if (data._id) {
                        setShowAddForm(false);
                        setNewDevice({ brand: '', model: '', serialNumber: '', imei: '', color: '', details: '' });
                        fetchData(token);
                        toast.success('Device registered successfully!');
                    }
                });
            } else if (pendingAction.type === 'acceptTransfer') {
                // Retry transfer acceptance
                handleAcceptTransfer(pendingAction.data);
            }
            setPendingAction(null);
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'history', label: 'Device History' },
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
                        {user.role === 'admin' && (
                            <button
                                onClick={() => router.push('/admin')}
                                className="btn btn-primary"
                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                            >
                                🛡️ Admin Panel
                            </button>
                        )}
                        <button onClick={() => { localStorage.clear(); router.push('/auth'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>Logout</button>
                    </div>
                </div>
            </header>

            {/* Dashboard Alerts / Role Banners */}
            <div className="container" style={{ marginBottom: '2rem' }}>
                <AnimatePresence>
                    {/* VENDOR / TECHNICIAN: Activation Needed */}
                    {['vendor', 'technician'].includes(user.role) && user.subscription?.status !== 'active' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                marginBottom: '1rem',
                                borderLeft: '4px solid var(--warning)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                                backgroundColor: '#fffbeb', boxShadow: 'none'
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
                                    ⚠ Subscription Inactive
                                </h3>
                                <p className="text-muted">
                                    {user.role === 'vendor' ? 'Pay ₦10,000' : 'Pay ₦5,000'} to unlock unlimited protection and history access.
                                </p>
                            </div>
                            <AnimatedButton
                                onClick={() => {
                                    const amount = user.role === 'vendor' ? 10000 : 5000;
                                    const type = user.role === 'vendor' ? 'vendor_activation' : 'technician_subscription';
                                    setPaymentInfo({ type, amount });
                                    setPendingAction(null);
                                    setShowPaymentModal(true);
                                }}
                                className="btn-primary"
                            >
                                Activate {user.role === 'vendor' ? 'Vendor' : 'Technician'} Plan
                            </AnimatedButton>
                        </motion.div>
                    )}

                    {/* SUBSCRIPTION EXPIRY WARNING (If < 5 days) */}
                    {user.subscription?.expiryDate && (
                        (() => {
                            const daysLeft = Math.ceil((new Date(user.subscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                            if (daysLeft <= 5 && daysLeft > 0) {
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="card"
                                        style={{ padding: '1rem', border: '1px solid var(--danger)', color: 'var(--danger)', marginBottom: '1rem', background: '#fef2f2' }}
                                    >
                                        <strong>⏳ Action Required:</strong> Your subscription expires in {daysLeft} days. Renew now to avoid service interruption.
                                    </motion.div>
                                );
                            }
                            return null;
                        })()
                    )}

                    {/* BASIC USER: Usage Limits Display */}
                    {user.role === 'basic' && (
                        <div className="card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'white' }}>
                            <div className="text-center">
                                <h4 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Transfers</h4>
                                <p className="font-bold" style={{ fontSize: '2rem', color: 'var(--primary)' }}>{3 - (user.usage?.transfers || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>/ 3</span></p>
                            </div>
                            <div className="text-center" style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                                <h4 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Acceptances</h4>
                                <p className="font-bold" style={{ fontSize: '2rem', color: 'var(--primary)' }}>{3 - (user.usage?.acceptances || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>/ 3</span></p>
                            </div>
                            <div className="text-center">
                                <h4 className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Lookups</h4>
                                <p className="font-bold" style={{ fontSize: '2rem', color: 'var(--primary)' }}>{3 - (user.usage?.lookups || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>/ 3</span></p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

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

                            {/* Pending Transfers Section */}
                            <AnimatePresence>
                                {transfers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginBottom: '2rem' }}
                                    >
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#2563EB' }}>Pending Transfers ({transfers.length})</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                            {transfers.map(transfer => (
                                                <div key={transfer._id} className="card" style={{ borderLeft: '4px solid #2563EB', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{transfer.device.brand} {transfer.device.model}</h4>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SN: {transfer.device.serialNumber}</p>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', padding: '0.5rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                                                        From: <strong>{transfer.fromUser?.name || 'Unknown'}</strong>
                                                    </div>
                                                    <AnimatedButton
                                                        onClick={() => handleAcceptTransfer(transfer._id)}
                                                        className="btn-primary"
                                                        style={{ width: '100%', backgroundColor: '#2563EB' }}
                                                    >
                                                        Accept Transfer
                                                    </AnimatedButton>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

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

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                                All Devices You've Ever Owned
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                This includes devices you currently own and those you've transferred to others.
                            </p>

                            {deviceHistory.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No device history found.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {deviceHistory.map(device => (
                                        <Link href={`/device/${device._id}`} key={device._id} style={{ display: 'block' }}>
                                            <motion.div
                                                whileHover={{ y: -5 }}
                                                className="card"
                                                style={{
                                                    cursor: 'pointer',
                                                    opacity: device.transferredOut ? 0.7 : 1,
                                                    borderLeft: device.transferredOut ? '4px solid var(--danger)' : '4px solid var(--success)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{device.brand}</h3>
                                                        <p style={{ color: 'var(--text-secondary)' }}>{device.model}</p>
                                                    </div>
                                                    <span className={`badge ${device.currentlyOwned ? 'badge-active' : 'badge-stolen'}`}>
                                                        {device.currentlyOwned ? 'Current' : 'Transferred Out'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    <p>SN: {device.serialNumber}</p>
                                                    <p>Color: {device.color || 'N/A'}</p>
                                                    {device.transferredOut && (
                                                        <p style={{ color: 'var(--danger)', fontWeight: '600', marginTop: '0.5rem' }}>
                                                            ⚠ No longer in your possession
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}
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

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                paymentInfo={paymentInfo}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
