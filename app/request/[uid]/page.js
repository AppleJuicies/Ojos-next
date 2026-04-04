'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import '@/styles/Profile.css';

function genRoomName() { return 'ojos-' + Math.random().toString(36).slice(2, 10); }

export default function RequestMeeting() {
  const { uid }  = useParams();
  const user     = useAuth();
  const router   = useRouter();
  const [host,       setHost]       = useState(null);
  const [form,       setForm]       = useState({ date: '', time: '', duration: '30', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${uid}`)
      .then(r => r.json())
      .then(({ profile }) => { if (profile) setHost(profile); });
  }, [uid]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user || !host) return;
    setSubmitting(true);
    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    await supabase.from('meetings').insert({
      requester_id:    user.id,
      requester_name:  user.user_metadata?.full_name || user.email,
      requester_email: user.email,
      host_id:         uid,
      host_name:       host.name,
      host_email:      host.email,
      status:          'pending',
      scheduled_at:    scheduledAt,
      duration_min:    Number(form.duration),
      is_free:         host.is_free,
      price:           host.is_free ? null : host.hourly_rate,
      payment_status:  host.is_free ? 'free' : 'pending',
      notes:           form.notes,
      jitsi_room:      genRoomName(),
      created_at:      new Date().toISOString(),
    });
    setSubmitting(false);
    router.push('/dashboard');
  };

  if (!user) return <div className="page-loading">Please sign in to request a connection.</div>;
  if (!host) return <div className="page-loading">Loading…</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="request-meeting">
      <div className="request-meeting__intro">
        <div className="request-meeting__host-avatar">
          {host.photoURL
            ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${host.photoURL})`, backgroundSize: `${(host.photoScale ?? 1) * 100}%`, backgroundPosition: `calc(50% + ${host.photoOffsetX ?? 0}%) calc(50% + ${host.photoOffsetY ?? 0}%)`, backgroundRepeat: 'no-repeat', backgroundColor: '#f0f0f0' }} />
            : <div className="request-meeting__host-avatar-placeholder">{host.name?.[0]?.toUpperCase()}</div>}
        </div>
        <div>
          <h1 className="request-meeting__title">Request a Connection</h1>
          <p className="request-meeting__with">with <strong>{host.name}</strong>{host.title && <span className="request-meeting__host-title"> · {host.title}</span>}</p>
          <p className="request-meeting__rate">{host.is_free ? 'Free session' : `$${host.hourly_rate}/hr — arrange payment directly with host after confirmation`}</p>
        </div>
      </div>

      <form className="edit-profile__form" onSubmit={submit}>
        <div className="request-meeting__datetime">
          <label>Date<input type="date" value={form.date} min={today} onChange={e => set('date', e.target.value)} required /></label>
          <label>Time<input type="time" value={form.time} onChange={e => set('time', e.target.value)} required /></label>
        </div>
        <label>Duration
          <select value={form.duration} onChange={e => set('duration', e.target.value)}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
          </select>
        </label>
        <label>What would you like to discuss?
          <textarea rows={5} placeholder="Describe your goals, questions, or what you'd like to get out of this session…" value={form.notes} onChange={e => set('notes', e.target.value)} required />
        </label>
        <button className="btn btn--primary" type="submit" disabled={submitting}>{submitting ? 'Sending request…' : 'Send Request'}</button>
      </form>
    </main>
  );
}
