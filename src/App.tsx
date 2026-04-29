import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { Dashboard } from './components/Dashboard';
import { Interceptor } from './components/Interceptor';
import { Logo } from './components/Logo';
import { getSessionId, supabase } from './lib/supabase';
import type { Attendee, MeetingRow } from './lib/types';
import { computeKpis } from './lib/kpi';
import { Skull } from 'lucide-react';

type EditPayload = { title: string; duration: number; attendees: Attendee[] };

type Tab = 'calendar' | 'dashboard';

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [prefillAttendees, setPrefillAttendees] = useState<Attendee[] | undefined>(undefined);
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
    setPrefillAttendees(undefined);
    setShowInterceptor(true);
  }

  function openInterceptorWithPayload({ title, duration: _d, attendees }: EditPayload) {
    setInitialTitle(title);
    setPrefillAttendees(attendees);
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
    setShowInterceptor(true);
  }

  return (
    <div className="min-h-full" style={{ background: '#16130b' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{ background: '#110e07', borderBottom: '1px solid #4d4635' }}
      >
        {/* Caution-tape top strip */}
        <div className="h-1.5 caution-tape" style={{ opacity: 0.7 }} />

        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Logo />

          {/* Tabs */}
          <nav className="flex items-center" style={{ border: '1px solid #4d4635' }}>
            <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')}>
              CALENDAR
            </TabBtn>
            <div style={{ width: 1, background: '#4d4635', alignSelf: 'stretch' }} />
            <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
              IMPACT
            </TabBtn>
          </nav>

          {/* CTA */}
          <button
            onClick={() => openInterceptor('')}
            className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-4 py-2.5"
            style={{
              background: '#eb5757',
              color: '#000',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px #000',
              letterSpacing: '-0.01em',
            }}
          >
            <Skull className="w-4 h-4" strokeWidth={3} /> KILL A MEETING
          </button>
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
            <SidePanel kpis={kpis} onCreate={() => openInterceptor('')} />
          </div>
        ) : (
          <Dashboard kpis={kpis} rows={rows} />
        )}
      </main>

      {showInterceptor && (
        <Interceptor
          initialTitle={initialTitle}
          initialAttendees={prefillAttendees}
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
              if (rec.verdict === 'keep' && accepted) {
                await supabase.from('feedback').insert({
                  meeting_id: (data as MeetingRow).id,
                  session_id: sessionId,
                  score: 9,
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

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
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

function SidePanel({ kpis, onCreate }: {
  kpis: { avoided: number; attendeeHoursSaved: number; costSaved: number };
  onCreate: () => void;
}) {
  return (
    <aside className="space-y-4">
      {/* Manifesto card */}
      <div
        className="relative overflow-hidden px-5 py-5"
        style={{
          background: '#1f1b13',
          border: '2px solid #4d4635',
          boxShadow: '4px 4px 0px #000',
        }}
      >
        {/* Yellow tab */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 56, height: 3, background: '#f2c94c' }} />
        {/* Background skull watermark */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.04]">
          <Skull className="w-28 h-28" style={{ color: '#eae1d4' }} />
        </div>

        <div className="font-sans text-[10px] tracking-[0.22em] uppercase mt-1" style={{ color: '#4d4635' }}>
          Manifesto
        </div>
        <div className="font-display font-black text-xl mt-2 leading-tight" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>
          Every meeting is guilty until proven useful.
        </div>
        <p className="font-sans text-sm mt-3 leading-relaxed" style={{ color: '#99907b' }}>
          We intercept before it hits calendars, interrogate with two questions, then kill, trim, or approve.
        </p>
        <button
          onClick={onCreate}
          className="btn-stamp mt-4 w-full font-display font-black text-sm py-2.5"
          style={{
            background: '#f2c94c',
            color: '#000',
            border: '2px solid #000',
            boxShadow: '4px 4px 0px #000',
            letterSpacing: '-0.01em',
          }}
        >
          INTERROGATE A MEETING
        </button>
      </div>

      {/* Session stats */}
      <div style={{ background: '#1f1b13', border: '1px solid #4d4635' }}>
        <div className="px-4 py-2.5 font-sans font-medium text-[10px] tracking-[0.18em] uppercase"
          style={{ borderBottom: '1px solid #4d4635', color: '#4d4635', background: '#231f17' }}>
          This session
        </div>
        <div className="divide-y" style={{ borderColor: '#2d2a21' }}>
          <StatRow label="Meetings avoided" value={String(kpis.avoided)} accent="#eb5757" />
          <StatRow label="Hours saved" value={kpis.attendeeHoursSaved.toFixed(1)} accent="#f2c94c" />
          <StatRow
            label="Cost saved"
            value={kpis.costSaved >= 1000 ? `£${(kpis.costSaved / 1000).toFixed(1)}k` : `£${Math.round(kpis.costSaved)}`}
            accent="#2d9cdb"
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
