export type Goal = 'decision' | 'update' | 'brainstorm' | 'other';

export type Verdict = 'kill' | 'async' | 'trim' | 'keep';

export type Attendee = {
  name: string;
  role: string;
  rate: number;
  essential: boolean;
  reason: string;
};

export type MeetingDraft = {
  title: string;
  duration: number;
  attendees: Attendee[];
};

export type InterceptAnswers = {
  goal: Goal;
  outcome: string;
};

export type Recommendation = {
  verdict: Verdict;
  headline: string;
  asyncAlternative: string;
  owner: string;
  agenda: string[];
  recommendedAttendees: Attendee[];
  droppedAttendees: Attendee[];
  recommendedDuration: number;
};

export type MeetingRow = {
  id: string;
  session_id: string;
  title: string;
  goal: string;
  outcome: string;
  verdict: string;
  async_alternative: string;
  owner: string;
  agenda: string[];
  attendees_proposed: number;
  attendees_recommended: number;
  duration_minutes: number;
  avg_hourly_rate: number;
  accepted: boolean;
  created_at: string;
  source?: string;
  external_id?: string | null;
};
