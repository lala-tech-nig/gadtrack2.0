

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GadTrack - The Anti-Theft Fortress',
  description: 'Secure your devices, verify history, and eliminate theft.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar */}
        <nav className="navbar glass">
          <div className="container nav-container">
            <Link href="/" className="logo text-gradient" style={{ fontSize: '1.5rem' }}>GadTrack</Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/auth" className="btn btn-secondary">Login / Register</Link>
              <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main style={{ minHeight: '80vh' }}>{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Gadtrack. Secure your gadgets.</p>
          </div>
        </footer>

        {/* Toasts */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
