'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import AnimatedButton from './AnimatedButton';
import confetti from 'canvas-confetti';

export default function PaymentModal({ isOpen, onClose, paymentInfo, onSuccess }) {
    const [processing, setProcessing] = useState(false);
    const [reference, setReference] = useState('');

    const handlePayment = async () => {
        setProcessing(true);
        const ref = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        setReference(ref);

        const config = {
            public_key: 'FLWPUBK_TEST-6c7c3767322cb54b7bcf51feeae9f6db-X',
            tx_ref: ref,
            amount: paymentInfo.amount,
            currency: 'NGN',
            payment_options: 'card,mobilemoney,ussd',
            customer: {
                email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'user@gadtrack.com',
                phone_number: '08102909304',
                name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Valued User',
            },
            customizations: {
                title: 'GadTrack Payment',
                description: paymentInfo.type === 'vendor_activation' ? 'Vendor Activation' : 'Service Payment',
                logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
            },
        };

        if (!window.FlutterwaveCheckout) {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.async = true;
            script.onload = () => {
                openFlw(config);
            };
            document.body.appendChild(script);
        } else {
            openFlw(config);
        }
    };

    const openFlw = (config) => {
        const flw = window.FlutterwaveCheckout({
            ...config,
            callback: async function (response) {
                // Verify on backend
                try {
                    const token = localStorage.getItem('token');
                    const verifyRes = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({
                            transaction_id: response.transaction_id,
                            type: paymentInfo.type
                        })
                    });
                    const data = await verifyRes.json();

                    if (verifyRes.ok) {
                        localStorage.setItem('user', JSON.stringify(data.user)); // Update user state

                        // CONFETTI TRIGGER
                        confetti({
                            particleCount: 200,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#ff6600', '#000000', '#10b981']
                        });

                        onSuccess(data.user);
                        onClose();
                    } else {
                        alert(data.msg || 'Payment Verification Failed');
                        setProcessing(false);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Verification Error');
                    setProcessing(false);
                }
            },
            onclose: function () {
                setProcessing(false);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Lighter backdrop
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem',
                    backdropFilter: 'blur(5px)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="card"
                    style={{
                        maxWidth: '500px', width: '100%', padding: '2rem',
                        position: 'relative', backgroundColor: 'white', border: 'none', boxShadow: 'var(--shadow-lg)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', fontSize: '1.5rem',
                            cursor: 'pointer', color: 'var(--text-secondary)'
                        }}
                    >
                        ×
                    </button>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--secondary)' }}>
                        {paymentInfo.type === 'vendor_activation' ? '🚀 Activate Vendor Account' : '💳 Pay to Continue'}
                    </h2>

                    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Amount Due</p>
                        <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                            ₦{paymentInfo.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {paymentInfo.type === 'vendor_activation'
                                ? 'One-time activation fee for unlimited devices'
                                : 'Per additional device this month'}
                        </p>
                    </div>

                    {processing ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem', width: '50px', height: '50px', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <p style={{ color: 'var(--text-main)' }}>Contacting Secure Gateway...</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px dashed var(--success)' }}>
                                <p style={{ fontSize: '0.85rem', color: '#047857' }}>
                                    🔒 <strong>Secure Payment:</strong> Processed via Flutterwave.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={onClose}
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <AnimatedButton
                                    onClick={handlePayment}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Pay securely
                                </AnimatedButton>
                            </div>
                            <p className="text-center" style={{ fontSize: '0.75rem', marginTop: '1rem', color: 'var(--text-light)' }}>
                                Powered by Flutterwave
                            </p>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
