'use client';
import { motion } from 'framer-motion';

export default function AnimatedInput({ label, type, name, value, onChange, placeholder, required = false }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <motion.input
                whileFocus={{ scale: 1.01, borderColor: '#FF8C00' }}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="input-field"
            />
        </div>
    );
}
