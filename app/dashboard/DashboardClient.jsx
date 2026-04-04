'use client';
import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth, ProfileContext, RefreshPendingContext } from '@/context/AuthProvider';
import '@/styles/Dashboard.css';

function toDate(ts) {
  if (!ts) return null;
  return new Date(ts);
}

function dayKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmtShortDate(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
}

function fmtTime(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
}

function fmtFullDay(key) {
  return new Date(key + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

const STATUS_COLOR = {
  pending:   '#f59e0b',
  confirmed: '#16a34a',
  completed: '#94a3b8',
  declined:  '#dc2626',
  cancelled: '#dc2626',
};

function blendColors(hexColors) {
  const valid = hexColors.filter(c => /^#[0-9a-f]{6}$/i.test(c));
  if (!valid.length) return null;
  const [r, g, b] = valid
    .map(h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)])
    .reduce(([ar,ag,ab],[r,g,b]) => [ar+r, ag+g, ab+b], [0,0,0])
    .map(v => Math.round(v / valid.length));
  return `rgb(${r},${g},${b})`;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CACHE_TTL = 2 * 60 * 1000;
const cacheKey  = uid => `ojos_dash_v2_${uid}`;

function saveCache(uid, meetings) {
  try { sessionStorage.setItem(cacheKey(uid), JSON.stringify({ data: meetings, ts: Date.now() })); } catch {}
}
function loadCache(uid) {
  try {
    const raw = sessionStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}

function DashSkeleton() {
  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-skel dash-skel--title" />
        <div className="dash-section"><div className="dash-skel dash-skel--label" /><div className="dash-skel dash-skel--row" /><div className="dash-skel dash-skel--row" /></div>
        <div className="dash-section"><div className="dash-skel dash-skel--label" /><div className="dash-skel dash-skel--row" /></div>
        <div className="dash-section"><div className="dash-skel dash-skel--label" /><div className="dash-skel dash-skel--row" /><div className="dash-skel dash-skel--row" /></div>
      </aside>
      <section className="dash-calendar-area"><div className="dash-skel dash-skel--cal" /></section>
    </div>
  );
}

function Calendar({ meetings, selectedDay, onDaySelect, month, onMonthChange }) {
  const year = month.getFullYear();
  const mon  = month.getMonth();
  const byDay = useMemo(() => {
    const map = {};
    meetings.forEach(m => {
      const d = toDate(m.scheduled_at);
      if (!d) return;
      const k = dayKey(d);
      if (!map[k]) map[k] = [];
      map[k].push(m);
    });
    return map;
  }, [meetings]);
  const todayKey    = useMemo(() => dayKey(new Date()), []);
  const firstDow    = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="cal">
      <div className="cal__header">
        <button className="cal__nav" onClick={() => onMonthChange(new Date(year, mon - 1, 1))}>‹</button>
        <span className="cal__month">{MONTH_NAMES[mon]} {year}</span>
        <button className="cal__nav" onClick={() => onMonthChange(new Date(year, mon + 1, 1))}>›</button>
      </div>
      <div className="cal__grid">
        {DAY_LABELS.map(d => <div key={d} className="cal__weekday">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal__cell cal__cell--empty" />;
          const k       = `${year}-${String(mon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayMtgs = byDay[k] || [];
          const blended = dayMtgs.length ? blendColors(dayMtgs.map(m => m.accentColor)) : null;
          return (
            <div key={k}
              className={['cal__cell', k === todayKey ? 'cal__cell--today' : '', k === selectedDay ? 'cal__cell--selected' : '', dayMtgs.length ? 'cal__cell--has-meetings' : ''].filter(Boolean).join(' ')}
              style={blended && k !== selectedDay ? { background: `color-mix(in srgb, ${blended} 12%, white)` } : undefined}
              onClick={() => onDaySelect(k === selectedDay ? null : k)}>
              <span className="cal__day-num">{day}</span>
              {dayMtgs.length > 0 && (
                <div className="cal__indicators">
                  {dayMtgs.slice(0, 3).map((m, idx) => <span key={idx} className="cal__dot" style={{ background: m.accentColor }} />)}
                  {dayMtgs.length > 3 && <span className="cal__dot-overflow">+{dayMtgs.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MeetingRow({ m, onRespond }) {
  const router      = useRouter();
  const isPending   = m.status === 'pending' && m.role === 'host';
  const isConfirmed = m.status === 'confirmed';
  const otherName   = m.role === 'host' ? m.requester_name : m.host_name;
  const [accepting, setAccepting] = useState(false);
  const [zoomUrl,   setZoomUrl]   = useState('');

  return (
    <div className={`dash-row dash-row--${m.status}`}
      onClick={() => !accepting && router.push(`/meeting/${m.id}`)}
      style={{ cursor: accepting ? 'default' : 'pointer' }}>
      <div className="dash-row__top">
        <span className="dash-row__name">{otherName}</span>
        <span className="dash-row__date">{fmtShortDate(m.scheduled_at)}</span>
      </div>
      <p className="dash-row__time">{fmtTime(m.scheduled_at)} · {m.duration_min} min</p>
      {m.notes && <p className="dash-row__notes">{m.notes}</p>}
      <div className="dash-row__actions" onClick={e => e.stopPropagation()}>
        {isPending && !accepting && (
          <>
            <button className="btn btn--primary btn--sm" onClick={() => setAccepting(true)}>Accept</button>
            <button className="btn btn--ghost btn--sm"   onClick={() => onRespond(m.id, 'declined')}>Decline</button>
          </>
        )}
        {isPending && accepting && (
          <div className="dash-zoom-input">
            <input autoFocus placeholder="Paste your Zoom link…" value={zoomUrl} onChange={e => setZoomUrl(e.target.value)} />
            <button className="btn btn--primary btn--sm" disabled={!zoomUrl.startsWith('http')} onClick={() => onRespond(m.id, 'confirmed', zoomUrl)}>Confirm</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setAccepting(false)}>Cancel</button>
          </div>
        )}
        {isConfirmed && m.zoom_join_url && <a href={m.zoom_join_url} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm">Join</a>}
        {m.status === 'pending'   && m.role === 'requester' && <span className="badge badge--pending">Awaiting</span>}
        {m.status === 'declined'  && <span className="badge badge--declined">Declined</span>}
        {m.status === 'cancelled' && <span className="badge badge--declined">Cancelled</span>}
        {m.status === 'completed' && <span className="badge badge--done">Done</span>}
      </div>
    </div>
  );
}

function DayActions({ m, onRespond }) {
  const isPending   = m.status === 'pending' && m.role === 'host';
  const isConfirmed = m.status === 'confirmed';
  const [accepting, setAccepting] = useState(false);
  const [zoomUrl,   setZoomUrl]   = useState('');
  if (isPending && !accepting) return (
    <div className="dash-day-meeting__actions" onClick={e => e.stopPropagation()}>
      <button className="btn btn--primary btn--sm" onClick={() => setAccepting(true)}>Accept</button>
      <button className="btn btn--ghost btn--sm"   onClick={() => onRespond(m.id, 'declined')}>Decline</button>
    </div>
  );
  if (isPending && accepting) return (
    <div className="dash-zoom-input" onClick={e => e.stopPropagation()}>
      <input autoFocus placeholder="Paste your Zoom link…" value={zoomUrl} onChange={e => setZoomUrl(e.target.value)} />
      <button className="btn btn--primary btn--sm" disabled={!zoomUrl.startsWith('http')} onClick={() => onRespond(m.id, 'confirmed', zoomUrl)}>Confirm</button>
      <button className="btn btn--ghost btn--sm" onClick={() => setAccepting(false)}>Cancel</button>
    </div>
  );
  if (isConfirmed && m.zoom_join_url) return (
    <div className="dash-day-meeting__actions" onClick={e => e.stopPropagation()}>
      <a href={m.zoom_join_url} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm">Join</a>
    </div>
  );
  return null;
}

function DayDetail({ selectedDay, meetings, onRespond }) {
  const router = useRouter();
  if (!selectedDay) return null;
  return (
    <div className="dash-day-detail"
      onClick={() => meetings.length > 0 && router.push(`/meeting/${meetings[0].id}`)}
      style={{ cursor: meetings.length > 0 ? 'pointer' : 'default' }}>
      <p className="dash-day-detail__heading">{fmtFullDay(selectedDay)}</p>
      {meetings.length === 0 ? (
        <p className="dash-day-detail__empty">No meetings on this day.</p>
      ) : (
        <div className="dash-day-detail__list">
          {meetings.map(m => {
            const otherName = m.role === 'host' ? m.requester_name : m.host_name;
            return (
              <div key={m.id} className="dash-day-meeting"
                onClick={e => { e.stopPropagation(); router.push(`/meeting/${m.id}`); }}
                style={{ cursor: 'pointer' }}>
                <span className="dash-day-meeting__dot" style={{ background: m.accentColor || STATUS_COLOR[m.status] }} />
                <div className="dash-day-meeting__body">
                  <p className="dash-day-meeting__name">{otherName}</p>
                  <p className="dash-day-meeting__meta">{fmtTime(m.scheduled_at)} · {m.duration_min} min</p>
                  {m.notes && <p className="dash-day-meeting__notes">{m.notes}</p>}
                  <DayActions m={m} onRespond={onRespond} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const user           = useAuth();
  const contextProfile = useContext(ProfileContext);
  const refreshPending = useContext(RefreshPendingContext);
  const hasProfile     = contextProfile === undefined ? null : contextProfile !== null;
  const [meetings,    setMeetings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [calMonth,    setCalMonth]    = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState(null);

  const uid      = user?.id;
  const supabase = createClient();

  const fetchMeetings = useCallback(async (signal) => {
    if (!uid) return;
    try {
      const [{ data: asHost }, { data: asRequester }] = await Promise.all([
        supabase.from('meetings').select('*').eq('host_id',      uid).abortSignal(signal),
        supabase.from('meetings').select('*').eq('requester_id', uid).abortSignal(signal),
      ]);
      const all = [
        ...(asHost      || []).map(m => ({ ...m, role: 'host'      })),
        ...(asRequester || []).map(m => ({ ...m, role: 'requester' })),
      ].sort((a, b) => new Date(a.scheduled_at ?? 0) - new Date(b.scheduled_at ?? 0));

      // Fetch names + accent colors for all other users in one query
      const otherIds = [...new Set(all.map(m => m.role === 'host' ? m.requester_id : m.host_id).filter(Boolean))];
      const hostIds  = [...new Set(all.filter(m => m.role === 'requester').map(m => m.host_id).filter(Boolean))];
      const allIds   = [...new Set([...otherIds, ...hostIds])];

      let profileMap = {};
      if (allIds.length) {
        const { data: profiles } = await supabase.from('users').select('id, name, "accentColor"').in('id', allIds);
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
      }

      const withData = all.map(m => {
        const otherId = m.role === 'host' ? m.requester_id : m.host_id;
        const p = profileMap[otherId] || {};
        return {
          ...m,
          host_name:      profileMap[m.host_id]?.name      || m.host_id      || 'Unknown',
          requester_name: profileMap[m.requester_id]?.name || m.requester_id || 'Unknown',
          accentColor:    p.accentColor || STATUS_COLOR[m.status] || '#002fa7',
        };
      });

      setMeetings(withData);
      setLoading(false);
      saveCache(uid, withData);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      setLoading(false);
    }
  }, [uid]); // eslint-disable-line

  useEffect(() => {
    if (!uid) return;
    const cached = loadCache(uid);
    if (cached) { setMeetings(cached); } else { setLoading(true); }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    fetchMeetings(controller.signal).finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [uid, fetchMeetings]);

  const respond = async (id, status, zoomUrl = '') => {
    const update = { status };
    if (zoomUrl) update.zoom_join_url = zoomUrl;
    await supabase.from('meetings').update(update).eq('id', id);
    try { sessionStorage.removeItem(cacheKey(uid)); } catch {}
    fetchMeetings();
    refreshPending();
  };

  const tabMeetings = useMemo(() => {
    const now = new Date();
    const isPast = m => {
      const d = toDate(m.scheduled_at);
      return ['completed', 'declined', 'cancelled'].includes(m.status) || (d && d < now);
    };
    return {
      present: meetings.filter(m => !isPast(m) && m.status === 'pending'),
      future:  meetings.filter(m => !isPast(m) && m.status === 'confirmed'),
      past:    meetings.filter(m => isPast(m)),
    };
  }, [meetings]);

  const dayMeetings = useMemo(() => {
    if (!selectedDay) return [];
    return meetings.filter(m => { const d = toDate(m.scheduled_at); return d ? dayKey(d) === selectedDay : false; });
  }, [meetings, selectedDay]);

  if (user === null) return <div className="dash-empty"><p>Sign in to view your connections.</p></div>;

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <h1 className="dash-sidebar__title">Your connections</h1>
        {hasProfile === false && (
          <div className="dash-banner">
            <p>Add your profile so people can find and connect with you.</p>
            <Link href="/edit-profile" className="btn btn--primary btn--sm">Create Profile</Link>
          </div>
        )}
        {[{ id: 'present', label: 'Present' }, { id: 'future', label: 'Future' }, { id: 'past', label: 'Past' }].map(({ id, label }) => (
          <div key={id} className="dash-section">
            <p className="dash-section__label">{label}</p>
            {loading
              ? <div className="dash-skel dash-skel--row" />
              : tabMeetings[id].length === 0
                ? <p className="dash-empty-tab">No {label.toLowerCase()} meetings.</p>
                : tabMeetings[id].map(m => <MeetingRow key={m.id} m={m} onRespond={respond} />)
            }
          </div>
        ))}
      </aside>
      <section className="dash-calendar-area">
        <Calendar meetings={meetings} selectedDay={selectedDay} onDaySelect={setSelectedDay} month={calMonth} onMonthChange={setCalMonth} />
        <DayDetail selectedDay={selectedDay} meetings={dayMeetings} onRespond={respond} />
      </section>
    </div>
  );
}
