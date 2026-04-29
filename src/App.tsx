import { useEffect, useRef, useState } from 'react';
import { Calendar, STATIC_EVENTS } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { Interceptor } from './components/Interceptor';
import { Logo } from './components/Logo';
import { getSessionId, supabase } from './lib/supabase';
import type { Attendee, MeetingRow } from './lib/types';
import { computeKpis } from './lib/kpi';
import { CalendarDays, ChevronDown, Loader as Loader2, Skull } from 'lucide-react';
import {
  consumeOAuthRedirect,
  disconnect as gcalDisconnect,
  importGoogleCalendarEvents,
  isConnected as gcalIsConnected,
} from './lib/google';

type EditPayload = { title: string; duration: number; attendees: Attendee[] };
type Tab = 'calendar' | 'dashboard';

const DEMO_SESSIONS = ['demo-seed', 'demo-seed-v2'];

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [prefillAttendees, setPrefillAttendees] = useState<Attendee[] | undefined>(undefined);
  const [interceptorMode, setInterceptorMode] = useState<'create' | 'interrogate'>('interrogate');
  // rows = only this session's meetings (for calendar display)
  const [rows, setRows] = useState<MeetingRow[]>([]);
  // allRows = demo-seed + this session (for KPIs on Impact tab)
  const [allRows, setAllRows] = useState<MeetingRow[]>([]);
  const [sessionFeedback, setSessionFeedback] = useState<{ score: number }[]>([]);
  const [allFeedback, setAllFeedback] = useState<{ score: number }[]>([]);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const sessionId = getSessionId();

  function flash(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3200);
  }

  async function loadData() {
    const [{ data: sessionMeetings }, { data: demoMeetings }, { data: sf }, { data: af }] =
      await Promise.all([
        supabase.from('meetings').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').in('session_id', DEMO_SESSIONS).order('created_at', { ascending: false }),
        supabase.from('feedback').select('score').eq('session_id', sessionId),
        supabase.from('feedback').select('score').in('session_id', [sessionId, ...DEMO_SESSIONS]),
      ]);

    const myRows = (sessionMeetings as MeetingRow[]) || [];
    const seedRows = (demoMeetings as MeetingRow[]) || [];
    setRows(myRows);
    setAllRows([...seedRows, ...myRows]);
    setSessionFeedback((sf as { score: number }[]) || []);
    setAllFeedback((af as { score: number }[]) || []);
  }

  const [gcalConnected, setGcalConnected] = useState<boolean>(gcalIsConnected());
  const [gcalBusy, setGcalBusy] = useState(false);
  const [gcalConfirmOpen, setGcalConfirmOpen] = useState(false);

  useEffect(() => {
    const cb = consumeOAuthRedirect();
    if (cb.kind === 'error') {
      flash('err', `Google sign-in failed: ${cb.message}`);
    }
    (async () => {
      await loadData();
      if (cb.kind === 'success') {
        setGcalConnected(true);
        await runImport();
      }
    })();
  }, []);

  async function runImport() {
    setGcalBusy(true);
    try {
      const { imported, total } = await importGoogleCalendarEvents(sessionId);
      await loadData();
      flash('ok', imported > 0
        ? `Imported ${imported} Google Calendar event${imported === 1 ? '' : 's'}.`
        : total === 0 ? 'No upcoming Google Calendar events found.' : 'Calendar already up to date.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      flash('err', msg);
      if (/expired|reconnect/i.test(msg)) setGcalConnected(false);
    } finally {
      setGcalBusy(false);
    }
  }

  function handleGcalClick() {
    if (gcalConnected) {
      runImport();
      return;
    }
    setGcalConfirmOpen(true);
  }

  function handleGcalConfirm() {
    setGcalConfirmOpen(false);
    window.location.href = 'https://mail.google.com/mail/u/0/#inbox';
  }

  function handleGcalDisconnect() {
    gcalDisconnect();
    setGcalConnected(false);
    flash('ok', 'Disconnected from Google Calendar.');
  }

  // Session KPIs: only what the user did this session (for sidebar)
  const sessionKpis = computeKpis(rows, sessionFeedback);
  // All-time KPIs: demo seed + session (for Impact tab)
  const allKpis = computeKpis(allRows, allFeedback);

  function openInterceptor(suggestedTitle = '') {
    setInitialTitle(suggestedTitle);
    setPrefillAttendees(undefined);
    setInterceptorMode('create');
    setShowInterceptor(true);
  }

  function openInterceptorWithPayload({ title, duration: _d, attendees }: EditPayload) {
    setInitialTitle(title);
    setPrefillAttendees(attendees);
    setInterceptorMode('interrogate');
    setShowInterceptor(true);
  }

  function openInterceptorForRow(row: MeetingRow) {
    setInitialTitle(row.title);
    const count = row.attendees_proposed;
    const synthetic: Attendee[] = Array.from({ length: count }, (_, i) => ({
      name: `Attendee ${i + 1}`,
      role: 'Team member',
      rate: Number(row.avg_hourly_rate) || 100,
      essential: false,
      reason: '',
    }));
    setPrefillAttendees(synthetic);
    setInterceptorMode('interrogate');
    setShowInterceptor(true);
  }

  return (
    <div className="min-h-full" style={{ background: '#16130b' }}>
      <header className="sticky top-0 z-20" style={{ background: '#110e07', borderBottom: '1px solid #4d4635' }}>
        <div className="h-1.5 caution-tape" style={{ opacity: 0.7 }} />
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <GCalButton
              connected={gcalConnected}
              busy={gcalBusy}
              onClick={handleGcalClick}
              onDisconnect={handleGcalDisconnect}
            />
            <nav className="flex items-center" style={{ border: '1px solid #4d4635' }}>
              <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')}>CALENDAR</TabBtn>
              <div style={{ width: 1, background: '#4d4635', alignSelf: 'stretch' }} />
              <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>IMPACT</TabBtn>
            </nav>
          </div>
          <KillMeetingPicker
            savedRows={rows.filter((r) => !(r.accepted && (r.verdict === 'kill' || r.verdict === 'async')))}
            onPickRow={openInterceptorForRow}
            onPickStatic={(ev) => openInterceptorWithPayload({ title: ev.title, duration: ev.duration, attendees: ev.attendees })}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        {tab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <Calendar
              onNew={() => openInterceptor('Untitled meeting')}
              onEdit={openInterceptorWithPayload}
              rows={rows}
              onEditRow={openInterceptorForRow}
            />
            <SidePanel kpis={sessionKpis} />
          </div>
        ) : (
          <Dashboard kpis={allKpis} rows={allRows} sessionKpis={sessionKpis} />
        )}
      </main>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] font-sans font-medium text-sm px-4 py-2.5 fade-in"
          style={{
            background: toast.kind === 'err' ? '#1a0a0a' : '#0a1a0e',
            color: toast.kind === 'err' ? '#eb5757' : '#4caf7d',
            border: `1px solid ${toast.kind === 'err' ? '#eb5757' : '#4caf7d'}`,
            boxShadow: '4px 4px 0 #000',
            letterSpacing: '0.02em',
          }}
        >
          {toast.msg}
        </div>
      )}

      {gcalConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setGcalConfirmOpen(false)}
        >
          <div
            className="max-w-md w-full fade-in"
            style={{ background: '#16130b', border: '2px solid #000', boxShadow: '6px 6px 0 #000' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 caution-tape" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="w-6 h-6" strokeWidth={3} style={{ color: '#2d9cdb' }} />
                <div
                  className="font-display font-black text-xl"
                  style={{ color: '#eae1d4', letterSpacing: '-0.02em' }}
                >
                  CONNECT GOOGLE CALENDAR
                </div>
              </div>
              <p
                className="font-sans text-sm leading-relaxed mb-5"
                style={{ color: '#c8bfa8' }}
              >
                You&apos;re about to connect your Google Calendar. You&apos;ll be redirected to an
                authorization screen to grant Meet is Murder permission to read your events.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setGcalConfirmOpen(false)}
                  className="font-display font-black text-xs px-4 py-2.5"
                  style={{
                    background: 'transparent',
                    color: '#99907b',
                    border: '2px solid #4d4635',
                    letterSpacing: '0.02em',
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleGcalConfirm}
                  className="btn-stamp inline-flex items-center gap-2 font-display font-black text-xs px-4 py-2.5"
                  style={{
                    background: '#2d9cdb',
                    color: '#000',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0 #000',
                    letterSpacing: '0.02em',
                  }}
                >
                  <CalendarDays className="w-3.5 h-3.5" strokeWidth={3} />
                  CONTINUE TO GOOGLE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInterceptor && (
        <Interceptor
          initialTitle={initialTitle}
          initialAttendees={prefillAttendees}
          mode={interceptorMode}
          onClose={() => setShowInterceptor(false)}
          onCommit={async ({ draft, answers, rec, accepted }) => {
            const attendeesRec =
              accepted && (rec.verdict === 'kill' || rec.verdict === 'async')
                ? 0
                : accepted
                ? rec.recommendedAttendees.length
                : draft.attendees.length;
            const duration =
              accepted && rec.verdict !== 'kill' && rec.verdict !== 'async'
                ? rec.recommendedDuration
                : draft.duration;

            const payload = {
              session_id: sessionId,
              title: draft.title,
              goal: answers.goal,
              outcome: answers.outcome,
              verdict: rec.verdict,
              async_alternative: rec.asyncAlternative,
              owner: rec.owner,
              agenda: rec.agenda,
              attendees_proposed: draft.attendees.length,
              attendees_recommended: attendeesRec,
              duration_minutes: duration,
              avg_hourly_rate: 100,
              accepted,
            };

            // Optimistic row so the UI updates the instant the modal closes —
            // even before the round-trip completes. Reconciled by loadData()
            // once the insert returns.
            const tempId = `temp-${crypto.randomUUID()}`;
            const optimistic: MeetingRow = {
              id: tempId,
              created_at: new Date().toISOString(),
              ...payload,
            } as MeetingRow;
            setRows((prev) => [optimistic, ...prev]);
            setAllRows((prev) => [optimistic, ...prev]);
            setShowInterceptor(false);

            const wasKilled =
              accepted && (rec.verdict === 'kill' || rec.verdict === 'async');
            if (wasKilled) setTab('dashboard');
            else setTab('calendar');

            const { data, error } = await supabase
              .from('meetings')
              .insert(payload)
              .select()
              .maybeSingle();

            if (error || !data) {
              // Roll back the optimistic row and tell the user.
              setRows((prev) => prev.filter((r) => r.id !== tempId));
              setAllRows((prev) => prev.filter((r) => r.id !== tempId));
              flash('err', `Could not save meeting: ${error?.message ?? 'unknown error'}`);
              return;
            }

            const saved = data as MeetingRow;
            if (rec.verdict === 'keep' && accepted) {
              await supabase.from('feedback').insert({ meeting_id: saved.id, session_id: sessionId, score: 9 });
            } else if (rec.verdict === 'kill' && !accepted) {
              await supabase.from('feedback').insert({ meeting_id: saved.id, session_id: sessionId, score: 4 });
            }

            // Reconcile with the real server state (replaces the optimistic row).
            await loadData();
            flash('ok', wasKilled ? 'Meeting killed — case filed.' : 'Meeting filed to your calendar.');
          }}
        />
      )}
    </div>
  );
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
function formatHour(h: number) {
  return h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
}

