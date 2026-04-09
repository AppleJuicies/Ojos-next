'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import '@/styles/Profile.css';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function ProfileClient({ uid }) {
  const [profile, setProfile] = useState(undefined); // undefined = loading
  const user   = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!uid) return;

    // Check localStorage first for instant display
    const cachedKey = `ojos_profile_${uid}`;
    try {
      const cached = localStorage.getItem(cachedKey);
      if (cached) setProfile(JSON.parse(cached));
    } catch {}

    // Always fetch fresh from API
    fetch(`/api/profile/${uid}`)
      .then(r => r.json())
      .then(({ profile: data }) => {
        setProfile(data ?? null);
        if (data) try { localStorage.setItem(cachedKey, JSON.stringify(data)); } catch {}
      })
      .catch(() => setProfile(prev => prev ?? null));
  }, [uid]);

  useEffect(() => {
    if (profile === null && user?.id === uid) router.push('/edit-profile');
  }, [profile, user, uid]); // eslint-disable-line

  if (profile === undefined) return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-photo"><div className="profile-photo__circle" style={{ background: '#eee' }} /></div>
        <div className="profile-header__identity">
          <div style={{ width: 200, height: 32, background: '#eee', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: 140, height: 18, background: '#eee', borderRadius: 6 }} />
        </div>
      </header>
    </main>
  );

  if (profile === null) return (
    <main className="profile-page">
      <p className="profile-page__empty" style={{ padding: 48 }}>Profile not found.</p>
    </main>
  );

  const isOwnProfile = user?.id === uid;
  const isAdmin      = user?.id === ADMIN_UID && !isOwnProfile;
  const accent       = profile.accentColor  || '#002fa7';
  const nameFont     = profile.nameFont     || 'Reddit Sans';
  const photoScale   = profile.photoScale   ?? 1;
  const photoOffsetX = profile.photoOffsetX ?? 0;
  const photoOffsetY = profile.photoOffsetY ?? 0;

  const handleDeleteProfile = async () => {
    if (!window.confirm(`Permanently delete ${profile.name}'s profile? This cannot be undone.`)) return;
    const supabase = (await import('@/lib/supabase')).createClient();
    await Promise.all([
      supabase.from('meetings').delete().eq('host_id', uid),
      supabase.from('meetings').delete().eq('requester_id', uid),
      supabase.from('users').delete().eq('id', uid),
      supabase.storage.from('photos').remove([`${uid}.jpg`]),
    ]);
    router.push('/browse');
  };

  return (
    <main className="profile-page" style={{ '--profile-accent': accent }}>
      <header className="profile-header">
        <div className="profile-photo">
          <div className="profile-photo__circle">
            {profile.photoURL
              ? <div style={{
                  width: '100%', height: '100%',
                  backgroundImage: `url(${profile.photoURL})`,
                  backgroundSize: `${photoScale * 100}%`,
                  backgroundPosition: `calc(50% + ${photoOffsetX}%) calc(50% + ${photoOffsetY}%)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#f0f0f0',
                }} />
              : <div className="profile-photo__placeholder" style={{ background: accent }}>
                  {profile.name?.[0]?.toUpperCase()}
                </div>}
          </div>
        </div>

        <div className="profile-header__identity">
          <div className="profile-hero__name-row">
            <h1 className="profile-hero__name" style={{ color: accent, fontFamily: `'${nameFont}', sans-serif` }}>
              {profile.name}
            </h1>
            {isAdmin && (
              <button className="admin-trash" onClick={handleDeleteProfile} title="Delete profile">🗑</button>
            )}
          </div>
          {profile.headline  && <p className="profile-meta__headline" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{profile.headline}</p>}
          {profile.education && <p className="profile-meta__sub">{profile.education}</p>}
        </div>
      </header>

      <div className="profile-body">
        <div className="profile-actions">
          {isOwnProfile ? (
            <Link href="/edit-profile" className="bubble bubble--profile" style={{ color: accent, borderColor: accent, fontFamily: `'${nameFont}', sans-serif` }}>
              Develop
            </Link>
          ) : (
            <button
              className="bubble bubble--profile"
              style={{ background: accent, borderColor: accent, color: '#fff', fontFamily: `'${nameFont}', sans-serif` }}
              onClick={() => {
                if (!user) { router.push('/sign-in'); return; }
                router.push(`/request/${uid}`);
              }}
            >
              Request a Connection
            </button>
          )}
        </div>

        {profile.bio && (
          <>
            <h2 className="profile-body__label" style={{ color: accent, fontFamily: `'${nameFont}', sans-serif` }}>About</h2>
            <p className="profile-body__text" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{profile.bio}</p>
          </>
        )}

        {!profile.bio && !isOwnProfile && (
          <p className="profile-page__empty">This user hasn't filled out their profile yet.</p>
        )}

        {(profile.linkedinUrl || profile.portfolioUrl) && (
          <>
            <h2 className="profile-body__label" style={{ color: accent, marginTop: 32, fontFamily: `'${nameFont}', sans-serif` }}>Media</h2>
            <div className="profile-media">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="bubble bubble--profile" style={{ color: accent, borderColor: accent, fontFamily: `'${nameFont}', sans-serif` }}>
                  LinkedIn ↗
                </a>
              )}
              {profile.linkedinUrl && profile.portfolioUrl && (
                <div className="profile-media__divider" style={{ background: accent }} />
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="bubble bubble--profile" style={{ color: accent, borderColor: accent, fontFamily: `'${nameFont}', sans-serif` }}>
                  Portfolio ↗
                </a>
              )}
            </div>
          </>
        )}

        {profile.experiences?.length > 0 && (
          <>
            <h2 className="profile-body__label" style={{ color: accent, marginTop: 40, fontFamily: `'${nameFont}', sans-serif` }}>Experience</h2>
            <div className="exp-list">
              {profile.experiences.map((exp, i) => (
                <div key={exp.id || i} className="exp-entry">
                  <div className="exp-entry__left">
                    <div className="exp-entry__dot" style={{ background: accent }} />
                  </div>
                  <div className="exp-entry__right">
                    <p className="exp-entry__title" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{exp.title}</p>
                    <p className="exp-entry__company" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{exp.company}{exp.type ? ` · ${exp.type}` : ''}</p>
                    <p className="exp-entry__dates">
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    {exp.description && <p className="exp-entry__desc" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
