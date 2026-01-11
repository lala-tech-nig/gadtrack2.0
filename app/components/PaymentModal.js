'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import AnimatedButton from './AnimatedButton';

export default function PaymentModal({ isOpen, onClose, paymentInfo, onSuccess }) {
    const [processing, setProcessing] = useState(false);
    const [reference, setReference] = useState('');

    const handlePayment = async () => {
        setProcessing(true);

        // Generate mock reference
        const ref = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setReference(ref);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    reference: ref,
                    type: paymentInfo.type,
                    amount: paymentInfo.amount
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Update local storage
                localStorage.setItem('user', JSON.stringify(data.user));

                setTimeout(() => {
                    setProcessing(false);
                    onSuccess(data.user);
                    onClose();
                }, 1500);
            } else {
                throw new Error(data.msg || 'Payment failed');
            }
        } catch (err) {
            alert(err.message);
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="card"
                    style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '2rem',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        ×
                    </button>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
                        {paymentInfo.type === 'vendor_activation' ? '🚀 Activate Vendor Account' : '💳 Pay to Continue'}
                    </h2>

                    <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Amount Due</p>
                        <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                            ₦{paymentInfo.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                            {paymentInfo.type === 'vendor_activation'
                                ? 'One-time activation fee for unlimited devices'
                                : 'Per additional device this month'}
                        </p>
                    </div>

                    {processing ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem', width: '50px', height: '50px', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <p style={{ color: 'var(--text-secondary)' }}>Processing payment...</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Ref: {reference}</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid #FCD34D' }}>
                                <p style={{ fontSize: '0.85rem', color: '#92400E' }}>
                                    ⚠️ <strong>Mock Payment:</strong> This is a demonstration. In production, integrate with Paystack or Flutterwave.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={onClose}
                                    className="btn"
                                    style={{ flex: 1, backgroundColor: 'var(--surface)', color: 'var(--text-main)' }}
                                >
                                    Cancel
                                </button>
                                <AnimatedButton
                                    onClick={handlePayment}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Pay Now
                                </AnimatedButton>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
