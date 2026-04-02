'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import '@/styles/Browse.css';

const PAGE_SIZE = 50;

function currentCompany(u) {
  const exps = u.experiences;
  if (!exps?.length) return u.company ? { name: u.company, current: true } : null;
  const first = exps[0];
  const isCurrent = first?.endDate?.toLowerCase() === 'present';
  return first?.company ? { name: first.company, current: isCurrent } : (u.company ? { name: u.company, current: true } : null);
}

export default function BrowseClient({ initialUsers }) {
  const [users,       setUsers]       = useState(initialUsers);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(initialUsers.length === PAGE_SIZE);
  const [search,      setSearch]      = useState('');

  const loadMore = async () => {
    setLoadingMore(true);
    const supabase = createClient();
    const last = users[users.length - 1];
    const { data } = await supabase
      .from('users')
      .select('id, name, headline, "cardHeadline", "cardBio", bio, "accentColor", "nameFont", "photoURL", "photoScale", "photoOffsetX", "photoOffsetY", experiences, company')
      .order('name')
      .gt('name', last?.name || '')
      .limit(PAGE_SIZE);
    setUsers(prev => [...prev, ...(data || [])]);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.headline?.toLowerCase().includes(q) ||
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

      {filtered.length === 0 ? (
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
