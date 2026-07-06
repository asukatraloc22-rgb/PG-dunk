/*
# Create workouts and exercise templates schema

1. New Tables
- `workouts` - stores AI-generated workout sessions
  - `id` (uuid, primary key)
  - `title` (text, workout name)
  - `description` (text, detailed workout description)
  - `focus_area` (text, e.g., "vertical jump", "explosiveness", "mobility")
  - `difficulty` (text, e.g., "beginner", "intermediate", "elite")
  - `duration_minutes` (integer, estimated duration)
  - `exercises` (jsonb, array of exercise objects with name, sets, reps, rest, notes)
  - `is_favorite` (boolean, default false)
  - `created_at` (timestamp)
- `exercise_templates` - stores exercise library for workout generation
  - `id` (uuid, primary key)
  - `name` (text, exercise name)
  - `category` (text, e.g., "plyometrics", "strength", "mobility")
  - `muscle_group` (text, primary muscle group targeted)
  - `description` (text, how to perform the exercise)
  - `equipment_needed` (text, required equipment)
  - `difficulty_level` (text, suitable difficulty level)

2. Security
- Enable RLS on all tables.
- Single-tenant app: allow anon + authenticated full CRUD access for public/shared data.
*/

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  focus_area text,
  difficulty text,
  duration_minutes integer,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
CREATE POLICY "anon_select_workouts" ON workouts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
CREATE POLICY "anon_insert_workouts" ON workouts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
CREATE POLICY "anon_update_workouts" ON workouts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workouts" ON workouts;
CREATE POLICY "anon_delete_workouts" ON workouts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS exercise_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  muscle_group text,
  description text,
  equipment_needed text DEFAULT 'Aucun',
  difficulty_level text DEFAULT 'intermediate'
);

ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exercises" ON exercise_templates;
CREATE POLICY "anon_select_exercises" ON exercise_templates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exercises" ON exercise_templates;
CREATE POLICY "anon_insert_exercises" ON exercise_templates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exercises" ON exercise_templates;
CREATE POLICY "anon_update_exercises" ON exercise_templates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exercises" ON exercise_templates;
CREATE POLICY "anon_delete_exercises" ON exercise_templates FOR DELETE
  TO anon, authenticated USING (true);

-- Seed exercise templates for vertical jump training
INSERT INTO exercise_templates (name, category, muscle_group, description, equipment_needed, difficulty_level) VALUES
-- Plyometrics
('Box Jumps', 'plyometrie', 'quadriceps', 'Saute sur une box avec explosivité, atterrissage souple. Focus sur la qualité pas la hauteur.', 'Box', 'intermediate'),
('Depth Jumps', 'plyometrie', 'quadriceps', 'Descends d''une box, puis remonte explosivement sur une autre. Excellent pour le RSI.', '2 Box', 'elite'),
('Jump Squats', 'plyometrie', 'quadriceps', 'Squat sauté avec amplitude maximale. Genoux alignés, atterrissage contrôlé.', 'Aucun', 'beginner'),
('Single Leg Bounds', 'plyometrie', 'quadriceps', 'Bondissements unilatéraux sur une jambe. Développe la puissance unilatérale.', 'Aucun', 'intermediate'),
('Tuck Jumps', 'plyometrie', 'abdominaux', 'Saute et ramène les genoux à la poitrine. Core engaé.', 'Aucun', 'intermediate'),

-- Strength
('Back Squat', 'force', 'quadriceps', 'Squat arrière avec barre. Base fondamentale pour la puissance.', 'Barre, Rack', 'intermediate'),
('Front Squat', 'force', 'quadriceps', 'Squat avant, accent sur les quadriceps. Posture verticale.', 'Barre', 'intermediate'),
('Deadlift', 'force', 'chaines_posterieures', 'Soulevé de terre conventionnel. Développe la chaîne postérieure.', 'Barre', 'intermediate'),
('Romanian Deadlift', 'force', 'ischio_jambiers', 'RDL pour étirement et renforcement ischio-jambiers.', 'Barre ou haltères', 'beginner'),
('Bulgarian Split Squat', 'force', 'quadriceps', 'Squat bulgare unilatéral. Excellent pour les déséquilibres.', 'Banc, Haltères', 'intermediate'),
('Hip Thrust', 'force', 'fessiers', 'Thrust de hanche pour développer les fessiers, moteurs du jump.', 'Banc, Barre', 'beginner'),

-- Power
('Power Clean', 'puissance', 'corps_entier', 'Épaulé jeté. Transfert de force explosif du sol aux épaules.', 'Barre', 'elite'),
('Hang Clean', 'puissance', 'corps_entier', 'Clean depuis la position hang. Focus sur le catch.', 'Barre', 'elite'),
('Trap Bar Jump', 'puissance', 'corps_entier', 'Jump avec trap bar. Sécuritaire et explosif.', 'Trap Bar', 'intermediate'),
('Kettlebell Swing', 'puissance', 'chaines_posterieures', 'Swing explosif, focus hanche pas bras.', 'Kettlebell', 'beginner'),

-- Mobility/Recovery
('Hip Flexor Stretch', 'mobilite', 'hanche', 'Étirement statique des fléchisseurs de hanche. Essential pour le jump.', 'Aucun', 'beginner'),
('Ankle Dorsiflexion', 'mobilite', 'cheville', 'Mobilité de cheville pour meilleure transmission de force.', 'Mur', 'beginner'),
('Foam Rolling', 'recuperation', 'corps_entier', 'Automassage au rouleau pour récupération. Focus quadriceps et mollets.', 'Foam Roller', 'beginner'),
('Active Stretch Series', 'mobilite', 'corps_entier', 'Série d''étirements actifs dynamiques pre-workout.', 'Aucun', 'beginner'),

-- Core
('Hanging Leg Raise', 'core', 'abdominaux', 'Levée de jambes suspendue. Core et grip.', 'Barre de traction', 'intermediate'),
('Plank Variations', 'core', 'abdominaux', 'Planche et variations. Stabilité du tronc.', 'Aucun', 'beginner'),
('Med Ball Throws', 'puissance', 'corps_entier', 'Lancers med ball contre mur. Rotation et puissance.', 'Medicine Ball', 'intermediate'),
('Russian Twist', 'core', 'obliques', 'Twist russe avec medicine ball.', 'Medicine Ball', 'beginner');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_focus_area ON workouts(focus_area);
CREATE INDEX IF NOT EXISTS idx_exercise_category ON exercise_templates(category);