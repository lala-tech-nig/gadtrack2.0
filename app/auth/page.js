'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedInput from '../../components/AnimatedInput';
import AnimatedButton from '../../components/AnimatedButton';
import { triggerConfetti } from '../../utils/confetti';
import { playWelcomeMessage } from '../../utils/voice';

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
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 card p-8 rounded-2xl shadow-xl bg-white"
            >
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isLogin ? 'Sign in to manage your devices' : 'Join the secure network today'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    <AnimatePresence mode='wait'>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
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
                            <label className="block mb-2 font-semibold text-gray-700">Account Type</label>
                            <select name="role" value={formData.role} onChange={onChange} className="input-field">
                                <option value="basic">Basic (Individual)</option>
                                <option value="vendor">Vendor (Business)</option>
                            </select>
                            <small className="block mt-2 text-xs text-gray-500">
                                {formData.role === 'basic' ? 'Basic: 2 free verifications/month.' : 'Vendor: Unlimited access (Subscription needed).'}
                            </small>
                        </motion.div>
                    )}

                    <AnimatedButton type="submit" loading={loading} className="w-full flex justify-center">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </AnimatedButton>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-orange-600 hover:text-orange-500 font-medium transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
