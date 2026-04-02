'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import '@/styles/MeetingRoom.css';

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const user     = useAuth();
  const supabase = createClient();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('meetings').select('*').eq('id', meetingId).maybeSingle().then(({ data }) => {
      if (data) setMeeting(data);
      setLoading(false);
    });
  }, [meetingId]); // eslint-disable-line

  if (loading || user === undefined) return <div className="room-loading">Loading…</div>;
  if (!user)    return <div className="room-loading">Please sign in to join this meeting.</div>;
  if (!meeting) return <div className="room-loading">Meeting not found.</div>;

  const isParticipant = user.id === meeting.host_id || user.id === meeting.requester_id;
  if (!isParticipant) return <div className="room-loading">You're not a participant in this meeting.</div>;

  if (meeting.status === 'pending') return (
    <div className="room-loading">
      <p>This meeting hasn't been confirmed yet.</p>
      <Link href="/dashboard" className="btn btn--secondary" style={{ marginTop: 16 }}>Back to Connections page</Link>
    </div>
  );

  if (meeting.status === 'declined' || meeting.status === 'cancelled') return (
    <div className="room-loading">
      <p>This meeting was {meeting.status}.</p>
      <Link href="/dashboard" className="btn btn--secondary" style={{ marginTop: 16 }}>Back to Connections page</Link>
    </div>
  );

  const otherName = user.id === meeting.host_id ? meeting.requester_name : meeting.host_name;

  return (
    <div className="meeting-room">
      <div className="meeting-room__topbar">
        <div className="meeting-room__topbar-left">
          <Link href="/dashboard" className="meeting-room__back">← Connections page</Link>
          <span className="meeting-room__title">Meeting with {otherName}</span>
        </div>
        <span className="meeting-room__meta">{fmtDate(meeting.scheduled_at)} · {meeting.duration_min} min</span>
      </div>
      <div className="meeting-room__join">
        {meeting.zoom_join_url
          ? <a href={meeting.zoom_join_url} target="_blank" rel="noopener noreferrer" className="btn btn--primary">Join on Zoom</a>
          : <p className="meeting-room__no-link">The host hasn't added a Zoom link yet.</p>}
      </div>
    </div>
  );
}
