import { displayFont, inter, fraunces, dmMono } from '@/lib/fonts';
import AuthProvider from '@/context/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata = {
  title: 'OJOs — see eye to eye',
  description: 'Find professionals, book real 1-on-1 conversations, and build connections that matter.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${inter.variable} ${fraunces.variable} ${dmMono.variable}`}>
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
