-- 003_create_rewards_tables.sql
-- Reward pool definitions + per-donor distribution logs

CREATE TABLE IF NOT EXISTS piggybank_project_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reward_pool_amount BIGINT NOT NULL,
  distributed_amount BIGINT NOT NULL DEFAULT 0,
  is_distributed BOOLEAN NOT NULL DEFAULT false,
  created_by_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distributed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_project_rewards_project
  ON piggybank_project_rewards(project_id);

CREATE TABLE IF NOT EXISTS piggybank_reward_distributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reward_id UUID REFERENCES piggybank_project_rewards(id) ON DELETE CASCADE,
  project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
  donor_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  txn_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_distributions_reward
  ON piggybank_reward_distributions(reward_id);

CREATE INDEX IF NOT EXISTS idx_reward_distributions_project
  ON piggybank_reward_distributions(project_id);
