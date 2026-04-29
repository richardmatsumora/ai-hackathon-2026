/**
 * api.js — Google Calendar API handler
 *
 * Manages OAuth tokens via chrome.identity and exposes a single
 * createCalendarEvent() function that panel.js calls on form submission.
 */

const CalendarAPI = (() => {
  const CALENDAR_EVENTS_URL =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  /**
   * Get a valid OAuth token. Removes a cached token and retries once
   * if the first attempt returns a 401.
   */
  async function getToken(interactive = true) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });
  }

  async function removeCachedToken(token) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, resolve);
    });
  }

  /**
   * Build a Google Calendar Event resource from the form submission.
   *
   * @param {object} payload
   * @param {string}   payload.title
   * @param {string}   payload.date        — YYYY-MM-DD
   * @param {string}   payload.time        — HH:MM (24h)
   * @param {number}   payload.duration    — minutes
   * @param {string}   payload.location
   * @param {string}   payload.description — agenda / notes
   * @param {string[]} payload.emails      — attendee email addresses
   * @param {string}   payload.goal        — stored as extendedProperty
   * @param {string}   payload.outcome     — stored as extendedProperty
   * @param {string}   payload.verdict     — stored as extendedProperty
   */
  function buildEventBody(payload) {
    const { title, date, time, duration, location, description, emails, goal, outcome, verdict } = payload;

    const startDT = new Date(`${date}T${time}:00`);
    const endDT   = new Date(startDT.getTime() + duration * 60 * 1000);

    // Use local timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const toRFC3339 = (dt) => dt.toISOString();

    const event = {
      summary: title,
      location: location || undefined,
      description: description || undefined,
      start: { dateTime: toRFC3339(startDT), timeZone: tz },
      end:   { dateTime: toRFC3339(endDT),   timeZone: tz },
      extendedProperties: {
        private: {
          mimGoal:    goal    || '',
          mimOutcome: outcome || '',
          mimVerdict: verdict || '',
        },
      },
    };

    if (emails && emails.length > 0) {
      event.attendees = emails.map((email) => ({ email }));
    }

    return event;
  }

  /**
   * Create a Google Calendar event. Handles token expiry with one retry.
   *
   * @param {object} payload  — see buildEventBody for shape
   * @returns {Promise<object>}  the created event resource
   */
  async function createCalendarEvent(payload) {
    let token = await getToken(true);
    const body = buildEventBody(payload);

    const attempt = async (t) => {
      const res = await fetch(CALENDAR_EVENTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        // Token expired — remove it and signal for retry
        await removeCachedToken(t);
        return null;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error?.message || `Calendar API error ${res.status}`
        );
      }

      return res.json();
    };

    let result = await attempt(token);
    if (result === null) {
      // Retry once with a fresh token
      token = await getToken(true);
      result = await attempt(token);
    }

    if (result === null) {
      throw new Error('Authentication failed. Please sign in again.');
    }

    return result;
  }

  return { createCalendarEvent };
})();
