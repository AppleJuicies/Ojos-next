'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useProfile, usePendingCount } from '@/context/AuthProvider';
import '@/styles/Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false);
  const [sectionOpacity, setSectionOpacity] = useState(0);
  const pathname = usePathname();
  const isHome   = pathname === '/';
  const user         = useAuth();
  const pendingCount = usePendingCount();
  const profile      = useProfile();
  const accent       = profile?.accentColor || '#002fa7';

  useEffect(() => {
    const onScroll = () => {
      const y  = window.scrollY;
      const vh = window.innerHeight;
      setScrolled(y > 20);
      const p = Math.min(y / vh, 1);
      setSectionOpacity(Math.min(p * 8, 1));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const navLinks = user ? (
    <>
      <Link href="/browse"    className="navbar__link" style={{ color: accent }}>Find</Link>
      <div className="navbar__divider" style={{ background: accent }} />
      <Link href="/dashboard" className="navbar__link navbar__link--badge" style={{ color: accent }}>
        Connect
        {pendingCount > 0 && <span className="nav-badge" style={{ background: accent }}>{pendingCount}</span>}
      </Link>
      <div className="navbar__divider" style={{ background: accent }} />
      <Link href={`/profile/${user.id}`} className="navbar__link" style={{ color: accent }}>Reflect</Link>
    </>
  ) : null;

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar__left">
        {!isHome && (
          <Link href="/" className="navbar__logo" style={{ color: accent }}>
            <span className="wordmark__o">O</span>
            <span className="wordmark__j">J</span>
            <span className="wordmark__o">O</span>
            <span className="wordmark__s">s</span>
          </Link>
        )}
      </div>

      <div className="navbar__center">
        {user && isHome && (
          <div className="navbar__sections" style={{ opacity: sectionOpacity, pointerEvents: sectionOpacity > 0.1 ? 'auto' : 'none' }}>
            {navLinks}
          </div>
        )}
        {user && !isHome && navLinks}
      </div>

      <div className="navbar__right">
        {user === null && (
          <Link href="/sign-in" className="navbar__sign-in">Sign In</Link>
        )}
        {user && (
          <a href="/api/sign-out" className="navbar__sign-in" style={{ color: accent, borderColor: accent }}>Sign Out</a>
        )}
      </div>
    </nav>
  );
}
