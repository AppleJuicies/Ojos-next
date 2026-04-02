'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { extractTextFromPDF, parseResumeWithAI } from '@/utils/resumeParser';
import '@/styles/Profile.css';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function ProfileClient({ profile: initialProfile, uid }) {
  const [profile,           setProfile]           = useState(initialProfile);
  const [parsing,           setParsing]           = useState(false);
  const [parseError,        setParseError]        = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const resumeInputRef = useRef(null);
  const user    = useAuth();
  const router  = useRouter();
  const supabase = createClient();

  const isOwnProfile = user !== undefined && user?.id === uid;
  const isAdmin      = user?.id === ADMIN_UID && !isOwnProfile;

  const handleParseClick = () => {
    const confirmed = window.confirm(
      "Heads up — uploading a resume will replace your current experiences with what's on the file. Want to continue?"
    );
    if (confirmed) resumeInputRef.current.click();
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError('');
    setParsing(true);
    try {
      const text = await extractTextFromPDF(file);
      const data = await parseResumeWithAI(text);
      const updated = {
        name:        data.name        || profile.name,
        headline:    data.headline    || profile.headline,
        company:     data.company     || profile.company,
        location:    data.location    || profile.location,
        bio:         data.bio         || profile.bio,
        experiences: data.experiences?.length
          ? data.experiences.map((exp, i) => ({ id: Date.now() + i, ...exp }))
          : profile.experiences,
      };
      await supabase.from('users').update(updated).eq('id', uid);
      setProfile(p => ({ ...p, ...updated }));
    } catch (err) {
      setParseError('Could not parse resume. Please try again.');
      console.error(err);
    } finally {
      setParsing(false);
      e.target.value = '';
    }
  };

  const purgeUser = async (targetUid) => {
    await Promise.all([
      supabase.from('meetings').delete().eq('host_id',      targetUid),
      supabase.from('meetings').delete().eq('requester_id', targetUid),
      supabase.from('users').delete().eq('id', targetUid),
      supabase.storage.from('photos').remove([`${targetUid}.jpg`]),
    ]);
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm(`Permanently delete ${profile.name}'s profile? This cannot be undone.`)) return;
    await purgeUser(uid);
    router.push('/browse');
  };

  const handleDeleteOwnAccount = async () => {
    setDeleting(true);
    try {
      await purgeUser(uid);
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const accent       = profile.accentColor  || '#002fa7';
  const nameFont     = profile.nameFont     || 'Reddit Sans';
  const photoScale   = profile.photoScale   ?? 1;
  const photoOffsetX = profile.photoOffsetX ?? 0;
  const photoOffsetY = profile.photoOffsetY ?? 0;

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
          {profile.headline  && <p className="profile-meta__headline">{profile.headline}</p>}
          {profile.education && <p className="profile-meta__sub">{profile.education}</p>}
        </div>
      </header>

      {parseError && <p className="resume-import__error" style={{ padding: '0 48px' }}>{parseError}</p>}

      <div className="profile-body">
        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <Link href="/edit-profile" className="bubble bubble--profile" style={{ color: accent, borderColor: accent }}>Develop</Link>
              <span className="profile-actions__or">or</span>
              <button
                className="bubble bubble--profile"
                type="button"
                disabled={parsing}
                onClick={handleParseClick}
                style={{ color: accent, borderColor: accent }}
              >
                {parsing ? 'Parsing…' : 'Parse Resume'}
              </button>
              <input ref={resumeInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeUpload} />
            </>
          ) : (
            <button
              className="bubble bubble--profile"
              style={{ background: accent, borderColor: accent, color: '#fff' }}
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
            <h2 className="profile-body__label" style={{ color: accent }}>About</h2>
            <p className="profile-body__text" style={{ fontFamily: `'${nameFont}', sans-serif` }}>{profile.bio}</p>
          </>
        )}

        {!profile.bio && !isOwnProfile && (
          <p className="profile-page__empty">This user hasn't filled out their profile yet.</p>
        )}

        {(profile.linkedinUrl || profile.portfolioUrl) && (
          <>
            <h2 className="profile-body__label" style={{ color: accent, marginTop: 32 }}>Media</h2>
            <div className="profile-media">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="bubble bubble--profile" style={{ color: accent, borderColor: accent }}>
                  LinkedIn ↗
                </a>
              )}
              {profile.linkedinUrl && profile.portfolioUrl && (
                <div className="profile-media__divider" style={{ background: accent }} />
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="bubble bubble--profile" style={{ color: accent, borderColor: accent }}>
                  Portfolio ↗
                </a>
              )}
            </div>
          </>
        )}

        {profile.experiences?.length > 0 && (
          <>
            <h2 className="profile-body__label" style={{ color: accent, marginTop: 40 }}>Experience</h2>
            <div className="exp-list">
              {profile.experiences.map((exp, i) => (
                <div key={exp.id || i} className="exp-entry">
                  <div className="exp-entry__left">
                    <div className="exp-entry__dot" style={{ background: accent }} />
                  </div>
                  <div className="exp-entry__right">
                    <p className="exp-entry__title">{exp.title}</p>
                    <p className="exp-entry__company">{exp.company}{exp.type ? ` · ${exp.type}` : ''}</p>
                    <p className="exp-entry__dates">
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    {exp.description && <p className="exp-entry__desc">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {isOwnProfile && (
          <div className="danger-zone">
            <div className="danger-zone__divider" />
            {!showDeleteConfirm ? (
              <button type="button" className="bubble bubble--delete" onClick={() => setShowDeleteConfirm(true)}>
                Delete Account
              </button>
            ) : (
              <div className="danger-zone__confirm">
                <p className="danger-zone__warning">
                  This will permanently delete your profile, all your meetings, and your account. There is no undo.
                </p>
                <div className="danger-zone__actions">
                  <button type="button" className="bubble bubble--delete" disabled={deleting} onClick={handleDeleteOwnAccount}>
                    {deleting ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button type="button" className="bubble bubble--profile" disabled={deleting} onClick={() => setShowDeleteConfirm(false)}
                    style={{ color: accent, borderColor: accent }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
