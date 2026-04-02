'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';

const DEFAULT_BLUE = '#002fa7';
const ACCENT_KEY   = 'ojo_accent';
const PROFILE_KEY  = 'ojo_profile_v1';
const PROFILE_TTL  = 30 * 60 * 1000;

function loadProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > PROFILE_TTL) return null;
    return data;
  } catch { return null; }
}

function saveProfileCache(data) {
  try {
    const lean = { accentColor: data.accentColor, nameFont: data.nameFont, name: data.name };
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ data: lean, ts: Date.now() }));
  } catch {}
}

export function bustProfileCache() {
  try { localStorage.removeItem(PROFILE_KEY); } catch {}
}

export const AuthContext          = createContext(null);
export const ProfileContext       = createContext(undefined);
export const PendingCountContext  = createContext(0);
export const RefreshPendingContext = createContext(() => {});

export default function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [profile,      setProfile]      = useState(() => {
    if (typeof window !== 'undefined') return loadProfileCache() || undefined;
    return undefined;
  });
  const [pendingCount, setPendingCount] = useState(0);
  const uidRef = useRef(null);
  const supabase = createClient();

  // Apply accent color immediately from cache
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ACCENT_KEY);
    document.documentElement.style.setProperty('--blue', cached || DEFAULT_BLUE);
  }

  const fetchPendingCount = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const { count } = await supabase
        .from('meetings')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', uid)
        .eq('status', 'pending');
      setPendingCount(count || 0);
    } catch {}
  }, []); // eslint-disable-line

  const refreshPending = useCallback(() => {
    if (uidRef.current) fetchPendingCount(uidRef.current);
  }, [fetchPendingCount]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      uidRef.current = u?.id ?? null;
      if (u) {
        const cachedProfile = loadProfileCache();
        if (cachedProfile) {
          setProfile(cachedProfile);
          fetchPendingCount(u.id);
        } else {
          Promise.all([
            supabase.from('users').select('*').eq('id', u.id).maybeSingle(),
            fetchPendingCount(u.id),
          ]).then(([{ data }]) => {
            if (data) {
              const accentColor = data.accentColor || DEFAULT_BLUE;
              localStorage.setItem(ACCENT_KEY, accentColor);
              document.documentElement.style.setProperty('--blue', accentColor);
              saveProfileCache(data);
              setProfile({ ...data });
            } else {
              document.documentElement.style.setProperty('--blue', DEFAULT_BLUE);
              setProfile(null);
            }
          });
        }
      } else {
        setProfile(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      uidRef.current = u?.id ?? null;

      if (event === 'SIGNED_IN' && u) {
        const cachedProfile = loadProfileCache();
        if (cachedProfile) {
          setProfile(cachedProfile);
          fetchPendingCount(u.id);
        } else {
          const [{ data }] = await Promise.all([
            supabase.from('users').select('*').eq('id', u.id).maybeSingle(),
            fetchPendingCount(u.id),
          ]);
          if (data) {
            const accentColor = data.accentColor || DEFAULT_BLUE;
            localStorage.setItem(ACCENT_KEY, accentColor);
            document.documentElement.style.setProperty('--blue', accentColor);
            saveProfileCache(data);
            setProfile({ ...data });
          } else {
            document.documentElement.style.setProperty('--blue', DEFAULT_BLUE);
            setProfile(null);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(ACCENT_KEY);
        bustProfileCache();
        document.documentElement.style.setProperty('--blue', DEFAULT_BLUE);
        setProfile(null);
        setPendingCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line

  // Refresh pending count when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && uidRef.current) {
        fetchPendingCount(uidRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchPendingCount]);

  return (
    <AuthContext.Provider value={user}>
      <ProfileContext.Provider value={profile}>
        <PendingCountContext.Provider value={pendingCount}>
          <RefreshPendingContext.Provider value={refreshPending}>
            {children}
          </RefreshPendingContext.Provider>
        </PendingCountContext.Provider>
      </ProfileContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth()         { return useContext(AuthContext); }
export function useProfile()      { return useContext(ProfileContext); }
export function usePendingCount() { return useContext(PendingCountContext); }
