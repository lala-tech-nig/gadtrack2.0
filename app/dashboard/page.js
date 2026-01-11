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
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-500">Welcome, <span className="font-semibold text-orange-600">{user.name}</span></span>
                        <button onClick={() => { localStorage.clear(); router.push('/auth'); }} className="text-sm text-red-500 hover:text-red-700 font-medium">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-4 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
                            className="space-y-6"
                        >
                            {/* Stats / Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                                    <h3 className="text-lg font-semibold text-gray-900">Total Devices</h3>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">{devices.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                                    <h3 className="text-lg font-semibold text-gray-900">Pending Transfers</h3>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{transfers.length}</p>
                                </div>
                                <div className="flex items-center">
                                    <AnimatedButton onClick={() => setShowAddForm(!showAddForm)} className="w-full h-full justify-center text-lg">
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
                                        className="bg-white p-6 rounded-lg shadow-md overflow-hidden"
                                    >
                                        <h3 className="text-xl font-bold mb-4">Register New Gadget</h3>
                                        <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <AnimatedInput label="Brand" name="brand" value={newDevice.brand} onChange={e => setNewDevice({ ...newDevice, brand: e.target.value })} required />
                                            <AnimatedInput label="Model" name="model" value={newDevice.model} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} required />
                                            <AnimatedInput label="Serial Number" name="serialNumber" value={newDevice.serialNumber} onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })} required />
                                            <AnimatedInput label="Color" name="color" value={newDevice.color} onChange={e => setNewDevice({ ...newDevice, color: e.target.value })} />
                                            <AnimatedInput label="IMEI (Optional)" name="imei" value={newDevice.imei} onChange={e => setNewDevice({ ...newDevice, imei: e.target.value })} />
                                            <AnimatedInput label="Details" name="details" value={newDevice.details} onChange={e => setNewDevice({ ...newDevice, details: e.target.value })} />
                                            <div className="md:col-span-2 pt-4">
                                                <AnimatedButton type="submit">Complete Registration</AnimatedButton>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Device List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {devices.map(device => (
                                    <Link href={`/device/${device._id}`} key={device._id}>
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{device.brand}</h3>
                                                    <p className="text-gray-600">{device.model}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {device.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 space-y-1">
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
                            className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto"
                        >
                            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
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
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-4">Role: <span className="font-semibold uppercase text-orange-600">{user.role}</span></p>
                                    <p className="text-sm text-gray-500 mb-6">Email: <span className="font-semibold text-gray-900">{user.email}</span></p>
                                    <AnimatedButton type="submit" loading={loadingProfile}>
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
