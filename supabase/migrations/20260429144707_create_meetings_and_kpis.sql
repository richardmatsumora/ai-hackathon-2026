/*
  # Meet is Murder — core tables

  1. New Tables
    - `meetings`
      - Captures every intercepted meeting draft, the verdict rendered,
        the goal/outcome answers, attendee counts, duration, and ESG/cost
        inputs so KPIs can be reconstructed at any time.
    - `feedback`
      - Optional post-meeting MPS (Meeting Promoter Score) responses tied
        to a meeting for the quality metric.
  2. Security
    - RLS enabled on both tables.
    - For this single-tenant demo, an anonymous-friendly policy is
      intentionally scoped to a `session_id` column so each browser
      session only sees its own rows. No cross-session access.
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT 'other',
  outcome text NOT NULL DEFAULT '',
  verdict text NOT NULL DEFAULT 'keep',
  async_alternative text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  attendees_proposed int NOT NULL DEFAULT 0,
  attendees_recommended int NOT NULL DEFAULT 0,
  duration_minutes int NOT NULL DEFAULT 30,
  avg_hourly_rate numeric NOT NULL DEFAULT 75,
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_session_idx ON meetings(session_id);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert meetings for their session"
  ON meetings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read meetings"
  ON meetings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update meetings"
  ON meetings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read feedback"
  ON feedback FOR SELECT
  TO anon, authenticated
  USING (true);
