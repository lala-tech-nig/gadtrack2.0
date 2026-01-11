'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'basic'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Authentication failed');
            }

            // Store Token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div style={{ background: '#ffebee', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

                <form onSubmit={onSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '5px' }}>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={onChange} className="input-field" required />
                        </div>
                    )}

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '5px' }}>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={onChange} className="input-field" required />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                        <input type="password" name="password" value={formData.password} onChange={onChange} className="input-field" required />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '5px' }}>Account Type</label>
                            <select name="role" value={formData.role} onChange={onChange} className="input-field">
                                <option value="basic">Basic (Individual)</option>
                                <option value="vendor">Vendor (Business)</option>
                            </select>
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                {formData.role === 'basic' ? 'Basic: Limits to 2 transfers/month.' : 'Vendor: Unlimited access (Subscription needed).'}
                            </small>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', color: 'var(--primary)', fontWeight: 'bold' }}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
