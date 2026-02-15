-- 006_create_project_announcements_table.sql
-- Project announcements as tweet links posted by creator

CREATE TABLE IF NOT EXISTS piggybank_project_announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
  tweet_url TEXT NOT NULL,
  created_by_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_announcements_project
  ON piggybank_project_announcements(project_id);

CREATE INDEX IF NOT EXISTS idx_project_announcements_created_at
  ON piggybank_project_announcements(created_at DESC);

ALTER TABLE piggybank_project_announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_announcements'
      AND policyname = 'Project announcements are viewable by everyone'
  ) THEN
    CREATE POLICY "Project announcements are viewable by everyone"
      ON piggybank_project_announcements FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_announcements'
      AND policyname = 'Anyone can create project announcements'
  ) THEN
    CREATE POLICY "Anyone can create project announcements"
      ON piggybank_project_announcements FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;
