import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TraceIt - Anti-Theft Platform',
  description: 'Track and secure your devices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Link href="/auth" className="btn btn-primary">Login / Register</Link>
    </div>
        </nav >
        <main>
          {children}
        </main>
        <footer style={{ textAlign: 'center', padding: '40px', marginTop: '40px', background: '#f5f5f5' }}>
          <p>&copy; {new Date().getFullYear()} Gadtrack. Secure your gadgets.</p>
        </footer>
      </body >
    </html >
  );
}
