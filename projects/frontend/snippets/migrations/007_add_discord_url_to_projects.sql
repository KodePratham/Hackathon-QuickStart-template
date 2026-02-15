-- 007_add_discord_url_to_projects.sql
-- Stores optional Discord server invite link for each project

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS discord_url TEXT;
