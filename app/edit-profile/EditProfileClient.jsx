'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { bustProfileCache, useAuth } from '@/context/AuthProvider';
import { extractTextFromPDF, parseResumeWithAI } from '@/utils/resumeParser';
import '@/styles/Profile.css';
import '@/styles/Browse.css';

const SWATCHES = ['#002fa7','#0D1B3E','#C9A447','#64748B','#4A7C59','#B85C38','#8B95C9'];
const FONTS = [
  { label: 'Reddit Sans', value: 'Reddit Sans', style: { fontFamily: "'Reddit Sans', sans-serif", fontWeight: 700, fontStyle: 'italic'  } },
  { label: 'Inter',       value: 'Inter',       style: { fontFamily: "'Inter', sans-serif",       fontWeight: 600, fontStyle: 'normal'  } },
  { label: 'Fraunces',    value: 'Fraunces',    style: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontStyle: 'italic'  } },
  { label: 'DM Mono',     value: 'DM Mono',     style: { fontFamily: "'DM Mono', monospace",       fontWeight: 400, fontStyle: 'normal'  } },
];

function sortExpsByDate(exps) {
  return [...exps].sort((a, b) => {
    const parse = s => {
      if (!s || s.toLowerCase() === 'present') return Infinity;
      const d = new Date(s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    const endDiff = parse(b.endDate) - parse(a.endDate);
    return endDiff !== 0 ? endDiff : parse(b.startDate) - parse(a.startDate);
  });
}

function CardPreview({ form, photoPreview, set }) {
  const accent   = form.accentColor || '#002fa7';
  const nameFont = form.nameFont    || 'Reddit Sans';
  return (
    <div className="form__group">
      <span className="form__label">How you appear on Find</span>
      <div className="card-preview">
        <div className="browse-card">
          <div className="browse-card__header">
            <div className="browse-card__avatar">
              {photoPreview
                ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${photoPreview})`, backgroundSize: `${(form.photoScale ?? 1) * 100}%`, backgroundPosition: `calc(50% + ${form.photoOffsetX ?? 0}%) calc(50% + ${form.photoOffsetY ?? 0}%)`, backgroundRepeat: 'no-repeat', backgroundColor: '#f0f0f0' }} />
                : <div className="browse-card__avatar-placeholder" style={{ background: accent }}>{form.name?.[0]?.toUpperCase()}</div>}
            </div>
            <h2 className="browse-card__name" style={{ color: accent, fontFamily: `'${nameFont}', sans-serif` }}>{form.name || 'Your Name'}</h2>
          </div>
          <div className="browse-card__body">
            {form.cardHeadline && <p className="browse-card__headline">{form.cardHeadline}</p>}
            {form.cardBio      && <p className="browse-card__bio">{form.cardBio}</p>}
          </div>
        </div>
        <div className="card-preview__fields">
          <label>Card headline
            <input placeholder="e.g. Hardware Engineer at Amazon" value={form.cardHeadline} onChange={e => set('cardHeadline', e.target.value)} maxLength={70} />
            <span className="input-hint input-hint--counter">{form.cardHeadline.length} / 70</span>
          </label>
          <label>Card bio
            <textarea rows={3} placeholder="One or two sentences about yourself…" value={form.cardBio} onChange={e => set('cardBio', e.target.value)} maxLength={200} />
            <span className="input-hint input-hint--counter">{form.cardBio.length} / 200</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function EditProfile() {
  const user     = useAuth();
  const router   = useRouter();
  const supabase = createClient();
  const fileInputRef   = useRef(null);
  const resumeInputRef = useRef(null);

  const [photoFile,    setPhotoFile]    = useState(null);  // compressed dataUrl of new photo
  const [photoPreview, setPhotoPreview] = useState(null);  // what shows in the circle
  const [parsing,      setParsing]      = useState(false);
  const [parseError,   setParseError]   = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [form, setForm] = useState({
    name: '', headline: '', education: '', bio: '', cardHeadline: '', cardBio: '',
    experiences: [], tags: '', linkedinUrl: '', portfolioUrl: '',
    is_free: true, hourly_rate: '', accentColor: '#002fa7', nameFont: 'Reddit Sans',
    photoScale: 1, photoOffsetX: 0, photoOffsetY: 0,
  });

  // Load profile — check localStorage first for instant display, then sync from Supabase
  useEffect(() => {
    if (!user) return;

    // Try localStorage first
    try {
      const cached = localStorage.getItem(`ojos_profile_${user.id}`);
      if (cached) {
        const d = JSON.parse(cached);
        if (d.photoURL) setPhotoPreview(d.photoURL);
        setForm({
          name: d.name || '', headline: d.headline || '', education: d.education || '',
          bio: d.bio || '', cardHeadline: d.cardHeadline || '', cardBio: d.cardBio || '',
          experiences: sortExpsByDate(d.experiences || []),
          tags: Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''),
          linkedinUrl: d.linkedinUrl || '', portfolioUrl: d.portfolioUrl || '',
          is_free: d.is_free ?? true, hourly_rate: d.hourly_rate ?? '',
          accentColor: d.accentColor || '#002fa7', nameFont: d.nameFont || 'Reddit Sans',
          photoScale: d.photoScale ?? 1, photoOffsetX: d.photoOffsetX ?? 0, photoOffsetY: d.photoOffsetY ?? 0,
        });
        return; // skip Supabase fetch — data is fresh from last save
      }
    } catch {}

    // No cache — fetch from Supabase
    supabase.from('users').select('*').eq('id', user.id).maybeSingle().then(({ data: d }) => {
      if (d) {
        if (d.photoURL) setPhotoPreview(d.photoURL);
        setForm({
          name: d.name || '', headline: d.headline || '', education: d.education || '',
          bio: d.bio || '', cardHeadline: d.cardHeadline || '', cardBio: d.cardBio || '',
          experiences: sortExpsByDate(d.experiences || []),
          tags: d.tags?.join(', ') || '', linkedinUrl: d.linkedinUrl || '', portfolioUrl: d.portfolioUrl || '',
          is_free: d.is_free ?? true, hourly_rate: d.hourly_rate ?? '',
          accentColor: d.accentColor || '#002fa7', nameFont: d.nameFont || 'Reddit Sans',
          photoScale: d.photoScale ?? 1, photoOffsetX: d.photoOffsetX ?? 0, photoOffsetY: d.photoOffsetY ?? 0,
        });
      } else {
        setForm(f => ({ ...f, name: user.user_metadata?.full_name || '' }));
      }
    });
  }, [user]); // eslint-disable-line

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Compress photo to 200px max, 0.5 quality — keeps file tiny
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxSize = 800;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      URL.revokeObjectURL(objectUrl);
      setPhotoFile(dataUrl);
      setPhotoPreview(dataUrl);
    };
    img.src = objectUrl;
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError(''); setParsing(true);
    try {
      const text = await extractTextFromPDF(file);
      const data = await parseResumeWithAI(text);
      setForm(f => ({
        ...f,
        name:        data.name        || f.name,
        headline:    data.headline    || f.headline,
        bio:         data.bio         || f.bio,
        experiences: data.experiences?.length
          ? data.experiences.map((exp, i) => ({ id: Date.now() + i, ...exp }))
          : f.experiences,
      }));
    } catch (err) {
      setParseError('Could not parse resume. Please try again.');
      console.error(err);
    } finally {
      setParsing(false); e.target.value = '';
    }
  };

  const addExp    = () => setForm(f => ({ ...f, experiences: [...f.experiences, { id: Date.now(), title: '', company: '', type: '', startDate: '', endDate: '', location: '', description: '' }] }));
  const updateExp = (id, key, val) => setForm(f => ({ ...f, experiences: f.experiences.map(e => e.id === id ? { ...e, [key]: val } : e) }));
  const removeExp = (id) => setForm(f => ({ ...f, experiences: f.experiences.filter(e => e.id !== id) }));
  const moveExp   = (id, dir) => setForm(f => {
    const exps = [...f.experiences];
    const idx  = exps.findIndex(e => e.id === id);
    const to   = idx + dir;
    if (to < 0 || to >= exps.length) return f;
    [exps[idx], exps[to]] = [exps[to], exps[idx]];
    return { ...f, experiences: exps };
  });

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from('meetings').delete().eq('host_id',      user.id),
        supabase.from('meetings').delete().eq('requester_id', user.id),
        supabase.from('users').delete().eq('id', user.id),
        supabase.storage.from('photos').remove([`${user.id}.jpg`]),
      ]);
      try { localStorage.removeItem(`ojos_profile_${user.id}`); } catch {}
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    if (!user) return;

    // If new photo: get the CDN URL now (synchronous), upload in background
    const photoPath = `${user.id}.jpg`;
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(photoPath);

    // photoURL: new file → use CDN URL for DB, local preview for instant display
    const photoURL = photoFile ? publicUrl : (photoPreview || '');

    const profileData = {
      id: user.id,
      name: form.name, headline: form.headline, education: form.education,
      bio: form.bio, cardHeadline: form.cardHeadline, cardBio: form.cardBio,
      experiences: form.experiences,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      linkedinUrl: form.linkedinUrl, portfolioUrl: form.portfolioUrl,
      is_free: form.is_free, hourly_rate: form.is_free ? null : Number(form.hourly_rate),
      accentColor: form.accentColor, nameFont: form.nameFont,
      photoScale: form.photoScale, photoOffsetX: form.photoOffsetX, photoOffsetY: form.photoOffsetY,
      photoURL,
      email: user.email,
      updated_at: new Date().toISOString(),
    };

    // Write to localStorage immediately — profile page reads this instantly
    const localData = { ...profileData, photoURL: photoFile ? photoPreview : photoURL };
    try { localStorage.setItem(`ojos_profile_${user.id}`, JSON.stringify(localData)); } catch {}

    // Bust auth provider cache so navbar updates
    try { localStorage.removeItem('ojo_profile_v1'); } catch {}
    bustProfileCache();
    try { sessionStorage.removeItem('ojos_browse_v1'); } catch {}

    // Navigate instantly — don't wait for Supabase
    router.push(`/profile/${user.id}`);

    // Sync to Supabase in background
    const sync = async () => {
      if (photoFile) {
        const res  = await fetch(photoFile);
        const blob = await res.blob();
        await supabase.storage.from('photos').upload(photoPath, blob, { upsert: true, contentType: 'image/jpeg' });
      }
      const { error } = await supabase.from('users').upsert(profileData);
      if (error) console.error('Save error:', error.message);
    };
    sync().catch(err => console.error('Background sync failed:', err));
  };

  if (!user) return <div className="page-loading">Loading…</div>;

  return (
    <main className="edit-profile">
      <h1 className="edit-profile__title">My Identity</h1>

      <div style={{ marginBottom: 24 }}>
        <button type="button" className="bubble bubble--profile" disabled={parsing} onClick={() => resumeInputRef.current.click()}>
          {parsing ? 'Parsing…' : 'Parse Resume'}
        </button>
        <input ref={resumeInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeUpload} />
        {parseError && <p className="resume-import__error" style={{ marginTop: 8 }}>{parseError}</p>}
      </div>

      <form className="edit-profile__form" onSubmit={save}>

        <div className="form__group">
          <span className="form__label">Profile Photo</span>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="form__photo-preview" onClick={() => fileInputRef.current.click()}
                style={photoPreview ? {
                  backgroundImage: `url(${photoPreview})`,
                  backgroundSize: `${form.photoScale * 100}%`,
                  backgroundPosition: `calc(50% + ${form.photoOffsetX}%) calc(50% + ${form.photoOffsetY}%)`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#f0f0f0',
                } : {}}>
                {!photoPreview && <span>+</span>}
              </div>
              <p className="form__photo-hint">Click to upload</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            {photoPreview && (
              <div className="photo-adjust">
                <label className="photo-adjust__label">Zoom
                  <input type="range" min="0.5" max="3" step="0.05" value={form.photoScale} onChange={e => set('photoScale', Number(e.target.value))} />
                </label>
                <label className="photo-adjust__label">Left / Right
                  <input type="range" min="-50" max="50" step="0.5" value={form.photoOffsetX} onChange={e => set('photoOffsetX', Number(e.target.value))} />
                </label>
                <label className="photo-adjust__label">Up / Down
                  <input type="range" min="-50" max="50" step="0.5" value={form.photoOffsetY} onChange={e => set('photoOffsetY', Number(e.target.value))} />
                </label>
              </div>
            )}
          </div>
        </div>

        <CardPreview form={form} photoPreview={photoPreview} set={set} />

        <label>Full Name
          <input value={form.name} onChange={e => set('name', e.target.value)} maxLength={40} required />
          <span className="input-hint input-hint--counter">{form.name.length} / 40</span>
        </label>

        <div className="form__group">
          <span className="form__label">Perspective</span>
          <div className="color-picker">
            {SWATCHES.map(hex => (
              <button key={hex} type="button" className={`color-swatch${form.accentColor === hex ? ' active' : ''}`} style={{ background: hex }} onClick={() => set('accentColor', hex)} />
            ))}
            <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)} title="Custom colour"
              style={{ width: 32, height: 32, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' }} />
          </div>
        </div>

        <div className="form__group">
          <span className="form__label">Personality</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {FONTS.map(f => (
              <button key={f.value} type="button" onClick={() => set('nameFont', f.value)}
                style={{ ...f.style, fontSize: '1.4rem', color: form.nameFont === f.value ? form.accentColor : 'var(--gray)', background: 'none', border: 'none', borderBottom: `2px solid ${form.nameFont === f.value ? form.accentColor : 'transparent'}`, paddingBottom: 2, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}>
                {form.name || 'Your Name'}
              </button>
            ))}
          </div>
        </div>

        <label>Headline
          <input placeholder="e.g. Hardware Engineer at Amazon" value={form.headline} onChange={e => set('headline', e.target.value)} maxLength={80} />
          <span className="input-hint input-hint--counter">{form.headline.length} / 80</span>
        </label>
        <label>Education
          <input placeholder="e.g. BS Mechanical Engineering · UCF · 2025" value={form.education} onChange={e => set('education', e.target.value)} maxLength={80} />
          <span className="input-hint input-hint--counter">{form.education.length} / 80</span>
        </label>
        <label>Bio
          <textarea rows={4} placeholder="A short introduction about yourself…" value={form.bio} onChange={e => set('bio', e.target.value)} />
        </label>
        <label>LinkedIn URL
          <input type="url" placeholder="https://linkedin.com/in/yourname" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} />
        </label>
        <label>Portfolio / Website
          <input type="url" placeholder="https://yourportfolio.com" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} />
        </label>

        <div className="form__group">
          <span className="form__label">Experience</span>
          {form.experiences.map((exp, i) => (
            <div key={exp.id} className="exp-editor">
              <div className="exp-editor__header">
                <span className="exp-editor__num">#{i + 1}</span>
                <div className="exp-editor__controls">
                  <button type="button" className="exp-editor__move" onClick={() => moveExp(exp.id, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button type="button" className="exp-editor__move" onClick={() => moveExp(exp.id,  1)} disabled={i === form.experiences.length - 1} title="Move down">↓</button>
                  <button type="button" className="exp-editor__remove" onClick={() => removeExp(exp.id)}>Remove</button>
                </div>
              </div>
              <div className="form__row">
                <input className="form__input" placeholder="Job Title" value={exp.title}   onChange={e => updateExp(exp.id, 'title',   e.target.value)} />
                <input className="form__input" placeholder="Company"   value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} />
              </div>
              <div className="form__row">
                <select className="form__input" value={exp.type} onChange={e => updateExp(exp.id, 'type', e.target.value)}>
                  <option value="">Type</option>
                  <option>Full-time</option><option>Internship</option><option>Part-time</option><option>Contract</option><option>Freelance</option>
                </select>
                <input className="form__input" placeholder="Location" value={exp.location} onChange={e => updateExp(exp.id, 'location', e.target.value)} />
              </div>
              <div className="form__row">
                <input className="form__input" placeholder="Start (e.g. Jan 2024)" value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} />
                <input className="form__input" placeholder="End (e.g. Jun 2024 or Present)" value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} />
              </div>
              <textarea className="form__input form__textarea" rows={4} placeholder="Describe your role, responsibilities, and achievements…" value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} />
            </div>
          ))}
          <button type="button" className="exp-add-btn" onClick={addExp}>+ Add Experience</button>
        </div>

        <label>Skills / Tags
          <input placeholder="e.g. Product Strategy, Growth, B2B SaaS" value={form.tags} onChange={e => set('tags', e.target.value)} />
          <span className="input-hint">Comma-separated</span>
        </label>

        <div className="edit-profile__rate-row">
          <span className="edit-profile__rate-label">Session type</span>
          <div className="edit-profile__rate-options">
            <label className="radio-option"><input type="radio" checked={form.is_free}  onChange={() => set('is_free', true)}  />Free</label>
            <label className="radio-option"><input type="radio" checked={!form.is_free} onChange={() => set('is_free', false)} />Paid</label>
          </div>
        </div>

        {!form.is_free && (
          <label>Hourly Rate (USD)
            <input type="number" min="1" placeholder="e.g. 150" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} required />
          </label>
        )}

        <button className="btn btn--primary" type="submit">Save Profile</button>
      </form>

      <div className="danger-zone">
        <div className="danger-zone__divider" />
        {!showDeleteConfirm ? (
          <button type="button" className="bubble bubble--delete" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
        ) : (
          <div className="danger-zone__confirm">
            <p className="danger-zone__warning">This will permanently delete your profile, all your meetings, and your account. There is no undo.</p>
            <div className="danger-zone__actions">
              <button type="button" className="bubble bubble--delete" disabled={deleting} onClick={handleDeleteAccount}>{deleting ? 'Deleting…' : 'Yes, delete everything'}</button>
              <button type="button" className="bubble bubble--profile" disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
