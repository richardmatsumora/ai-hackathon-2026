import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Plus, Skull, Sparkles, Trash2, Users, X, Zap, TriangleAlert as AlertTriangle } from 'lucide-react';
import type { Attendee, Goal, MeetingDraft, Recommendation, Verdict } from '../lib/types';
import { recommend } from '../lib/recommend';
import { TEAM } from '../lib/seed';
import { Logo } from './Logo';

type Props = {
  initialTitle: string;
  initialAttendees?: Attendee[];
  mode?: 'create' | 'interrogate';
  onClose: () => void;
  onCommit: (payload: {
    draft: MeetingDraft;
    answers: { goal: Goal; outcome: string };
    rec: Recommendation;
    accepted: boolean;
  }) => Promise<void>;
};

const ROLE_SUGGESTIONS = [
  'VP Product', 'Engineering Lead', 'Senior PM', 'Staff Engineer',
  'Product Designer', 'Data Analyst', 'Customer Success', 'Marketing Manager',
  'Frontend Engineer', 'QA Engineer', 'CEO', 'CTO', 'Head of Design',
  'Sales Lead', 'Operations Manager',
];

export function Interceptor({ initialTitle, initialAttendees, mode = 'interrogate', onClose, onCommit }: Props) {
  const [step, setStep] = useState<'brief' | 'questions' | 'verdict'>('brief');
  const [title, setTitle] = useState(initialTitle);
  const [duration, setDuration] = useState(45);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState<Attendee[]>(initialAttendees ?? []);
  const [goal, setGoal] = useState<Goal>('decision');
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('');
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const draft: MeetingDraft = { title, duration, attendees: selected };
  const rec = useMemo(() => recommend(draft, { goal, outcome }), [draft, goal, outcome]);

  const filteredRoles = addRole.length > 0
    ? ROLE_SUGGESTIONS.filter((r) => r.toLowerCase().includes(addRole.toLowerCase()) && r !== addRole)
    : [];

  function addAttendee() {
    const name = addName.trim();
    const role = addRole.trim();
    if (!name || !role) return;
    if (selected.find((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSelected((prev) => [
      ...prev,
      { name, role, rate: 100, essential: false, reason: '' },
    ]);
    setAddName(''); setAddRole('');
    setShowRoleSuggestions(false);
    nameRef.current?.focus();
  }

  function addFromTeam(a: Attendee) {
    if (!selected.find((s) => s.name === a.name)) {
      setSelected((prev) => [...prev, { ...a }]);
    }
  }

  function removeAttendee(name: string) {
    setSelected((prev) => prev.filter((a) => a.name !== name));
  }

  async function commit(accepted: boolean) {
    setSaving(true);
    try {
      await onCommit({ draft, answers: { goal, outcome }, rec, accepted });
    } finally {
      setSaving(false);
    }
  }

  const unaddedTeam = TEAM.filter((t) => !selected.find((s) => s.name === t.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(11,9,5,0.85)', backdropFilter: 'blur(2px)' }}>
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto fade-in"
        style={{
          background: '#1f1b13',
          border: '2px solid #4d4635',
          boxShadow: '6px 6px 0px #000',
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #4d4635' }}
        >
          {/* Yellow tab */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 56, height: 3, background: '#f2c94c' }} />
          <Logo small />
          <button onClick={onClose} style={{ color: '#99907b' }} className="hover:text-on-surface transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <StepBar step={step} />

        {step === 'brief' && (
          <div className="p-6 space-y-5 fade-in">
            <NoirBanner
              icon={<Skull className="w-4 h-4" />}
              text="Before this meeting enters the evidence log, prove it deserves to exist."
            />

            <NoirField label="Meeting title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="noir-input w-full"
                placeholder="e.g. Q3 roadmap sync"
              />
            </NoirField>

            <div className="grid grid-cols-2 gap-4">
              <NoirField label="Date">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="noir-input w-full" />
              </NoirField>
              <NoirField label="Start time">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="noir-input w-full" />
              </NoirField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NoirField label="Duration">
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="noir-input w-full">
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </NoirField>
              <NoirField label="Location / link">
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="noir-input w-full" placeholder="Zoom, room, Meet…" />
              </NoirField>
            </div>

            <NoirField label={`Suspects${selected.length > 0 ? ` — ${selected.length} identified` : ''}`}>
              <div className="space-y-3">
                {selected.length > 0 && (
                  <div style={{ border: '1px solid #4d4635' }}>
                    {selected.map((a, i) => (
                      <div
                        key={a.name}
                        className="flex items-center justify-between px-3 py-2"
                        style={{ borderTop: i > 0 ? '1px solid #2d2a21' : 'none' }}
                      >
                        <div>
                          <span className="font-sans font-medium text-sm" style={{ color: '#eae1d4' }}>{a.name}</span>
                          <span className="font-sans text-xs ml-2" style={{ color: '#99907b' }}>{a.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeAttendee(a.name)} className="transition" style={{ color: '#4d4635' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#eb5757')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#4d4635')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add form */}
                <div style={{ border: '1px dashed #4d4635', padding: '12px' }}>
                  <div className="font-sans text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: '#4d4635' }}>Add suspect</div>
                  <div className="grid grid-cols-[1fr_1fr_36px] gap-2 items-start">
                    <input ref={nameRef} value={addName} onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                      className="noir-input" placeholder="Full name" />
                    <div className="relative">
                      <input value={addRole}
                        onChange={(e) => { setAddRole(e.target.value); setShowRoleSuggestions(true); }}
                        onFocus={() => setShowRoleSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 120)}
                        onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                        className="noir-input w-full" placeholder="Role" />
                      {showRoleSuggestions && filteredRoles.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-20 max-h-40 overflow-y-auto"
                          style={{ background: '#231f17', border: '1px solid #4d4635', boxShadow: '4px 4px 0px #000' }}>
                          {filteredRoles.map((r) => (
                            <button key={r} onMouseDown={() => { setAddRole(r); setShowRoleSuggestions(false); }}
                              className="w-full text-left px-3 py-2 font-sans text-sm transition"
                              style={{ color: '#d0c5af' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#2d2a21'; e.currentTarget.style.color = '#f2c94c'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d0c5af'; }}
                            >{r}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={addAttendee} disabled={!addName.trim() || !addRole.trim()}
                      className="btn-stamp h-[34px] w-[36px] flex items-center justify-center font-display font-black transition"
                      style={{
                        background: addName.trim() && addRole.trim() ? '#f2c94c' : '#2d2a21',
                        border: '2px solid #000',
                        boxShadow: '3px 3px 0px #000',
                        color: addName.trim() && addRole.trim() ? '#000' : '#4d4635',
                      }}
                    >
                      <Plus className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {unaddedTeam.length > 0 && (
                  <div>
                    <div className="font-sans text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: '#4d4635' }}>Quick-add known suspects</div>
                    <div className="flex flex-wrap gap-1.5">
                      {unaddedTeam.map((a) => (
                        <button key={a.name} onClick={() => addFromTeam(a)}
                          className="font-sans text-xs px-2.5 py-1 transition"
                          style={{ background: '#231f17', border: '1px solid #4d4635', color: '#99907b' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f2c94c'; e.currentTarget.style.color = '#f2c94c'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4d4635'; e.currentTarget.style.color = '#99907b'; }}
                        >
                          + {a.name} <span style={{ opacity: 0.5 }}>· {a.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </NoirField>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="font-sans font-medium text-sm px-4 py-2 transition" style={{ color: '#99907b' }}>
                Cancel
              </button>
              <button
                onClick={() => setStep('questions')}
                disabled={!title.trim() || selected.length === 0}
                className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-5 py-2.5"
                style={{
                  background: title.trim() && selected.length > 0 ? '#f2c94c' : '#2d2a21',
                  color: title.trim() && selected.length > 0 ? '#000' : '#4d4635',
                  border: '2px solid #000',
                  boxShadow: title.trim() && selected.length > 0 ? '4px 4px 0px #000' : 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                {mode === 'create' ? 'NEXT STEP' : 'INTERROGATE'} <ArrowRight className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="p-6 space-y-5 fade-in">
            <div>
              <div className="font-display font-black text-2xl" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>
                Two questions.
              </div>
              <div className="font-sans text-sm mt-1" style={{ color: '#99907b' }}>
                Answer honestly. We're not here to make you feel good.
              </div>
            </div>

            <NoirField label="What is this meeting's crime?">
              <div className="grid grid-cols-2 gap-2">
                {(['decision', 'update', 'brainstorm', 'other'] as Goal[]).map((g) => (
                  <button key={g} onClick={() => setGoal(g)}
                    className="text-left px-4 py-3 transition"
                    style={{
                      background: goal === g ? '#f2c94c' : '#231f17',
                      border: `2px solid ${goal === g ? '#000' : '#4d4635'}`,
                      boxShadow: goal === g ? '3px 3px 0px #000' : 'none',
                    }}
                  >
                    <div className="font-display font-black text-sm uppercase" style={{ color: goal === g ? '#000' : '#eae1d4', letterSpacing: '-0.01em' }}>
                      {g}
                    </div>
                    <div className="font-sans text-xs mt-0.5" style={{ color: goal === g ? '#3d2f00' : '#99907b' }}>
                      {goalHint(g)}
                    </div>
                  </button>
                ))}
              </div>
            </NoirField>

            <NoirField label="What exact outcome is required?" hint="Vague answers will be used against you.">
              <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)}
                rows={3}
                className="noir-input w-full resize-none"
                placeholder="e.g. Decide between option A and B so engineering can ship on Monday."
              />
            </NoirField>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep('brief')} className="font-sans font-medium text-sm transition" style={{ color: '#99907b' }}>
                Back
              </button>
              <button onClick={() => setStep('verdict')}
                className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-5 py-2.5"
                style={{ background: '#f2c94c', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', letterSpacing: '-0.01em' }}
              >
                DELIVER VERDICT <ArrowRight className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {step === 'verdict' && (
          <VerdictPanel rec={rec} draft={draft} saving={saving}
            onBack={() => setStep('questions')}
            onAccept={() => commit(true)}
            onOverride={() => commit(false)}
          />
        )}
      </div>
    </div>
  );
}

function StepBar({ step }: { step: 'brief' | 'questions' | 'verdict' }) {
  const steps = ['brief', 'questions', 'verdict'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex" style={{ borderBottom: '1px solid #4d4635' }}>
      {steps.map((s, i) => (
        <div
          key={s}
          className="flex-1 py-2 text-center font-sans font-medium text-[10px] tracking-[0.18em] uppercase transition"
          style={{
            color: i <= idx ? '#f2c94c' : '#4d4635',
            borderBottom: i === idx ? '2px solid #f2c94c' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          {i + 1}. {s}
        </div>
      ))}
    </div>
  );
}

function goalHint(g: Goal) {
  if (g === 'decision') return 'A call must be made';
  if (g === 'update') return 'Sharing status';
  if (g === 'brainstorm') return 'Generate ideas';
  return 'Something else';
}

function NoirField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block font-sans font-medium text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: '#99907b' }}>
        {label}
      </label>
      {children}
      {hint && <div className="font-sans text-xs mt-1.5" style={{ color: '#4d4635' }}>{hint}</div>}
    </div>
  );
}

function NoirBanner({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3" style={{ background: '#231f17', border: '1px solid #eb5757' }}>
      <div style={{ color: '#eb5757', marginTop: 2 }}>{icon}</div>
      <div className="font-sans text-sm" style={{ color: '#eae1d4' }}>{text}</div>
    </div>
  );
}

function VerdictPanel({ rec, draft, saving, onBack, onAccept, onOverride }: {
  rec: Recommendation; draft: MeetingDraft; saving: boolean;
  onBack: () => void; onAccept: () => void; onOverride: () => void;
}) {
  const vs = verdictStyle(rec.verdict);

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Verdict stamp */}
      <div className="relative px-5 py-5" style={{ background: vs.bg, border: `2px solid ${vs.border}`, boxShadow: `4px 4px 0px ${vs.shadow}` }}>
        <div className="flex items-center gap-2 font-sans font-medium text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: vs.accent }}>
          {vs.icon} {vs.label}
        </div>
        <div className="font-display font-black text-2xl leading-tight" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>
          {rec.headline}
        </div>
        {rec.asyncAlternative && (
          <div className="mt-3 px-3 py-3 font-sans text-sm" style={{ background: '#1f1b13', border: '1px solid #4d4635', color: '#d0c5af' }}>
            <span className="font-medium" style={{ color: '#f2c94c' }}>ASYNC INSTEAD: </span>
            {rec.asyncAlternative}
          </div>
        )}
      </div>

      {rec.verdict !== 'kill' && rec.verdict !== 'async' && (
        <>
          <section style={{ border: '1px solid #4d4635' }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #4d4635', background: '#231f17' }}>
              <div className="flex items-center gap-2 font-sans font-medium text-sm" style={{ color: '#eae1d4' }}>
                <Users className="w-4 h-4" style={{ color: '#f2c94c' }} /> Suspects
              </div>
              <EvidenceTag text={`${rec.recommendedAttendees.length} of ${draft.attendees.length}`} />
            </div>
            <div className="divide-y" style={{ borderColor: '#2d2a21' }}>
              {rec.recommendedAttendees.map((a) => <SuspectRow key={a.name} a={a} keep />)}
              {rec.droppedAttendees.map((a) => <SuspectRow key={a.name} a={a} keep={false} />)}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Clock className="w-4 h-4" />} label="Duration trimmed to" value={`${rec.recommendedDuration} min`} />
            <StatCard icon={<Sparkles className="w-4 h-4" />} label="Case owner" value={rec.owner} />
          </div>

          {rec.agenda.length > 0 && (
            <section style={{ border: '1px solid #4d4635' }}>
              <div className="px-4 py-2.5 font-sans font-medium text-[10px] tracking-[0.18em] uppercase" style={{ borderBottom: '1px solid #4d4635', background: '#231f17', color: '#99907b' }}>
                Agenda
              </div>
              <ol className="px-4 py-3 space-y-1.5 font-sans text-sm list-decimal list-inside" style={{ color: '#d0c5af' }}>
                {rec.agenda.map((line, i) => <li key={i}>{line}</li>)}
              </ol>
            </section>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="font-sans font-medium text-sm transition" style={{ color: '#99907b' }}>
          Back
        </button>
        <div className="flex gap-2">
          {rec.verdict === 'kill' || rec.verdict === 'async' ? (
            <>
              <button onClick={onOverride} disabled={saving}
                className="font-sans font-medium text-sm px-4 py-2.5 transition"
                style={{ border: '1px solid #4d4635', color: '#99907b', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#99907b'; e.currentTarget.style.color = '#eae1d4'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4d4635'; e.currentTarget.style.color = '#99907b'; }}
              >
                Schedule anyway
              </button>
              <button onClick={onAccept} disabled={saving}
                className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-5 py-2.5"
                style={{ background: '#eb5757', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', letterSpacing: '-0.01em' }}
              >
                <Skull className="w-4 h-4" strokeWidth={3} /> KILL IT
              </button>
            </>
          ) : (
            <>
              <button onClick={onOverride} disabled={saving}
                className="font-sans font-medium text-sm px-4 py-2.5 transition"
                style={{ border: '1px solid #4d4635', color: '#99907b', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#99907b'; e.currentTarget.style.color = '#eae1d4'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4d4635'; e.currentTarget.style.color = '#99907b'; }}
              >
                Ignore suggestions
              </button>
              <button onClick={onAccept} disabled={saving}
                className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-5 py-2.5"
                style={{ background: '#f2c94c', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', letterSpacing: '-0.01em' }}
              >
                <Check className="w-4 h-4" strokeWidth={3} /> APPLY & FILE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuspectRow({ a, keep }: { a: Attendee; keep: boolean }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5" style={{ borderTop: '1px solid #2d2a21' }}>
      <div style={{ opacity: keep ? 1 : 0.4, textDecoration: keep ? 'none' : 'line-through' }}>
        <div className="font-sans font-medium text-sm" style={{ color: '#eae1d4' }}>{a.name}</div>
        <div className="font-sans text-xs" style={{ color: '#99907b' }}>{a.role}</div>
      </div>
      <div className="text-right">
        <span
          className="inline-flex items-center gap-1 font-sans font-medium text-[10px] px-2 py-0.5 tracking-[0.1em]"
          style={{
            background: keep ? '#f2c94c' : '#eb575722',
            color: keep ? '#000' : '#eb5757',
            border: `1px solid ${keep ? '#000' : '#eb5757'}`,
          }}
        >
          {keep ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : <X className="w-2.5 h-2.5" strokeWidth={3} />}
          {keep ? 'KEEP' : 'DROP'}
        </span>
        {a.reason && <div className="font-sans text-[10px] mt-1 max-w-[180px]" style={{ color: '#4d4635' }}>{a.reason}</div>}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3" style={{ background: '#231f17', border: '1px solid #4d4635' }}>
      <div className="flex items-center gap-1.5 font-sans text-[10px] tracking-[0.15em] uppercase" style={{ color: '#99907b' }}>
        <span style={{ color: '#f2c94c' }}>{icon}</span> {label}
      </div>
      <div className="font-display font-black text-lg mt-1" style={{ color: '#eae1d4', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function EvidenceTag({ text }: { text: string }) {
  return (
    <span className="font-sans font-medium text-[10px] px-2 py-0.5 tracking-[0.1em]"
      style={{ background: '#1f1b13', border: '1px solid #2d9cdb', color: '#2d9cdb' }}>
      {text}
    </span>
  );
}

function verdictStyle(v: Verdict): { label: string; bg: string; border: string; shadow: string; accent: string; icon: React.ReactNode } {
  if (v === 'kill') return {
    label: 'CASE CLOSED — KILL THIS MEETING',
    bg: '#1a0a0a', border: '#eb5757', shadow: '#eb5757',
    accent: '#eb5757',
    icon: <Skull className="w-3.5 h-3.5" strokeWidth={2.5} />,
  };
  if (v === 'async') return {
    label: 'MAKE IT ASYNC',
    bg: '#1a1400', border: '#f2c94c', shadow: '#f2c94c',
    accent: '#f2c94c',
    icon: <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />,
  };
  if (v === 'trim') return {
    label: 'TRIM AND PROCEED',
    bg: '#141414', border: '#99907b', shadow: '#000',
    accent: '#99907b',
    icon: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />,
  };
  return {
    label: 'MEETING SURVIVES',
    bg: '#0a1a0e', border: '#4caf7d', shadow: '#4caf7d',
    accent: '#4caf7d',
    icon: <Check className="w-3.5 h-3.5" strokeWidth={2.5} />,
  };
}
