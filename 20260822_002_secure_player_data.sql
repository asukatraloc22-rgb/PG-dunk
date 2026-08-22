-- Migration backend PG Dunk
-- Les données utilisateur sont liées à auth.users et protégées par RLS.

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_delete_workouts" ON workouts;
DROP POLICY IF EXISTS "authenticated_select_workouts" ON workouts;
DROP POLICY IF EXISTS "authenticated_insert_workouts" ON workouts;
DROP POLICY IF EXISTS "authenticated_update_workouts" ON workouts;
DROP POLICY IF EXISTS "authenticated_delete_workouts" ON workouts;
CREATE POLICY "authenticated_select_workouts" ON workouts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "authenticated_insert_workouts" ON workouts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated_update_workouts" ON workouts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated_delete_workouts" ON workouts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_workouts_user_created ON workouts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS player_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('weekly_schedule', 'shooting_attempts', 'performance_measurements', 'session_history', 'weight_log', 'injury_log')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_type)
);
ALTER TABLE player_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_player_records" ON player_records;
DROP POLICY IF EXISTS "authenticated_insert_player_records" ON player_records;
DROP POLICY IF EXISTS "authenticated_update_player_records" ON player_records;
DROP POLICY IF EXISTS "authenticated_delete_player_records" ON player_records;
CREATE POLICY "authenticated_select_player_records" ON player_records FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "authenticated_insert_player_records" ON player_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated_update_player_records" ON player_records FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated_delete_player_records" ON player_records FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_player_records_user_type ON player_records(user_id, record_type);
