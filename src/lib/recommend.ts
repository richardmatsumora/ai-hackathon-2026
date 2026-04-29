import type { Attendee, Goal, MeetingDraft, Recommendation, Verdict } from './types';

const KEEP_ROLES: Record<Goal, string[]> = {
  decision: ['VP', 'Head', 'Director', 'Lead', 'Owner', 'PM'],
  update: ['Lead', 'Manager'],
  brainstorm: ['Designer', 'Engineer', 'PM', 'Researcher'],
  other: ['Lead', 'PM'],
};

export function recommend(
  draft: MeetingDraft,
  answers: { goal: Goal; outcome: string }
): Recommendation {
  const { goal, outcome } = answers;
  const hasOutcome = outcome.trim().length > 6;

  let verdict: Verdict = 'keep';
  let headline = '';
  let asyncAlternative = '';

  if (!hasOutcome) {
    verdict = 'kill';
    headline = 'No outcome, no meeting. Come back when you know what you want.';
    asyncAlternative = 'Write the question you want answered in a Doc. Tag one person. Ask them to reply.';
  } else if (goal === 'update') {
    verdict = 'async';
    headline = 'This is a status update. It does not need a pulse.';
    asyncAlternative = 'Post a 5-bullet Loom or a written update in the team channel. Require two reactions, not a room.';
  } else if (goal === 'brainstorm' && draft.attendees.length > 6) {
    verdict = 'trim';
    headline = 'Too many brains. Brainstorms die past six people.';
    asyncAlternative = 'Kick off async in a shared doc. Converge live with only the 4-5 contributors you actually need.';
  } else if (goal === 'decision' && draft.attendees.length > 7) {
    verdict = 'trim';
    headline = 'Decisions get slower with every extra body in the room.';
    asyncAlternative = 'Keep the decider + 2-3 advisors. Share the pre-read async to everyone else.';
  } else {
    verdict = 'keep';
    headline = 'Fine. This one survives. Make it count.';
    asyncAlternative = '';
  }

  const keywords = KEEP_ROLES[goal];
  const scored: Attendee[] = draft.attendees.map((a) => {
    const essential =
      keywords.some((k) => a.role.toLowerCase().includes(k.toLowerCase())) ||
      a.essential;
    const reason = essential
      ? roleReason(goal, a.role)
      : 'No clear decision or contribution. Send notes instead.';
    return { ...a, essential, reason };
  });

  let recommendedAttendees = scored.filter((a) => a.essential);
  if (recommendedAttendees.length === 0) {
    recommendedAttendees = scored.slice(0, Math.min(2, scored.length)).map((a) => ({
      ...a,
      essential: true,
      reason: roleReason(goal, a.role),
    }));
  }
  const droppedAttendees = scored.filter(
    (a) => !recommendedAttendees.find((r) => r.name === a.name)
  );

  const owner =
    recommendedAttendees.find((a) => /lead|head|pm|manager|director|vp/i.test(a.role))
      ?.name ||
    recommendedAttendees[0]?.name ||
    'Unassigned';

  const agenda = buildAgenda(goal, outcome, verdict);
  const recommendedDuration =
    verdict === 'keep'
      ? Math.min(draft.duration, goal === 'decision' ? 25 : 30)
      : Math.max(15, Math.floor(draft.duration / 2));

  return {
    verdict,
    headline,
    asyncAlternative,
    owner,
    agenda,
    recommendedAttendees,
    droppedAttendees,
    recommendedDuration,
  };
}

function roleReason(goal: Goal, role: string): string {
  if (/VP|Head|Director/i.test(role)) return 'Decision authority.';
  if (/Lead|Manager/i.test(role)) return 'Owns the delivery thread.';
  if (/PM/i.test(role)) return 'Drives scope and trade-offs.';
  if (/Engineer/i.test(role)) return goal === 'brainstorm' ? 'Contributes technical shape.' : 'Implements the outcome.';
  if (/Design/i.test(role)) return 'Shapes the experience.';
  return 'Directly affected by the outcome.';
}

function buildAgenda(goal: Goal, outcome: string, verdict: Verdict): string[] {
  if (verdict === 'kill' || verdict === 'async') return [];
  const common = [`Context (3 min): why we are here`, `Target: ${outcome || 'clarify outcome'}`];
  if (goal === 'decision') return [...common, 'Options on the table (7 min)', 'Decide + owner + date (5 min)'];
  if (goal === 'brainstorm') return [...common, 'Silent generation (5 min)', 'Cluster + vote (10 min)', 'Next actions (5 min)'];
  if (goal === 'update') return [...common, 'Blockers only (10 min)', 'Next checkpoint (2 min)'];
  return [...common, 'Discussion (10 min)', 'Actions + owners (5 min)'];
}
