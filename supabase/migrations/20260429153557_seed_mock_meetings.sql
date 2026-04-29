/*
  # Seed mock meeting history

  Inserts realistic dummy meetings into the `meetings` table under a shared
  "demo" session_id so the Impact dashboard shows meaningful numbers on first
  load. The seed covers a mix of verdicts (kill, async, trim, keep) across
  different goals, attendee sizes, and durations.

  Notes:
  - All rows use session_id = 'demo-seed' so they appear for every user
    (the app reads all rows — these act as global baseline data).
  - avg_hourly_rate is kept at a representative £100/hr default since we
    removed per-person rate entry from the UI.
  - These rows are only inserted if the demo-seed session has no rows yet,
    preventing duplicates on re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM meetings WHERE session_id = 'demo-seed' LIMIT 1
  ) THEN
    INSERT INTO meetings
      (session_id, title, goal, outcome, verdict, async_alternative, owner, agenda,
       attendees_proposed, attendees_recommended, duration_minutes, avg_hourly_rate, accepted)
    VALUES
      -- Killed meetings (no event created)
      ('demo-seed', 'Weekly status round-up',     'update',    'Share last week''s numbers', 'kill',  'Send a written update instead', 'Priya Shah',    '["Send async update","Reply with questions by EOD"]', 8,  0, 60,  100, true),
      ('demo-seed', 'Align on aligning',           'other',     'Make sure everyone is aligned', 'kill', 'Alignment doc + 24h comment period', 'Marcus Reed', '[]', 6,  0, 45,  100, true),
      ('demo-seed', 'Cross-team sync',             'update',    'Share what each team is doing', 'kill', 'Loom video + Slack thread', 'Elena Rossi',   '[]', 10, 0, 60,  100, true),
      ('demo-seed', 'Check-in on the check-in',    'update',    'See how things are going',      'kill', 'Written weekly digest', 'Dan Owusu',     '[]', 5,  0, 30,  100, true),
      ('demo-seed', 'Pre-mortem for Q4 planning',  'brainstorm','Identify risks before they happen', 'kill', 'Risk register doc', 'Mei Lin',      '[]', 7,  0, 45,  100, true),

      -- Async-converted meetings
      ('demo-seed', 'Monthly metrics review',      'update',    'Review last month''s KPIs',     'async','Share dashboard link + async comments', 'Jordan Blake', '["Dashboard walkthrough","Comment with questions"]', 9,  0, 60,  100, true),
      ('demo-seed', 'Roadmap update for stakeholders', 'update','Brief stakeholders on roadmap', 'async','Record a 5-min Loom and share', 'Priya Shah',  '["Record walkthrough","Share in Slack"]', 12, 0, 60,  100, true),
      ('demo-seed', 'Sprint retro async pilot',    'update',    'Collect sprint feedback',       'async','Use async retro board instead', 'Marcus Reed',  '["Post board","Async voting","Share summary"]', 6, 0, 45,  100, true),

      -- Trimmed meetings (kept but smaller)
      ('demo-seed', 'Q3 roadmap planning',         'decision',  'Decide on Q3 focus areas',      'trim',  '', 'Priya Shah',   '["Frame the decision","Options review","Vote and decide"]', 8,  4, 90,  100, true),
      ('demo-seed', 'Design system review',        'decision',  'Approve component library',     'trim',  '', 'Mei Lin',      '["Current state","Proposed changes","Sign-off"]', 6, 3, 60,  100, true),
      ('demo-seed', 'Incident post-mortem',        'decision',  'Agree on root cause and fixes', 'trim',  '', 'Marcus Reed',  '["Timeline","Root cause","Action items"]', 7, 4, 60,  100, true),

      -- Kept meetings (survived interrogation)
      ('demo-seed', 'Product strategy offsite',    'decision',  'Set 12-month product direction','keep',  '', 'Priya Shah',   '["Vision","Bets","Resourcing","Decision"]', 4, 4, 120, 100, true),
      ('demo-seed', '1:1 with Priya',              'decision',  'Unblock two engineering issues','keep',  '', 'Marcus Reed',  '["Blocker 1","Blocker 2","Next steps"]', 2, 2, 30,  100, true),
      ('demo-seed', 'Customer discovery session',  'brainstorm','Surface new feature ideas',     'keep',  '', 'Elena Rossi',  '["Intro","Open questions","Synthesis"]', 3, 3, 45,  100, true);

    -- Insert feedback for kept/killed meetings to populate MPS
    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed', 9 FROM meetings WHERE session_id = 'demo-seed' AND verdict = 'keep';

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed', 8 FROM meetings WHERE session_id = 'demo-seed' AND verdict = 'trim' LIMIT 2;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed', 3 FROM meetings WHERE session_id = 'demo-seed' AND verdict = 'kill' LIMIT 3;
  END IF;
END $$;
