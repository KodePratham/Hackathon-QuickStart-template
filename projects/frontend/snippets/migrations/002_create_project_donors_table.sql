-- 002_create_project_donors_table.sql
-- Aggregated donor data per project

CREATE TABLE IF NOT EXISTS piggybank_project_donors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
  donor_address TEXT NOT NULL,
  total_donated BIGINT NOT NULL DEFAULT 0,
  donation_count INTEGER NOT NULL DEFAULT 0,
  last_donated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, donor_address)
);

CREATE INDEX IF NOT EXISTS idx_project_donors_project
  ON piggybank_project_donors(project_id);

CREATE INDEX IF NOT EXISTS idx_project_donors_address
  ON piggybank_project_donors(donor_address);