function KillMeetingPicker({
  savedRows,
  onPickRow,
  onPickStatic,
}: {
  savedRows: MeetingRow[];
  onPickRow: (row: MeetingRow) => void;
  onPickStatic: (ev: typeof STATIC_EVENTS[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const aliveStatic = STATIC_EVENTS.filter((e) => e.type === 'alive');
  const hasAny = savedRows.length > 0 || aliveStatic.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-4 py-2.5"
        style={{ background: '#eb5757', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', letterSpacing: '-0.01em' }}
      >
        <Skull className="w-4 h-4" strokeWidth={3} /> KILL A MEETING
        <ChevronDown className="w-4 h-4" strokeWidth={3} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[340px] z-30 fade-in"
          style={{ background: '#1f1b13', border: '2px solid #000', boxShadow: '4px 4px 0px #000' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: 48, height: 3, background: '#eb5757' }} />
          <div
            className="px-4 py-2.5 font-sans font-medium text-[10px] tracking-[0.2em] uppercase"
            style={{ color: '#99907b', borderBottom: '1px solid #4d4635', background: '#231f17' }}
          >
            Pick a suspect from the calendar
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {!hasAny && (
              <div className="px-4 py-6 text-center font-sans text-xs" style={{ color: '#4d4635' }}>
                No meetings on your calendar yet.
              </div>
            )}

            {savedRows.length > 0 && (
              <div>
                <SectionLabel>Your meetings</SectionLabel>
                {savedRows.map((r) => (
                  <PickerRow
                    key={r.id}
                    title={r.title || 'Untitled'}
                    sub={`${r.duration_minutes}m · ${r.attendees_proposed} attendees · ${r.goal}`}
                    onClick={() => { setOpen(false); onPickRow(r); }}
                  />
                ))}
              </div>
            )}

            {aliveStatic.length > 0 && (
              <div>
                <SectionLabel>This week's calendar</SectionLabel>
                {aliveStatic.map((ev) => (
                  <PickerRow
                    key={`${ev.day}-${ev.start}-${ev.title}`}
                    title={ev.title}
                    sub={`${DAY_NAMES[ev.day]} ${formatHour(ev.start)} · ${ev.duration}m · ${ev.attendees.length} attendees`}
                    onClick={() => { setOpen(false); onPickStatic(ev); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 pt-3 pb-1.5 font-sans font-medium text-[10px] tracking-[0.18em] uppercase"
      style={{ color: '#4d4635' }}
    >
      {children}
    </div>
  );
}

function PickerRow({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 flex items-start gap-3 transition"
      style={{ borderTop: '1px solid #2d2a21', background: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#231f17'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <Skull className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#eb5757' }} />
      <div className="min-w-0">
        <div className="font-sans font-medium text-sm truncate" style={{ color: '#eae1d4' }}>{title}</div>
        <div className="font-sans text-[11px] mt-0.5 truncate" style={{ color: '#99907b' }}>{sub}</div>
      </div>
    </button>
  );
}

function GCalButton({
  connected,
  busy,
  onClick,
  onDisconnect,
}: {
  connected: boolean;
  busy: boolean;
  onClick: () => void;
  onDisconnect: () => void;
}) {
  const accent = connected ? '#4caf7d' : '#2d9cdb';
  const label = busy
    ? 'SYNCING…'
    : connected
    ? 'SYNC GOOGLE CALENDAR'
    : 'CONNECT GOOGLE CALENDAR';
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={busy}
        className="btn-stamp inline-flex items-center gap-2 font-display font-black text-xs px-3.5 py-2.5"
        style={{
          background: accent,
          color: '#000',
          border: '2px solid #000',
          boxShadow: '3px 3px 0px #000',
          letterSpacing: '0.02em',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={3} />
        ) : (
          <CalendarDays className="w-3.5 h-3.5" strokeWidth={3} />
        )}
        {label}
      </button>
      {connected && !busy && (
        <button
          onClick={onDisconnect}
          className="font-sans font-medium text-[10px] tracking-[0.15em] uppercase px-2 py-1"
          style={{ color: '#99907b', border: '1px solid #4d4635', background: 'transparent' }}
          title="Disconnect Google Calendar"
        >
          ×
        </button>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-sans font-medium text-xs tracking-[0.18em] px-5 py-2.5 transition"
      style={{
        color: active ? '#000' : '#99907b',
        background: active ? '#f2c94c' : 'transparent',
        borderBottom: active ? '2px solid #000' : '2px solid transparent',
      }}
    >
      {children}
    </button>
  );
}

function SidePanel({ kpis }: {
  kpis: { avoided: number; attendeeHoursSaved: number; costSaved: number; mps: number };
}) {
  return (
    <aside className="space-y-4">
      <div className="relative overflow-hidden px-5 py-5"
        style={{ background: '#1f1b13', border: '2px solid #4d4635', boxShadow: '4px 4px 0px #000' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 56, height: 3, background: '#f2c94c' }} />
        <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
          <Skull className="w-28 h-28" style={{ color: '#eae1d4' }} />
        </div>
        <div className="font-sans text-[10px] tracking-[0.22em] uppercase mt-1" style={{ color: '#4d4635' }}>Manifesto</div>
        <div className="font-display font-black text-xl mt-2 leading-tight" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>
          Every meeting is guilty until proven useful.
        </div>
        <p className="font-sans text-sm mt-3 leading-relaxed" style={{ color: '#99907b' }}>
          We intercept before it hits calendars, interrogate with two questions, then kill, trim, or approve.
        </p>
      </div>

      <div style={{ background: '#1f1b13', border: '1px solid #4d4635' }}>
        <div className="px-4 py-2.5 font-sans font-medium text-[10px] tracking-[0.18em] uppercase"
          style={{ borderBottom: '1px solid #4d4635', color: '#4d4635', background: '#231f17' }}>
          This session
        </div>
        <div>
          <StatRow label="Meetings avoided" value={String(kpis.avoided)} accent="#eb5757" />
          <StatRow label="Attendee-hours saved" value={kpis.attendeeHoursSaved.toFixed(1)} accent="#f2c94c" />
          <StatRow
            label="Cost saved"
            value={kpis.costSaved >= 1000 ? `£${(kpis.costSaved / 1000).toFixed(1)}k` : `£${Math.round(kpis.costSaved)}`}
            accent="#2d9cdb"
          />
          <StatRow
            label="Meeting Promoter Score"
            value={kpis.mps > 0 ? `+${kpis.mps}` : kpis.mps === 0 ? '—' : String(kpis.mps)}
            accent="#4caf7d"
          />
        </div>
      </div>
    </aside>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #2d2a21' }}>
      <div className="font-sans text-sm" style={{ color: '#99907b' }}>{label}</div>
      <div className="font-display font-black text-lg" style={{ color: accent, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
