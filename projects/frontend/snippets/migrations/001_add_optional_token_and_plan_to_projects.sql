-- 001_add_optional_token_and_plan_to_projects.sql
-- Run after your current base schema

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS token_enabled BOOLEAN DEFAULT true;

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS project_plan_content TEXT;

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS project_plan_filename TEXT;

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS project_plan_format TEXT DEFAULT 'text';

-- Optional backfill for old rows
UPDATE piggybank_projects
SET token_enabled = true
WHERE token_enabled IS NULL;
