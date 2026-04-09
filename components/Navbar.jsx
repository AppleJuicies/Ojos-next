'use client';
import { useState, useEffect, useRef } from 'react';
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
  const navORefs     = useRef([]);
  const navPupilRefs = useRef([]);
  const navPupilPos  = useRef([{ x: 0, y: 0 }, { x: 0, y: 0 }]);

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

  useEffect(() => {
    if (isHome) return;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let rafId;
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const animate = () => {
      const nx = mouse.x / window.innerWidth;
      const xFactor = Math.sin(Math.PI * (nx - 0.5));
      navORefs.current.forEach((o, i) => {
        const pupil = navPupilRefs.current[i];
        if (!o || !pupil) return;
        const rect  = o.getBoundingClientRect();
        const cy    = rect.top + rect.height / 2;
        const maxR  = rect.height * 0.18;
        const targetX = xFactor * maxR;
        const dy      = mouse.y - cy;
        const targetY = Math.sign(dy) * Math.min(Math.abs(dy), maxR);
        navPupilPos.current[i].x += (targetX - navPupilPos.current[i].x) * 0.08;
        navPupilPos.current[i].y += (targetY - navPupilPos.current[i].y) * 0.08;
        const tx = navPupilPos.current[i].x.toFixed(2);
        const ty = navPupilPos.current[i].y.toFixed(2);
        pupil.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
      });
      rafId = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isHome]);

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
            <span className="wordmark__o" ref={el => navORefs.current[0] = el}>O<span className="nav-pupil" ref={el => navPupilRefs.current[0] = el} style={{ background: accent }} /></span>
            <span className="wordmark__j">J</span>
            <span className="wordmark__o" ref={el => navORefs.current[1] = el}>O<span className="nav-pupil" ref={el => navPupilRefs.current[1] = el} style={{ background: accent }} /></span>
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
