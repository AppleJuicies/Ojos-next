'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import '@/styles/MeetingDetail.css';

function toDate(ts) { if (!ts) return null; return new Date(ts); }
function fmtDate(ts) { const d = toDate(ts); return d ? d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : ''; }
function fmtTime(ts) { const d = toDate(ts); return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''; }

const MEETING_DOMAINS = ['zoom.us','us02web.zoom.us','us04web.zoom.us','meet.google.com','teams.microsoft.com','teams.live.com','webex.com','meet.webex.com','whereby.com','meet.jit.si','around.co','discord.com','discord.gg'];
function isValidMeetingLink(url) {
  try {
    const p = new URL(url);
    if (p.protocol !== 'https:') return false;
    return MEETING_DOMAINS.some(d => p.hostname === d || p.hostname.endsWith('.' + d));
  } catch { return false; }
}

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', declined: 'Declined', cancelled: 'Cancelled' };

export default function MeetingDetail() {
  const { id: meetingId } = useParams();
  const user     = useAuth();
  const [meeting,    setMeeting]    = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [summary,    setSummary]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [linking,    setLinking]    = useState(false);
  const [linkUrl,    setLinkUrl]    = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!meetingId) return;
    setLoading(true);
    fetch(`/api/meeting/${meetingId}`)
      .then(r => r.json())
      .then(({ meeting: m, profile: p }) => {
        if (m) { setMeeting(m); setSummary(m.summary || ''); }
        if (p) setProfile(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [meetingId]);

  const saveLink = async () => {
    if (!linkUrl.startsWith('http')) return;
    setSavingLink(true);
    await fetch(`/api/meeting/${meetingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zoom_join_url: linkUrl }) });
    setMeeting(prev => ({ ...prev, zoom_join_url: linkUrl }));
    setLinking(false); setSavingLink(false);
  };

  const saveSummary = async () => {
    setSaving(true);
    await fetch(`/api/meeting/${meetingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (user === undefined || loading) return <div className="mdetail-loading">Loading…</div>;
  if (!user)    return <div className="mdetail-loading">Please sign in.</div>;
  if (!meeting) return <div className="mdetail-loading">Meeting not found.</div>;

  const isParticipant = user.id === meeting.host_id || user.id === meeting.requester_id;
  if (!isParticipant) return <div className="mdetail-loading">You're not a participant in this meeting.</div>;

  const otherName = user.id === meeting.host_id ? meeting.requester_name : meeting.host_name;
  const accent    = profile?.accentColor || '#002fa7';
  const nameFont  = profile?.nameFont    || 'Reddit Sans';

  return (
    <main className="mdetail">
      <Link href="/dashboard" className="mdetail__back">← Connections</Link>

      <div className="mdetail__header">
        <div className="mdetail__avatar">
          {profile?.photoURL
            ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${profile.photoURL})`, backgroundSize: `${(profile.photoScale ?? 1) * 100}%`, backgroundPosition: `calc(50% + ${profile.photoOffsetX ?? 0}%) calc(50% + ${profile.photoOffsetY ?? 0}%)`, backgroundRepeat: 'no-repeat', backgroundColor: '#f0f0f0' }} />
            : <div className="mdetail__avatar-placeholder" style={{ background: accent }}>{otherName?.[0]?.toUpperCase()}</div>}
        </div>
        <div className="mdetail__header-body">
          <div className="mdetail__name-row">
            <h1 className="mdetail__name" style={{ color: accent, fontFamily: `'${nameFont}', sans-serif` }}>{otherName}</h1>
            {profile && <Link href={`/profile/${profile.id}`} className="btn btn--ghost btn--sm">View Profile</Link>}
          </div>
          {profile?.headline && <p className="mdetail__headline">{profile.headline}</p>}
          <div className="mdetail__meta">
            <span>{fmtDate(meeting.scheduled_at)}</span>
            <span className="mdetail__dot">·</span>
            <span>{fmtTime(meeting.scheduled_at)}</span>
            <span className="mdetail__dot">·</span>
            <span>{meeting.duration_min} min</span>
            <span className="mdetail__dot">·</span>
            <span className={`mdetail__badge mdetail__badge--${meeting.status}`}>{STATUS_LABEL[meeting.status] || meeting.status}</span>
          </div>
        </div>
      </div>

      {meeting.status === 'confirmed' && (
        <div className="mdetail__link-row">
          {linking ? (
            <div className="mdetail__link-input">
              <input autoFocus placeholder="Paste Zoom, Meet, or Teams link…" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
              {linkUrl && !isValidMeetingLink(linkUrl) && <p className="mdetail__link-error">Paste a valid link from Zoom, Google Meet, Teams, or another supported platform.</p>}
              <div className="mdetail__link-input-actions">
                <button className="btn btn--primary btn--sm" disabled={savingLink || !isValidMeetingLink(linkUrl)} onClick={saveLink}>{savingLink ? 'Saving…' : 'Save'}</button>
                <button className="btn btn--ghost btn--sm" onClick={() => setLinking(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {user.id === meeting.host_id && (
                <button className="btn mdetail__link-btn" onClick={() => setLinking(true)}>{meeting.zoom_join_url ? 'Edit Link' : 'Link Connection'}</button>
              )}
              {meeting.zoom_join_url && (
                <a href={meeting.zoom_join_url} target="_blank" rel="noopener noreferrer" className="btn mdetail__join-btn">Join Meeting</a>
              )}
            </>
          )}
        </div>
      )}

      {meeting.notes && (
        <section className="mdetail__section">
          <p className="mdetail__section-label">Why you're seeing each other</p>
          <p className="mdetail__notes">{meeting.notes}</p>
        </section>
      )}

      <section className="mdetail__section">
        <p className="mdetail__section-label">Connection Summary</p>
        <p className="mdetail__section-hint">Notes from the meeting — visible to both participants.</p>
        <textarea className="mdetail__summary" placeholder="Add notes about what you discussed, follow-ups, or takeaways…" value={summary} onChange={e => setSummary(e.target.value)} rows={6} />
        <div className="mdetail__summary-actions">
          <button className="btn btn--primary btn--sm" onClick={saveSummary} disabled={saving}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}</button>
        </div>
      </section>
    </main>
  );
}
