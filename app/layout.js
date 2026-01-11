import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Gadtrack - Anti-Theft Gadget Platform',
  description: 'Track, Secure, and Transfer your gadgets safely in Africa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="container header">
          <Link href="/" className="logo">GADTRACK</Link>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid #eee' }}>Dashboard</Link>
            <Link href="/auth" className="btn btn-primary">Login / Register</Link>
          </div>
        </nav>
        <main>
          {children}
        </main>
        <footer style={{ textAlign: 'center', padding: '40px', marginTop: '40px', background: '#f5f5f5' }}>
          <p>&copy; {new Date().getFullYear()} Gadtrack. Secure your gadgets.</p>
        </footer>
      </body>
    </html>
  );
}
