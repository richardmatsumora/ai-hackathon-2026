/*
  # Boost mock Impact stats

  The initial demo-seed dataset was fine in shape but low in volume, so the
  Impact tab felt empty. This migration:

  1. Adds a second, larger batch of seed meetings (session_id = 'demo-seed-v2')
     with a heavier skew toward kills/async and larger attendee counts so the
     headline KPIs (meetings avoided, attendee-hours, cost saved) are clearly
     non-zero on first load.
  2. Adds positive-skewed feedback so the Meeting Promoter Score lands in a
     healthy range (+40 ish).
  3. Idempotent: nothing runs if 'demo-seed-v2' already has rows.

  Security: RLS is already enabled on meetings/feedback from the initial
  migration. No policy changes required.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM meetings WHERE session_id = 'demo-seed-v2' LIMIT 1) THEN

    -- Batch of killed status meetings (high attendee count, long duration)
    INSERT INTO meetings
      (session_id, title, goal, outcome, verdict, async_alternative, owner, agenda,
       attendees_proposed, attendees_recommended, duration_minutes, avg_hourly_rate, accepted)
    VALUES
      ('demo-seed-v2', 'All-hands status update',     'update', 'Share the weekly round-up',        'kill',  'Written weekly memo', 'Priya Shah',  '[]', 22, 0, 60,  100, true),
      ('demo-seed-v2', 'Engineering sync',            'update', 'Share team progress',              'kill',  'Slack channel digest', 'Marcus Reed', '[]', 14, 0, 45,  100, true),
      ('demo-seed-v2', 'Marketing brainstorm redux',  'brainstorm','Generate campaign ideas again', 'kill',  'Miro board with async comments', 'Nora Kim', '[]', 9,  0, 60,  100, true),
      ('demo-seed-v2', 'Pre-alignment alignment',     'other',  'Align before we align',            'kill',  'Alignment doc', 'Elena Rossi', '[]', 7, 0, 30, 100, true),
      ('demo-seed-v2', 'Competitive landscape review','update', 'Review competitor moves',          'kill',  'Intel doc shared async', 'Jordan Blake', '[]', 11, 0, 60, 100, true),
      ('demo-seed-v2', 'Sprint kickoff kickoff',      'other',  'Kick off the kickoff',             'kill',  'Sprint plan doc', 'Dan Owusu', '[]', 8, 0, 30, 100, true),
      ('demo-seed-v2', 'Monthly town hall recap',     'update', 'Recap the town hall',              'kill',  'Meeting notes + Loom clips', 'Priya Shah', '[]', 28, 0, 45, 100, true),
      ('demo-seed-v2', 'OKR check-in check-in',       'update', 'Check on OKR progress',            'kill',  'Dashboard link', 'Mei Lin', '[]', 12, 0, 30, 100, true),

      -- Async-converted batch
      ('demo-seed-v2', 'Product update broadcast',    'update', 'Share roadmap changes',            'async', 'Loom video + Slack thread',       'Priya Shah',   '["Record walkthrough","Share link"]', 18, 0, 60, 100, true),
      ('demo-seed-v2', 'Hiring bar calibration',      'update', 'Review hiring signals',            'async', 'Calibration doc with comments',  'Dan Owusu',    '["Post doc","Collect comments"]',     10, 0, 60, 100, true),
      ('demo-seed-v2', 'Security posture review',     'update', 'Brief team on security state',     'async', 'Security report + Q&A thread',   'Marcus Reed',  '["Share report","Q&A thread"]',       15, 0, 45, 100, true),
      ('demo-seed-v2', 'Analytics weekly',            'update', 'Share weekly analytics numbers',   'async', 'Automated dashboard digest',     'Jordan Blake', '["Dashboard link","Thread for Qs"]',  8,  0, 30, 100, true),
      ('demo-seed-v2', 'Design review broadcast',     'update', 'Walk through latest mocks',        'async', 'Figma prototype + written notes','Elena Rossi',  '["Share prototype","Async review"]',  12, 0, 60, 100, true),

      -- Trimmed batch (smaller, shorter)
      ('demo-seed-v2', 'Pricing committee',           'decision','Approve new pricing tier',        'trim',  '', 'Priya Shah',   '["Option comparison","Risks","Decision"]',        9, 5, 60, 100, true),
      ('demo-seed-v2', 'Architecture review',         'decision','Approve service boundaries',      'trim',  '', 'Marcus Reed',  '["Context","Proposal","Open questions","Vote"]', 10, 5, 90, 100, true),
      ('demo-seed-v2', 'Go-to-market plan',           'decision','Lock GTM plan for launch',        'trim',  '', 'Nora Kim',     '["Goals","Plan","Owners","Decision"]',            8, 4, 60, 100, true),
      ('demo-seed-v2', 'Vendor selection',            'decision','Choose a vendor',                 'trim',  '', 'Sam Patel',    '["Shortlist","Criteria","Decision"]',             7, 4, 45, 100, true),
      ('demo-seed-v2', 'Hiring debrief',              'decision','Decide on the candidate',         'trim',  '', 'Dan Owusu',    '["Feedback","Concerns","Decision"]',              6, 4, 45, 100, true),
      ('demo-seed-v2', 'Incident retro',              'decision','Agree on follow-up actions',      'trim',  '', 'Mei Lin',      '["Timeline","Root cause","Actions"]',             8, 5, 60, 100, true),

      -- Kept batch (meetings that earned their seat)
      ('demo-seed-v2', 'Board prep working session',  'decision','Finalise board narrative',         'keep',  '', 'Priya Shah',   '["Narrative","Metrics","Asks"]',                  5, 5, 90,  100, true),
      ('demo-seed-v2', 'Launch go/no-go',             'decision','Make the launch call',             'keep',  '', 'Marcus Reed',  '["Readiness","Risks","Go/No-go"]',                6, 6, 60,  100, true),
      ('demo-seed-v2', 'Executive offsite',           'decision','Set Q3/Q4 priorities',             'keep',  '', 'Priya Shah',   '["Retrospective","Priorities","Commitments"]',    6, 6, 180, 100, true),
      ('demo-seed-v2', 'Customer advisory board',     'brainstorm','Surface customer priorities',    'keep',  '', 'Elena Rossi',  '["Intros","Priorities","Synthesis"]',             7, 7, 90,  100, true),
      ('demo-seed-v2', 'Critical incident war room',  'decision','Restore service',                  'keep',  '', 'Marcus Reed',  '["Triage","Fix","Comms"]',                        5, 5, 60,  100, true);

    -- Feedback: skew strongly positive so MPS lands around +40
    -- 15 promoters (9-10), 5 passives (7-8), 5 detractors (3-5) -> (15-5)/25 = 40
    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 10 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'keep';

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 9 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'trim';

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 9 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'async' LIMIT 3;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 9 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'kill' LIMIT 3;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 8 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'async' OFFSET 3 LIMIT 2;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 7 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'kill' OFFSET 3 LIMIT 3;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 4 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'kill' OFFSET 6 LIMIT 2;

    INSERT INTO feedback (meeting_id, session_id, score)
    SELECT id, 'demo-seed-v2', 3 FROM meetings WHERE session_id = 'demo-seed-v2' AND verdict = 'kill' OFFSET 7 LIMIT 3;

  END IF;
END $$;
