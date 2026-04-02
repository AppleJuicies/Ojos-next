'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import '@/styles/Browse.css';

const PAGE_SIZE  = 50;
const CACHE_KEY  = 'ojos_browse_v2';
const CACHE_TTL  = 5 * 60 * 1000; // 5 minutes

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}

function saveCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export function updateBrowseCache(updatedUser) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { data, ts } = JSON.parse(raw);
    const exists = data.some(u => u.id === updatedUser.id);
    const next = exists
      ? data.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u)
      : [...data, updatedUser];
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: next, ts }));
  } catch {}
}

function BrowseSkeleton() {
  return (
    <div className="browse__grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="browse-card browse-card--skeleton">
          <div className="browse-card__header">
            <div className="browse-card__avatar" style={{ background: '#eee' }} />
            <div style={{ width: 120, height: 20, background: '#eee', borderRadius: 4 }} />
          </div>
          <div className="browse-card__body">
            <div style={{ width: '80%', height: 14, background: '#eee', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: '60%', height: 14, background: '#eee', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrowseClient() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [search,      setSearch]      = useState('');
  const supabase = createClient();

  useEffect(() => {
    // Show cached data immediately
    const cached = loadCache();
    if (cached) {
      setUsers(cached);
      setLoading(false);
    }

    // Always refresh from Supabase in background
    supabase
      .from('users')
      .select('id, name, headline, "cardHeadline", "cardBio", bio, "accentColor", "nameFont", "photoURL", "photoScale", "photoOffsetX", "photoOffsetY", experiences, company')
      .order('name')
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        const users = data || [];
        setUsers(users);
        setHasMore(users.length === PAGE_SIZE);
        setLoading(false);
        saveCache(users);
      });
  }, []); // eslint-disable-line

  const loadMore = async () => {
    setLoadingMore(true);
    const last = users[users.length - 1];
    const { data } = await supabase
      .from('users')
      .select('id, name, headline, "cardHeadline", "cardBio", bio, "accentColor", "nameFont", "photoURL", "photoScale", "photoOffsetX", "photoOffsetY", experiences, company')
      .order('name')
      .gt('name', last?.name || '')
      .limit(PAGE_SIZE);
    const next = [...users, ...(data || [])];
    setUsers(next);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoadingMore(false);
    saveCache(next);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.headline?.toLowerCase().includes(q) ||
      u.cardHeadline?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="browse">
      <div className="browse__hero">
        <p className="browse__overline">Explore</p>
        <h1 className="browse__title">Find Someone</h1>
        <p className="browse__subtitle">find someone who knows something.</p>
        <input
          className="browse__search"
          type="text"
          placeholder="Search by name, role, or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <BrowseSkeleton /> : filtered.length === 0 ? (
        <p className="browse-empty">No one found{search ? ` for "${search}"` : ''}.</p>
      ) : (
        <div className="browse__grid">
          {filtered.map(u => {
            const accent   = u.accentColor || '#002fa7';
            const nameFont = u.nameFont    || 'Reddit Sans';
            return (
              <Link href={`/profile/${u.id}`} key={u.id} className="browse-card">
                <div className="browse-card__header">
                  <div className="browse-card__avatar">
                    {u.photoURL
                      ? <div style={{
                          width: '100%', height: '100%',
                          backgroundImage: `url(${u.photoURL})`,
                          backgroundSize: `${(u.photoScale ?? 1) * 100}%`,
                          backgroundPosition: `calc(50% + ${u.photoOffsetX ?? 0}%) calc(50% + ${u.photoOffsetY ?? 0}%)`,
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: '#f0f0f0',
                        }} />
                      : <div className="browse-card__avatar-placeholder" style={{ background: accent }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>}
                  </div>
                  <h2 className="browse-card__name" style={{ color: accent, fontFamily: `'${nameFont}', sans-serif` }}>
                    {u.name}
                  </h2>
                </div>
                <div className="browse-card__body">
                  {(u.cardHeadline || u.headline) && <p className="browse-card__headline">{u.cardHeadline || u.headline}</p>}
                  {(u.cardBio || u.bio) && <p className="browse-card__bio">{(u.cardBio || u.bio).slice(0, 200)}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!search && hasMore && (
        <div className="browse__load-more">
          <button className="btn btn--secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </main>
  );
}
