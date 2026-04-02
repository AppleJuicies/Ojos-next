-- ─── OJOs Supabase Schema ────────────────────────────────────────────────────
-- Run this in Supabase → SQL Editor

-- Users table (mirrors Firebase 'users' collection)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  headline      TEXT,
  education     TEXT,
  bio           TEXT,
  "cardHeadline" TEXT,
  "cardBio"     TEXT,
  company       TEXT,
  location      TEXT,
  "linkedinUrl"  TEXT,
  "portfolioUrl" TEXT,
  "photoURL"    TEXT,
  "photoScale"  REAL    DEFAULT 1,
  "photoOffsetX" REAL   DEFAULT 0,
  "photoOffsetY" REAL   DEFAULT 0,
  "accentColor" TEXT    DEFAULT '#002fa7',
  "nameFont"    TEXT    DEFAULT 'Reddit Sans',
  experiences   JSONB   DEFAULT '[]',
  tags          TEXT[]  DEFAULT '{}',
  is_free       BOOLEAN DEFAULT true,
  hourly_rate   REAL,
  email         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table (mirrors Firebase 'meetings' collection)
CREATE TABLE IF NOT EXISTS meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_name  TEXT,
  requester_email TEXT,
  host_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  host_name       TEXT,
  host_email      TEXT,
  status          TEXT DEFAULT 'pending',
  scheduled_at    TIMESTAMPTZ,
  duration_min    INTEGER,
  notes           TEXT,
  is_free         BOOLEAN,
  price           REAL,
  payment_status  TEXT,
  zoom_join_url   TEXT,
  summary         TEXT,
  jitsi_room      TEXT,
  "accentColor"   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limits table (for AI resume parsing)
CREATE TABLE IF NOT EXISTS rate_limits (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  count        INTEGER DEFAULT 0,
  window_start BIGINT
);

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read (public profiles)
CREATE POLICY "Users viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (auth.uid() = id);

-- Meetings: only participants can view/modify
CREATE POLICY "Participants can view meetings" ON meetings
  FOR SELECT USING (auth.uid() = host_id OR auth.uid() = requester_id);
CREATE POLICY "Requesters can create meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Participants can update meetings" ON meetings
  FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = requester_id);
CREATE POLICY "Participants can delete meetings" ON meetings
  FOR DELETE USING (auth.uid() = host_id OR auth.uid() = requester_id);

-- Rate limits: users can read their own, server writes via service role
CREATE POLICY "Users can read own rate limit" ON rate_limits
  FOR SELECT USING (auth.uid() = id);

-- ─── Storage ──────────────────────────────────────────────────────────────────
-- In Supabase Dashboard → Storage:
-- 1. Create bucket named "photos" and set it to PUBLIC
-- 2. Add storage policy: authenticated users can upload to their own path
--
-- Or run this SQL (may require enabling the storage extension first):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
