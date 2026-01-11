

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
        <nav className="navbar">
          <div className="container nav-container">
            <Link href="/" className="logo">TraceIt</Link>
            <Link href="/auth" className="btn btn-primary">Login / Register</Link>
          </div>
        </nav>

        {/* Page Content */}
        <main>{children}</main>

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
