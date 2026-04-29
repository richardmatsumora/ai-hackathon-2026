/*
  # Add source + external_id to meetings

  1. Schema changes
    - `meetings.source` (text, default 'local'): identifies origin of the row — 'local' for Meet is Murder interrogations, 'google' for events imported from Google Calendar.
    - `meetings.external_id` (text, nullable): stores the Google Calendar event id so re-imports upsert instead of duplicating.

  2. Security
    - No RLS changes — existing policies already cover new columns.

  3. Notes
    - Additive migration, fully backwards compatible. All existing rows keep their default 'local' source.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'source'
  ) THEN
    ALTER TABLE meetings ADD COLUMN source text DEFAULT 'local' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN external_id text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS meetings_session_external_unique
  ON meetings (session_id, external_id)
  WHERE external_id IS NOT NULL;
