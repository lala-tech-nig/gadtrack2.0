'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchData(token);
    }, [router]);

    const fetchData = async (token) => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch('/api/admin/stats', { headers: { 'x-auth-token': token } }),
                fetch('/api/users', { headers: { 'x-auth-token': token } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load admin data');
            setLoading(false);
        }
    };

    const handleSuspend = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.msg);
                fetchData(token);
            } else {
                toast.error(data.msg);
            }
        } catch (err) {
            toast.error('Failed to update user');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
            <header className="navbar" style={{ marginBottom: '2rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Admin Dashboard</h1>
                    <button onClick={() => router.push('/dashboard')} className="btn" style={{ fontSize: '0.875rem' }}>
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="container">
                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '3rem' }}>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Users</h3>
                        <p className="stat-value">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Devices</h3>
                        <p className="stat-value">{stats?.totalDevices || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Revenue Today</h3>
                        <p className="stat-value" style={{ color: 'var(--success)' }}>₦{stats?.revenueToday?.toLocaleString() || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Flagged Devices</h3>
                        <p className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.flaggedDevices || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Vendors</h3>
                        <p className="stat-value" style={{ color: '#2563EB' }}>{stats?.activeVendors || 0}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>User Management</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <motion.tr
                                        key={user._id}
                                        whileHover={{ backgroundColor: 'var(--surface)' }}
                                        style={{ borderBottom: '1px solid var(--border)' }}
                                    >
                                        <td style={{ padding: '1rem' }}>{user.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${user.role === 'vendor' ? 'badge-active' : ''}`} style={{ textTransform: 'uppercase' }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${user.isAccountSuspended ? 'badge-stolen' : 'badge-active'}`}>
                                                {user.isAccountSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleSuspend(user._id)}
                                                className="btn"
                                                style={{
                                                    fontSize: '0.875rem',
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: user.isAccountSuspended ? 'var(--success)' : 'var(--danger)',
                                                    color: 'white'
                                                }}
                                            >
                                                {user.isAccountSuspended ? 'Unsuspend' : 'Suspend'}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
