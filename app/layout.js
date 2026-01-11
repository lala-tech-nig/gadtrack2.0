"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TraceIt - Anti-Theft Platform',
  description: 'Track and secure your devices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar */}
        <nav className="p-4 border-b flex justify-between items-center">
          <h1 className="font-bold text-lg">TraceIt</h1>

          <Link href="/auth" className="btn btn-primary">
            Login / Register
          </Link>
        </nav>

        {/* Page Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '40px',
            marginTop: '40px',
            background: '#f5f5f5',
          }}
        >
          <p>&copy; {new Date().getFullYear()} Gadtrack. Secure your gadgets.</p>
        </footer>

        {/* Toasts */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
