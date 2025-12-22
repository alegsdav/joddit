-- 1. DROP EXISTING TABLE (WARNING: This will delete existing notes)
-- Run this if you want to start fresh with the correct schema
DROP TABLE IF EXISTS notes;

-- 2. CREATE TABLE
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  segments JSONB, -- Correct type for JSON data
  created_at BIGINT, -- Using BIGINT to match Date.now() from JavaScript
  updated_at BIGINT,
  is_pinned BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'Recent',
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 3. CREATE INDEXES (For faster searching and sorting)
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICY (Neon Authorize / Clerk Integration)
-- This uses the 'auth' schema provided by the Neon Data API integration
CREATE POLICY "Users can only see their own notes" ON notes
  FOR ALL
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());
