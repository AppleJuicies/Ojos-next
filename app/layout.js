import { Inter, Reddit_Sans, Fraunces, DM_Mono, VT323 } from 'next/font/google';
import AuthProvider from '@/context/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const redditSans = Reddit_Sans({ subsets: ['latin'], variable: '--font-reddit-sans', weight: ['400','600','700'], style: ['normal','italic'], display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', weight: ['300','400','700'], style: ['normal','italic'], display: 'swap' });
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-dm-mono', weight: ['300','400','500'], display: 'swap' });
const vt323  = VT323({ subsets: ['latin'], variable: '--font-vt323', weight: ['400'], display: 'swap' });

export const metadata = {
  title: 'OJOs — see eye to eye',
  description: 'Find professionals, book real 1-on-1 conversations, and build connections that matter.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${redditSans.variable} ${fraunces.variable} ${dmMono.variable} ${vt323.variable}`}>
      <body>
        <AuthProvider>
          <div className="page-layout">
            <Navbar />
            <div className="page-content">
              {children}
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
