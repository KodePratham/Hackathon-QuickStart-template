-- 005_add_tweet_post_url_to_projects.sql
-- Stores creator's public tweet URL announcing the project for donor verification

ALTER TABLE piggybank_projects
ADD COLUMN IF NOT EXISTS tweet_post_url TEXT;
