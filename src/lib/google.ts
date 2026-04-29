import { supabase } from './supabase';
import type { MeetingRow } from './types';

const TOKEN_KEY = 'mim.gcal.token';
const EXPIRY_KEY = 'mim.gcal.expiry';
const STATE_KEY = 'mim.gcal.oauth_state';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function hasGoogleClientId(): boolean {
  return typeof CLIENT_ID === 'string' && CLIENT_ID.length > 0;
}

export function isConnected(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  return !!token && Date.now() < expiry;
}

export function disconnect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function beginOAuth() {
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set. Add it to .env.');
  }
  const state = crypto.randomUUID();
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    include_granted_scopes: 'true',
    state,
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type OAuthCallback =
  | { kind: 'none' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export function consumeOAuthRedirect(): OAuthCallback {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash.includes('access_token') && !hash.includes('error')) {
    return { kind: 'none' };
  }
  const params = new URLSearchParams(hash);
  const err = params.get('error');
  const token = params.get('access_token');
  const expiresIn = Number(params.get('expires_in') || 0);
  const returnedState = params.get('state');
  const expectedState = localStorage.getItem(STATE_KEY);

  history.replaceState(null, '', window.location.pathname + window.location.search);
  localStorage.removeItem(STATE_KEY);

  if (err) return { kind: 'error', message: err };
  if (!token) return { kind: 'none' };
  if (returnedState && expectedState && returnedState !== expectedState) {
    return { kind: 'error', message: 'OAuth state mismatch' };
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + Math.max(0, expiresIn - 60) * 1000));
  return { kind: 'success' };
}

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string; organizer?: boolean }[];
  organizer?: { email?: string; displayName?: string };
};

async function fetchEventsPage(token: string, pageToken?: string): Promise<{ items: GCalEvent[]; nextPageToken?: string }> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    timeMin,
    timeMax,
  });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    if (res.status === 401) {
      disconnect();
      throw new Error('Google session expired. Please reconnect.');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Google Calendar error ${res.status}`);
  }
  return res.json();
}

function mapEventToRow(ev: GCalEvent, sessionId: string) {
  const startIso = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T09:00:00` : null);
  const endIso = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T10:00:00` : null);
  let duration = 30;
  if (startIso && endIso) {
    const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
    if (diff > 0 && diff < 24 * 60) duration = Math.round(diff);
  }
  const attendees = ev.attendees?.length ?? 1;
  const owner = ev.organizer?.displayName || ev.organizer?.email || '';

  return {
    session_id: sessionId,
    title: ev.summary || 'Untitled event',
    goal: 'other',
    outcome: (ev.description || '').slice(0, 500),
    verdict: 'keep',
    async_alternative: '',
    owner,
    agenda: [],
    attendees_proposed: attendees,
    attendees_recommended: attendees,
    duration_minutes: duration,
    avg_hourly_rate: 100,
    accepted: true,
    source: 'google',
    external_id: ev.id,
  };
}

export async function importGoogleCalendarEvents(sessionId: string): Promise<{ imported: number; total: number }> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('Not connected to Google Calendar.');

  const events: GCalEvent[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchEventsPage(token, pageToken);
    events.push(...(page.items || []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  const rows = events
    .filter((e) => e.start && (e.start.dateTime || e.start.date))
    .map((e) => mapEventToRow(e, sessionId));

  if (rows.length === 0) return { imported: 0, total: 0 };

  const { data, error } = await supabase
    .from('meetings')
    .upsert(rows as Partial<MeetingRow>[], { onConflict: 'session_id,external_id', ignoreDuplicates: false })
    .select('id');

  if (error) throw new Error(error.message);
  return { imported: data?.length ?? 0, total: rows.length };
}
