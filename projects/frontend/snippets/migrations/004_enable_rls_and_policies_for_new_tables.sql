-- 004_enable_rls_and_policies_for_new_tables.sql
-- RLS + policies for new donor/reward tables

ALTER TABLE piggybank_project_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_project_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_reward_distributions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_donors'
      AND policyname = 'Project donors are viewable by everyone'
  ) THEN
    CREATE POLICY "Project donors are viewable by everyone"
      ON piggybank_project_donors FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_donors'
      AND policyname = 'Anyone can create project donor aggregates'
  ) THEN
    CREATE POLICY "Anyone can create project donor aggregates"
      ON piggybank_project_donors FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_donors'
      AND policyname = 'Anyone can update project donor aggregates'
  ) THEN
    CREATE POLICY "Anyone can update project donor aggregates"
      ON piggybank_project_donors FOR UPDATE
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_rewards'
      AND policyname = 'Project rewards are viewable by everyone'
  ) THEN
    CREATE POLICY "Project rewards are viewable by everyone"
      ON piggybank_project_rewards FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_rewards'
      AND policyname = 'Anyone can create project rewards'
  ) THEN
    CREATE POLICY "Anyone can create project rewards"
      ON piggybank_project_rewards FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_project_rewards'
      AND policyname = 'Anyone can update project rewards'
  ) THEN
    CREATE POLICY "Anyone can update project rewards"
      ON piggybank_project_rewards FOR UPDATE
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_reward_distributions'
      AND policyname = 'Reward distributions are viewable by everyone'
  ) THEN
    CREATE POLICY "Reward distributions are viewable by everyone"
      ON piggybank_reward_distributions FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'piggybank_reward_distributions'
      AND policyname = 'Anyone can create reward distributions'
  ) THEN
    CREATE POLICY "Anyone can create reward distributions"
      ON piggybank_reward_distributions FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

-- Keep donors.updated_at current on updates
DROP TRIGGER IF EXISTS update_piggybank_project_donors_updated_at ON piggybank_project_donors;
CREATE TRIGGER update_piggybank_project_donors_updated_at
BEFORE UPDATE ON piggybank_project_donors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
