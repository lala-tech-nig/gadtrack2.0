"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { triggerConfetti } from '../utils/confetti';
import { playWelcomeMessage } from '../utils/voice';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'basic',
        nin: ''
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || 'Authentication failed');

            // Success Actions
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            triggerConfetti();
            const message = isLogin ? `Welcome back, ${data.user.name}` : `Welcome to Trace It, ${data.user.name}`;
            playWelcomeMessage(message);
            toast.success(message); // Also show visual toast

            setTimeout(() => router.push('/dashboard'), 2000); // Wait for animation
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card"
                style={{ width: '100%', maxWidth: '450px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? 'Sign in to manage your devices' : 'Join the secure network today'}
                    </p>
                </div>

                <form onSubmit={onSubmit}>
                    <AnimatePresence mode='wait'>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <AnimatedInput label="Full Name" name="name" type="text" value={formData.name} onChange={onChange} required />
                                <AnimatedInput label="NIN (National ID)" name="nin" type="text" value={formData.nin} onChange={onChange} required placeholder="e.g. 12345678901" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatedInput label="Email Address" name="email" type="email" value={formData.email} onChange={onChange} required />
                    <AnimatedInput label="Password" name="password" type="password" value={formData.password} onChange={onChange} required />

                    {!isLogin && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="input-group"
                        >
                            <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Account Type</label>
                            <select name="role" value={formData.role} onChange={onChange} className="input-field" style={{ marginBottom: '0.5rem' }}>
                                <option value="basic">Basic (Individual)</option>
                                <option value="vendor">Vendor (Business)</option>
                                <option value="technician">Technician (Repair & Service)</option>
                                <option value="enterprise_admin">Enterprise (Large Scale)</option>
                            </select>
                            <small style={{ display: 'block', marginTop: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {formData.role === 'basic' && 'Basic: 2 free verifications/month.'}
                                {formData.role === 'vendor' && 'Vendor: Unlimited access (Subscription needed).'}
                                {formData.role === 'technician' && 'Technician: Log repairs & unlimited access (Subscription needed).'}
                                {formData.role === 'enterprise_admin' && 'Enterprise: Manage multiple stores & aggregations.'}
                            </small>
                        </motion.div>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                        <AnimatedButton type="submit" loading={loading} className="btn-primary" style={{ width: '100%' }}>
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </AnimatedButton>
                    </div>
                </form>

                <div className="text-center" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', border: 'none' }}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
