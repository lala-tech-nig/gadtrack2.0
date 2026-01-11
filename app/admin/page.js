'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '3rem', backgroundColor: 'var(--surface)' }}>
            <header className="navbar" style={{ marginBottom: '2rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>🛡️ Super Admin Dashboard</h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Platform Management & Analytics</p>
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="btn" style={{ fontSize: '0.875rem' }}>
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="container">
                {/* Overview Stats */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Platform Overview</h2>
                <div className="stats-grid" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Users</h3>
                        <p className="stat-value">{stats?.users?.total || 0}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                            +{stats?.users?.newToday || 0} today
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Devices</h3>
                        <p className="stat-value">{stats?.devices?.total || 0}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                            +{stats?.devices?.newToday || 0} today
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Revenue (All Time)</h3>
                        <p className="stat-value" style={{ color: 'var(--success)' }}>₦{stats?.revenue?.allTime?.toLocaleString() || 0}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                            ₦{stats?.revenue?.today?.toLocaleString() || 0} today
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Flagged Devices</h3>
                        <p className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.devices?.flagged || 0}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                            {stats?.devices?.stolen || 0} stolen, {stats?.devices?.lost || 0} lost
                        </p>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {/* User Stats Card */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>👥 User Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>New This Week</span>
                                <span className="font-semibold">{stats?.users?.newThisWeek || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>New This Month</span>
                                <span className="font-semibold">{stats?.users?.newThisMonth || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Basic Users</span>
                                <span className="font-semibold">{stats?.users?.basic || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Vendors</span>
                                <span className="font-semibold">{stats?.users?.vendors || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Active Vendors</span>
                                <span className="font-semibold" style={{ color: 'var(--success)' }}>{stats?.users?.activeVendors || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Suspended</span>
                                <span className="font-semibold" style={{ color: 'var(--danger)' }}>{stats?.users?.suspended || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Device Stats Card */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>📱 Device Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>New This Week</span>
                                <span className="font-semibold">{stats?.devices?.newThisWeek || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>New This Month</span>
                                <span className="font-semibold">{stats?.devices?.newThisMonth || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Flagged</span>
                                <span className="font-semibold" style={{ color: 'var(--danger)' }}>{stats?.devices?.flagged || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', paddingLeft: '1rem' }}>• Stolen</span>
                                <span className="font-semibold">{stats?.devices?.stolen || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', paddingLeft: '1rem' }}>• Lost</span>
                                <span className="font-semibold">{stats?.devices?.lost || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Stats Card */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>💰 Revenue Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Today</span>
                                <span className="font-semibold" style={{ color: 'var(--success)' }}>₦{stats?.revenue?.today?.toLocaleString() || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>This Week</span>
                                <span className="font-semibold" style={{ color: 'var(--success)' }}>₦{stats?.revenue?.thisWeek?.toLocaleString() || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>All Time</span>
                                <span className="font-semibold" style={{ color: 'var(--success)', fontSize: '1.25rem' }}>₦{stats?.revenue?.allTime?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>User Management</h2>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{ maxWidth: '300px', padding: '0.5rem 1rem' }}
                        />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Joined</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <motion.tr
                                        key={user._id}
                                        whileHover={{ backgroundColor: 'var(--surface)' }}
                                        style={{ borderBottom: '1px solid var(--border)' }}
                                    >
                                        <td style={{ padding: '1rem' }}>{user.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${user.role === 'vendor' ? 'badge-active' : ''}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${user.isAccountSuspended ? 'badge-stolen' : 'badge-active'}`}>
                                                {user.isAccountSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
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
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                </div>
            </main>
        </div>
    );
}
