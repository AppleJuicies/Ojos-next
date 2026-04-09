'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useAuth, useProfile, usePendingCount } from '@/context/AuthProvider';
import '@/styles/Home.css';

function lerp(a, b, t)  { return a + (b - a) * t; }
function easeInOut(t)    { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

const STEPS = [
  { n: 1, color: '#002fa7', label: 'Build your identity',    text: "OJOs is a platform where professionals offer their time for real 1-on-1 conversations — and people who want to learn from them can find and book those sessions. Start by creating your profile. Personalize yourself, write a headline that captures where you've been and what you're good at, and fill in your experience and education. This becomes your public card — how people discover you, understand what you bring, and decide whether you're the right person to talk to." },
  { n: 2, color: '#7c3aed', label: 'Be found',               text: "Once your profile is live, you're searchable. Anyone on OJOs can look you up by name, job title, company, or area of expertise. If you're a founder, a designer, an investor, an engineer — whoever you are and whatever you've built — your card is out there for the people who need your perspective most." },
  { n: 3, color: '#059669', label: 'Request a connection',   text: "Found someone whose career path you want to understand? Who's been through something you're about to face? Browse their full profile — their background, their experience, their story — then send a meeting request. You'll be asked to write a short note explaining who you are, what you're working through, and why you want to talk. That context isn't optional — it's what separates a real conversation from a cold DM." },
  { n: 4, color: '#d97706', label: 'Accept & link',          text: "The request lands in the expert's dashboard. They can read exactly who's asking and why, then choose to accept or decline. If they accept, they paste in a meeting link — Zoom, Google Meet, Teams, a phone number, whatever they prefer. Both sides get notified. The meeting is now on both calendars, with all the context already attached." },
  { n: 5, color: '#c026d3', label: 'See eye to eye',         text: "This is the good part. Two people, a shared context, and a conversation that actually goes somewhere. You already know why you're there — so skip the small talk and get into it. Ask the questions you've been sitting on. Share the things you've learned. These calls tend to be the kind both sides walk away from energized." },
  { n: 6, color: '#0891b2', label: 'Keep the connection',    text: "After the meeting wraps, both sides can write a Connection Summary — what was discussed, key takeaways, anything worth following up on. It stays attached to the connection on your Connections page, so six months from now you can pull it up and remember exactly what was said. The relationship doesn't end when the call does." },
];

const SWATCH_COLORS = ['#002fa7', '#c026d3', '#059669', '#d97706'];
const CURSOR_POS    = [[306, 224], [328, 224], [350, 224], [372, 224]];
const TEXT1 = "Built 0→1 twice. Currently figuring out what's next. Open to conversations about product, growth, and making decisions without enough data.";
const TEXT3 = "I've been leading a design team for 6 months and struggling with the IC → manager transition. Would love 30 minutes to hear how you approached it…";
const TEXT6 = "Discussed the IC → manager transition. Sarah's key insight: the job changes completely — you're now responsible for output you don't produce yourself. Follow up: she's sharing a framework she used in her first 90 days.\n\nAction: set up a second call in 3 weeks.";

function StepVisual({ step }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [text1, setText1] = useState('');
  const [text3, setText3] = useState('');
  const [text6, setText6] = useState('');
  const [accepted4, setAccepted4] = useState(false);
  const acceptRef = useRef(null);

  useEffect(() => {
    if (step !== 4) { setAccepted4(false); return; }
    const id = setTimeout(() => handleAccept(), 1000);
    return () => clearTimeout(id);
  }, [step]); // eslint-disable-line

  const handleAccept = useCallback(() => {
    if (accepted4) return;
    setAccepted4(true);
    const btn = acceptRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      confetti({
        particleCount: 120, spread: 70,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
        startVelocity: 32, scalar: 0.9,
        colors: ['#002fa7', '#c026d3', '#059669', '#d97706', '#0891b2', '#7c3aed'],
      });
    }
    setTimeout(() => setAccepted4(false), 3500);
  }, [accepted4]);

  useEffect(() => {
    if (step !== 1) { setText1(''); return; }
    let i = 0;
    const id = setInterval(() => { i++; setText1(TEXT1.slice(0, i)); if (i >= TEXT1.length) clearInterval(id); }, 28);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;
    const id = setInterval(() => setColorIdx(i => (i + 1) % 4), 1600);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 3) { setText3(''); return; }
    let i = 0;
    const id = setInterval(() => { i++; setText3(TEXT3.slice(0, i)); if (i >= TEXT3.length) clearInterval(id); }, 26);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 6) { setText6(''); return; }
    let i = 0;
    const id = setInterval(() => { i++; setText6(TEXT6.slice(0, i)); if (i >= TEXT6.length) clearInterval(id); }, 22);
    return () => clearInterval(id);
  }, [step]);

  const cardColor = SWATCH_COLORS[colorIdx];
  const [cx, cy]  = CURSOR_POS[colorIdx];

  return (
    <div className="how__screen">
      <div className={`sv sv--1 ${step === 1 ? 'sv--active' : ''}`}>
        <div className="sv__label">Card Preview</div>
        <div className="sv__browse-card">
          <div className="sv__card-header">
            <div className="sv__avatar" style={{ background: cardColor, transition: 'background 0.7s ease' }}>J</div>
            <div className="sv__card-name" style={{ color: cardColor, transition: 'color 0.7s ease', fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>Jesus H.</div>
          </div>
          <div className="sv__card-headline">Head of Product · Series B startup</div>
          <div className="sv__card-bio">
            {text1}
            {text1.length < TEXT1.length && <span className="sv__blink-cursor">|</span>}
          </div>
        </div>
        <div className="sv__controls">
          <div className="sv__control-row">
            <span className="sv__control-label">Perspective</span>
            <div className="sv__swatches">
              {SWATCH_COLORS.map((c, i) => (
                <div key={c} className={`sv__swatch ${colorIdx === i ? 'sv__swatch--active' : ''}`}
                  style={{ background: c, ...(colorIdx === i ? { outlineColor: c } : {}) }} />
              ))}
            </div>
          </div>
          <div className="sv__control-row">
            <span className="sv__control-label">Personality</span>
            <div className="sv__font-pill">Fraunces ▾</div>
          </div>
        </div>
        <div className="sv__cursor" style={{ transform: `translate(${cx}px, ${cy}px)` }} />
      </div>

      <div className={`sv sv--2 ${step === 2 ? 'sv--active' : ''}`}>
        <div className="sv__search-bar">
          <span className="sv__search-icon">⌕</span>
          <span className="sv__search-placeholder">Search by name, role, or company…</span>
        </div>
        <div className="sv__mini-grid">
          {[
            { name: 'Sarah C.', role: 'Design Lead',  color: '#c026d3', about: 'Scaled design orgs from 3 to 40. Ex-Figma, now Airbnb.' },
            { name: 'Marcus T.',role: 'Founder, 2x',  color: '#059669', about: 'Built and sold two B2B companies. Open to founder convos.' },
            { name: 'Priya N.', role: 'VC Partner',   color: '#d97706', about: 'Early-stage consumer & fintech. 12 portfolio exits.' },
            { name: 'Alex R.',  role: 'Staff Eng.',   color: '#002fa7', about: '6 years infra at Stripe. Distributed systems, hard problems.' },
          ].map(p => (
            <div key={p.name} className="sv__mini-card">
              <div className="sv__mini-avatar" style={{ background: p.color }}>{p.name[0]}</div>
              <div className="sv__mini-name"  style={{ color: p.color }}>{p.name}</div>
              <div className="sv__mini-role">{p.role}</div>
              <div className="sv__mini-about">{p.about}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`sv sv--3 ${step === 3 ? 'sv--active' : ''}`}>
        <div className="sv__profile-strip">
          <div className="sv__avatar sv__avatar--lg" style={{ background: '#c026d3' }}>S</div>
          <div>
            <div className="sv__profile-name" style={{ color: '#c026d3' }}>Sarah C.</div>
            <div className="sv__profile-role">Design Lead · Airbnb</div>
          </div>
        </div>
        <div className="sv__form">
          <div className="sv__form-label">Why do you want to meet?</div>
          <div className="sv__textarea">
            {text3}
            {text3.length < TEXT3.length && <span className="sv__blink-cursor">|</span>}
          </div>
          <div className="sv__form-row">
            <div className="sv__form-pill">30 min</div>
            <div className="sv__form-pill">Apr 18 · 2pm</div>
          </div>
          <div className="sv__send-btn">Send Request</div>
        </div>
      </div>

      <div className={`sv sv--4 ${step === 4 ? 'sv--active' : ''}`}>
        <div className={`sv__dash-card ${accepted4 ? 'sv__dash-card--confirmed' : 'sv__dash-card--pending'}`}>
          <div className="sv__dash-top">
            <span className="sv__dash-name">Alex R.</span>
            <span className="sv__dash-date">Apr 18</span>
          </div>
          <div className="sv__dash-time">2:00 PM · 30 min</div>
          <div className="sv__dash-note">"I've been leading a design team for 6 months and…"</div>
          {accepted4 ? (
            <div className="sv__dash-confirmed">
              <span className="sv__dash-check">✓</span>
              <span className="sv__dash-confirmed-text">Confirmed — add a meeting link</span>
            </div>
          ) : (
            <div className="sv__dash-actions">
              <div ref={acceptRef} className="sv__dash-btn sv__dash-btn--primary sv__dash-btn--pulse" onClick={handleAccept} style={{ cursor: 'pointer' }}>Accept</div>
              <div className="sv__dash-btn sv__dash-btn--ghost">Decline</div>
            </div>
          )}
        </div>
        <div className={`sv__link-btn ${accepted4 ? 'sv__link-btn--active' : ''}`}>
          {accepted4 ? 'Add Meeting Link ↗' : 'Link Connection'}
        </div>
      </div>

      <div className={`sv sv--5 ${step === 5 ? 'sv--active' : ''}`}>
        <div className="sv__meet-header">
          <span className="sv__meet-back">← Connections</span>
          <span className="sv__meet-title">Meeting with Sarah C.</span>
        </div>
        <div className="sv__meet-room">
          <div className="sv__meet-avatar sv__meet-avatar--ping" style={{ background: '#c026d3' }}>S</div>
          <div className="sv__meet-avatar sv__meet-avatar--you sv__meet-avatar--ping" style={{ background: '#002fa7', animationDelay: '0.4s' }}>J</div>
        </div>
        <div className="sv__meet-meta">Apr 18 · 2:00 PM · 30 min</div>
        <div className="sv__join-pill">Join Meeting ↗</div>
      </div>

      <div className={`sv sv--6 ${step === 6 ? 'sv--active' : ''}`}>
        <div className="sv__summary-label">Connection Summary</div>
        <div className="sv__summary-hint">Notes from the meeting — visible to both participants.</div>
        <div className="sv__summary-box">
          {text6.split('\n\n').map((para, i, arr) => (
            <span key={i}>{para}{i < arr.length - 1 && <><br/><br/></>}</span>
          ))}
          {text6.length < TEXT6.length && <span className="sv__blink-cursor">|</span>}
        </div>
        <div className="sv__save-btn">Save</div>
      </div>
    </div>
  );
}

export default function Home() {
  const user         = useAuth();
  const pendingCount = usePendingCount();
  const profile      = useProfile();
  const accent       = profile?.accentColor || '#002fa7';
  const wordmarkRef  = useRef(null);
  const taglineRef   = useRef(null);
  const bubblesRef   = useRef(null);
  const scrollHintRef = useRef(null);
  const initialSize  = useRef(null);
  const oRefs        = useRef([]);
  const pupilRefs    = useRef([]);
  const pupilPos     = useRef([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  const [activeStep, setActiveStep] = useState(1);
  const stepRefs = useRef([]);

  useEffect(() => {
    const wordmark   = wordmarkRef.current;
    const tagline    = taglineRef.current;
    const bubbles    = bubblesRef.current;
    const scrollHint = scrollHintRef.current;
    if (!wordmark) return;

    const measure = () => {
      wordmark.style.transform = 'none';
      const w = wordmark.offsetWidth;
      const h = wordmark.offsetHeight;
      initialSize.current = { w, h };
      const OFFSET = 60;
      const taglineTop = window.innerHeight / 2 + h / 2 + 24 - OFFSET;
      if (tagline) tagline.style.top = taglineTop + 'px';
      if (bubbles && tagline) {
        const rawTop = taglineTop + tagline.offsetHeight + 28;
        const maxTop = window.innerHeight - 140;
        bubbles.style.top = Math.min(rawTop, maxTop) + 'px';
      }
    };

    const update = () => {
      if (!initialSize.current) return;
      const { w, h } = initialSize.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const NAV_LEFT    = 40;
      const NAV_CENTER_Y = 32;
      const TARGET_H    = 28;
      const targetScale = TARGET_H / h;
      const OFFSET = 60;
      const startX = vw / 2 - w / 2;
      const startY = vh / 2 - h / 2 - OFFSET;
      const endX   = NAV_LEFT;
      const endY   = NAV_CENTER_Y - (h * targetScale) / 2;
      const p  = Math.min(window.scrollY / vh, 1);
      const ep = easeInOut(p);
      const tx    = lerp(startX, endX, ep);
      const ty    = lerp(startY, endY, ep);
      const scale = lerp(1, targetScale, ep);
      wordmark.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      const fadeOut = Math.max(0, 1 - p * 8);
      if (tagline)    tagline.style.opacity    = fadeOut;
      if (bubbles)    bubbles.style.opacity    = fadeOut;
      if (scrollHint) scrollHint.style.opacity = Math.max(0, 1 - p * 10);
    };

    const onResize = () => { measure(); update(); };
    measure(); update();
    window.addEventListener('scroll', update,   { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let rafId;

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    const animate = () => {
      const nx = mouse.x / window.innerWidth; // 0→1 across screen

      // sin(π·(nx − 0.5)): inflection at center (0), ±1 at edges, smooth everywhere
      const xFactor = Math.sin(Math.PI * (nx - 0.5));

      const PUPIL_LERP = 0.06;
      oRefs.current.forEach((o, i) => {
        const pupil = pupilRefs.current[i];
        if (!o || !pupil) return;
        const rect  = o.getBoundingClientRect();
        const cy    = rect.top + rect.height / 2;
        const maxR  = rect.height * 0.13;
        const targetX = xFactor * maxR;
        const dy      = mouse.y - cy;
        const targetY = Math.sign(dy) * Math.min(Math.abs(dy), maxR);
        pupilPos.current[i].x += (targetX - pupilPos.current[i].x) * PUPIL_LERP;
        pupilPos.current[i].y += (targetY - pupilPos.current[i].y) * PUPIL_LERP;
        const tx = pupilPos.current[i].x.toFixed(2);
        const ty = pupilPos.current[i].y.toFixed(2);
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
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const trigger = window.innerHeight * 0.42;
      const slop = 80;
      let found = null;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const { top, bottom } = el.getBoundingClientRect();
        if (top - slop <= trigger && bottom + slop > trigger) found = i + 1;
      });
      if (found !== null) setActiveStep(found);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main>
      <div className="hero" />

      <div className="hero__wordmark-repel">
        <h1 className="hero__wordmark" ref={wordmarkRef} style={{ color: accent }}>
          <span className="wordmark__o" ref={el => oRefs.current[0] = el}>O<span className="wordmark__pupil" ref={el => pupilRefs.current[0] = el} style={{ background: accent }} /></span>
          <span className="wordmark__j">J</span>
          <span className="wordmark__o" ref={el => oRefs.current[1] = el}>O<span className="wordmark__pupil" ref={el => pupilRefs.current[1] = el} style={{ background: accent }} /></span>
          <span className="wordmark__s">s</span>
        </h1>
      </div>

      <p className="hero__tagline" ref={taglineRef}>see eye to eye</p>

      <div className="hero__bubbles" ref={bubblesRef}>
        {user ? (
          <>
            <Link href="/browse"    className="bubble" style={{ color: accent, borderColor: accent }}>Find</Link>
            <div className="bubble__divider" style={{ background: accent }} />
            <Link href="/dashboard" className="bubble bubble--badge" style={{ color: accent, borderColor: accent }}>
              Connect
              {pendingCount > 0 && <span className="bubble-badge" style={{ background: accent }}>{pendingCount}</span>}
            </Link>
            <div className="bubble__divider" style={{ background: accent }} />
            <Link href={`/profile/${user.id}`} className="bubble" style={{ color: accent, borderColor: accent }}>Reflect</Link>
          </>
        ) : (
          <Link href="/sign-in" className="bubble">Sign In</Link>
        )}
      </div>

      <div className="hero__scroll-hint" ref={scrollHintRef}>
        <span>scroll</span>
        <div className="scroll-line" />
      </div>

      <section id="why" className="section section--about">
        <p className="section__overline">the idea</p>
        <h2 className="section__title">why</h2>
        <div className="about__col-labels">
          <span>intention</span>
          <span>Execution</span>
        </div>
        <div className="about__grid">
          <div className="about__col">
            <p className="section__body">
              OJOs was built on a simple frustration: most professional interactions start blind.
              You reach out to someone without knowing what they're open to, whether they're the
              right person to help you, or what either of you actually gets out of the meeting.
            </p>
          </div>
          <div className="about__col">
            <p className="section__body">
              Since these interactions already carry an implicit transaction, making that explicit
              removes the awkwardness and replaces it with clarity. Someone wants to learn how you
              got where you are — and you're open to that conversation. OJOs just makes the terms clear.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="section section--how">
        <div className="how__intro">
          <p className="section__overline">the process</p>
          <h2 className="section__title">how it works</h2>
        </div>
        <div className="how__scroll">
          <div className="how__steps">
            {STEPS.map((s, i) => {
              const active = activeStep === s.n;
              return (
                <div key={s.n} className={`how__step ${active ? 'how__step--active' : ''}`}
                  ref={el => stepRefs.current[i] = el}
                  style={active ? { borderLeftColor: s.color } : {}}>
                  <span className="step__number" style={active ? { color: s.color } : {}}>{s.n}</span>
                  <div className="step__body">
                    <p className="step__label" style={active ? { color: s.color } : {}}>{s.label}</p>
                    <p className="step__text">{s.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="how__visual-wrap">
            <StepVisual step={activeStep} />
          </div>
        </div>
      </section>

      <section id="what" className="section section--what">
        <p className="section__overline">the value</p>
        <h2 className="section__title">what both sides earn</h2>
        <div className="value__grid">
          <div className="value__card">
            <p className="value__role">if you're the expert</p>
            <p className="value__headline">Your time already has value. OJOs makes that official.</p>
            <p className="section__body">You've built something — a career, a skill set, a perspective that took years to develop. OJOs gives you a simple way to share that with people who genuinely want to learn from it.</p>
            <ul className="value__list">
              <li>Control who you meet and when</li>
              <li>Show up to every conversation with full context — they've already told you why they want to talk</li>
              <li>Build a public-facing identity that represents how you actually want to be seen</li>
              <li>Keep a record of every connection you've made</li>
            </ul>
          </div>
          <div className="value__card">
            <p className="value__role">if you're seeking</p>
            <p className="value__headline">Skip the cold message. Get the real conversation.</p>
            <p className="section__body">The best advice doesn't come from articles or podcasts. It comes from someone who's already been where you're trying to go. OJOs puts those people in front of you — and makes it easy to reach out without feeling like you're asking for a favor.</p>
            <ul className="value__list">
              <li>Browse real people with real backgrounds, not job titles</li>
              <li>Send a request with context so the expert knows you're serious</li>
              <li>Get a 1-on-1 session — not a template, not a form, a real conversation</li>
              <li>Walk away with notes that live on your Connections page</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
