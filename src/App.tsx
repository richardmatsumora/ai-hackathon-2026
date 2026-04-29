import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { Interceptor } from './components/Interceptor';
import { Logo } from './components/Logo';
import { getSessionId, supabase } from './lib/supabase';
import type { MeetingRow } from './lib/types';
import { computeKpis } from './lib/kpi';
import { Skull } from 'lucide-react';

type Tab = 'calendar' | 'dashboard';

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [rows, setRows] = useState<MeetingRow[]>([]);
  const [feedback, setFeedback] = useState<{ score: number }[]>([]);
  const sessionId = getSessionId();

  async function loadData() {
    const { data: m } = await supabase
      .from('meetings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    const { data: f } = await supabase
      .from('feedback')
      .select('score')
      .eq('session_id', sessionId);
    setRows((m as MeetingRow[]) || []);
    setFeedback((f as { score: number }[]) || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const kpis = computeKpis(rows, feedback);

  function openInterceptor(suggestedTitle = '') {
    setInitialTitle(suggestedTitle);
    setShowInterceptor(true);
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-bone/80 border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-1 bg-white rounded-lg p-1 border border-ink-100 shadow-soft">
            <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')}>
              Calendar
            </TabBtn>
            <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
              Impact
            </TabBtn>
          </nav>
          <button
            onClick={() => openInterceptor('')}
            className="inline-flex items-center gap-2 rounded-lg bg-blood-600 hover:bg-blood-700 text-white text-sm font-medium px-3 py-2"
          >
            <Skull className="w-4 h-4" /> Kill a meeting
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        {tab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <Calendar onNew={() => openInterceptor('Untitled meeting')} />
            <SidePanel kpis={kpis} onCreate={() => openInterceptor('')} />
          </div>
        ) : (
          <Dashboard kpis={kpis} rows={rows} />
        )}
      </main>

      {showInterceptor && (
        <Interceptor
          initialTitle={initialTitle}
          onClose={() => setShowInterceptor(false)}
          onCommit={async ({ draft, answers, rec, accepted }) => {
            const attendeesRec =
              accepted && (rec.verdict === 'kill' || rec.verdict === 'async')
                ? 0
                : accepted
                ? rec.recommendedAttendees.length
                : draft.attendees.length;
            const duration =
              accepted && (rec.verdict === 'kill' || rec.verdict === 'async')
                ? 0
                : accepted
                ? rec.recommendedDuration
                : draft.duration;

            const avgRate =
              draft.attendees.reduce((sum, a) => sum + a.rate, 0) /
              Math.max(1, draft.attendees.length);

            const { data, error } = await supabase
              .from('meetings')
              .insert({
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
                avg_hourly_rate: avgRate,
                accepted,
              })
              .select()
              .maybeSingle();

            if (!error && data) {
              // synthesise feedback for meetings that survived, to power MPS
              if (rec.verdict === 'keep' && accepted) {
                const score = 9;
                await supabase.from('feedback').insert({
                  meeting_id: (data as MeetingRow).id,
                  session_id: sessionId,
                  score,
                });
              } else if (rec.verdict === 'kill' && !accepted) {
                await supabase.from('feedback').insert({
                  meeting_id: (data as MeetingRow).id,
                  session_id: sessionId,
                  score: 4,
                });
              }
            }
            setShowInterceptor(false);
            await loadData();
            setTab('dashboard');
          }}
        />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${
        active ? 'bg-ink-800 text-white' : 'text-ink-500 hover:text-ink-800'
      }`}
    >
      {children}
    </button>
  );
}

function SidePanel({
  kpis,
  onCreate,
}: {
  kpis: { avoided: number; attendeeHoursSaved: number; costSaved: number };
  onCreate: () => void;
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl blade text-white p-5 shadow-soft relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Skull className="w-32 h-32" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">Manifesto</div>
        <div className="font-display text-xl mt-1 leading-snug">
          Every meeting is guilty<br /> until proven useful.
        </div>
        <p className="text-sm opacity-90 mt-3">
          We intercept before it hits calendars, ask two questions, and kill, trim, or approve.
        </p>
        <button
          onClick={onCreate}
          className="mt-4 w-full rounded-lg bg-white text-blood-700 font-medium text-sm px-3 py-2 hover:bg-blood-50 transition"
        >
          Try it now
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
        <div className="text-xs uppercase tracking-[0.18em] text-ink-400">This session</div>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Meetings avoided" value={String(kpis.avoided)} />
          <Row label="Hours saved" value={kpis.attendeeHoursSaved.toFixed(1)} />
          <Row
            label="Cost saved"
            value={
              kpis.costSaved >= 1000 ? `£${(kpis.costSaved / 1000).toFixed(1)}k` : `£${Math.round(kpis.costSaved)}`
            }
          />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-ink-500">{label}</div>
      <div className="font-display text-ink-900">{value}</div>
    </div>
  );
}
