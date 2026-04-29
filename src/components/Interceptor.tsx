import { useMemo, useRef, useState } from 'react';
import {
  CircleAlert as AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Plus,
  Skull,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { Attendee, Goal, MeetingDraft, Recommendation, Verdict } from '../lib/types';
import { recommend } from '../lib/recommend';
import { TEAM } from '../lib/seed';
import { Logo } from './Logo';

type Props = {
  initialTitle: string;
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

export function Interceptor({ initialTitle, onClose, onCommit }: Props) {
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
  const [selected, setSelected] = useState<Attendee[]>(TEAM.slice(0, 0));
  const [goal, setGoal] = useState<Goal>('decision');
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  // Add-attendee form state
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addRate, setAddRate] = useState('');
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
      { name, role, rate: Number(addRate) || 100, essential: false, reason: '' },
    ]);
    setAddName('');
    setAddRole('');
    setAddRate('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-ink-100 fade-in">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <Logo small />
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'brief' && (
          <div className="p-6 space-y-5 fade-in">
            <Banner
              icon={<Skull className="w-4 h-4" />}
              text="Before we put this in anyone's calendar, let's make sure it deserves to exist."
            />

            <Field label="Meeting title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none"
                placeholder="e.g. Q3 roadmap sync"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none"
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Duration">
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none"
                >
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </Field>
              <Field label="Location / link">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none"
                  placeholder="Zoom, room, Google Meet…"
                />
              </Field>
            </div>

            {/* Attendee builder */}
            <Field label={`Attendees${selected.length > 0 ? ` (${selected.length})` : ''}`}>
              <div className="space-y-3">
                {/* Current attendees */}
                {selected.length > 0 && (
                  <div className="rounded-lg border border-ink-100 divide-y divide-ink-100">
                    {selected.map((a) => (
                      <div key={a.name} className="flex items-center justify-between px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-ink-800">{a.name}</span>
                          <span className="text-xs text-ink-400 ml-2">{a.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-ink-400">£{a.rate}/hr</span>
                          <button
                            onClick={() => removeAttendee(a.name)}
                            className="text-ink-300 hover:text-blood-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new attendee row */}
                <div className="rounded-lg border border-dashed border-ink-200 p-3 space-y-2">
                  <div className="text-xs uppercase tracking-[0.12em] text-ink-400">Add attendee</div>
                  <div className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-start">
                    <input
                      ref={nameRef}
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                      className="rounded-md border border-ink-200 px-2.5 py-2 text-sm focus:border-ink-800 focus:outline-none"
                      placeholder="Full name"
                    />
                    <div className="relative">
                      <input
                        value={addRole}
                        onChange={(e) => { setAddRole(e.target.value); setShowRoleSuggestions(true); }}
                        onFocus={() => setShowRoleSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 120)}
                        onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                        className="w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm focus:border-ink-800 focus:outline-none"
                        placeholder="Role"
                      />
                      {showRoleSuggestions && filteredRoles.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink-100 rounded-lg shadow-soft z-20 max-h-40 overflow-y-auto">
                          {filteredRoles.map((r) => (
                            <button
                              key={r}
                              onMouseDown={() => { setAddRole(r); setShowRoleSuggestions(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      value={addRate}
                      onChange={(e) => setAddRate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                      className="rounded-md border border-ink-200 px-2.5 py-2 text-sm focus:border-ink-800 focus:outline-none"
                      placeholder="£/hr"
                      type="number"
                      min="0"
                    />
                    <button
                      onClick={addAttendee}
                      disabled={!addName.trim() || !addRole.trim()}
                      className="h-[38px] w-[36px] flex items-center justify-center rounded-md bg-ink-800 disabled:bg-ink-200 text-white transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Suggestions from the sample team */}
                {unaddedTeam.length > 0 && (
                  <div>
                    <div className="text-xs text-ink-400 mb-1.5">Quick-add from your team</div>
                    <div className="flex flex-wrap gap-2">
                      {unaddedTeam.map((a) => (
                        <button
                          key={a.name}
                          onClick={() => addFromTeam(a)}
                          className="text-xs px-3 py-1.5 rounded-full border border-ink-200 hover:border-ink-500 text-ink-600 hover:text-ink-800 transition"
                        >
                          + {a.name} <span className="opacity-50">· {a.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-ink-500 hover:text-ink-800">
                Cancel
              </button>
              <button
                onClick={() => setStep('questions')}
                disabled={!title.trim() || selected.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blood-600 hover:bg-blood-700 disabled:bg-ink-200 text-white text-sm font-medium px-4 py-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="p-6 space-y-5 fade-in">
            <div>
              <div className="font-display text-xl text-ink-800">Two quick questions.</div>
              <div className="text-sm text-ink-500">We'll only waste your time if you let us.</div>
            </div>

            <Field label="What's the goal?">
              <div className="grid grid-cols-2 gap-2">
                {(['decision', 'update', 'brainstorm', 'other'] as Goal[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`text-left rounded-lg border px-4 py-3 transition ${
                      goal === g
                        ? 'border-ink-800 bg-ink-800 text-white'
                        : 'border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    <div className="font-medium capitalize">{g}</div>
                    <div className={`text-xs ${goal === g ? 'text-white/70' : 'text-ink-400'}`}>
                      {goalHint(g)}
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="What outcome do you need?"
              hint="Be specific. 'Align on things' is not an outcome."
            >
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-ink-200 px-3 py-2.5 focus:border-ink-800 focus:outline-none resize-none"
                placeholder="e.g. Choose between option A and B so engineering can start on Monday."
              />
            </Field>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep('brief')} className="text-sm text-ink-500 hover:text-ink-800">
                Back
              </button>
              <button
                onClick={() => setStep('verdict')}
                className="inline-flex items-center gap-2 rounded-lg bg-blood-600 hover:bg-blood-700 text-white text-sm font-medium px-4 py-2"
              >
                See the verdict <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'verdict' && (
          <Verdict
            rec={rec}
            draft={draft}
            saving={saving}
            onBack={() => setStep('questions')}
            onAccept={() => commit(true)}
            onOverride={() => commit(false)}
          />
        )}
      </div>
    </div>
  );
}

function goalHint(g: Goal) {
  if (g === 'decision') return 'A call needs to be made';
  if (g === 'update') return 'Sharing status';
  if (g === 'brainstorm') return 'Generate ideas';
  return 'Something else';
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.14em] text-ink-400 mb-1.5">{label}</label>
      {children}
      {hint && <div className="text-xs text-ink-400 mt-1.5">{hint}</div>}
    </div>
  );
}

function Banner({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-blood-50 border border-blood-100 px-4 py-3 text-sm text-blood-800">
      <div className="mt-0.5 text-blood-600">{icon}</div>
      <div>{text}</div>
    </div>
  );
}

function Verdict({
  rec,
  draft,
  saving,
  onBack,
  onAccept,
  onOverride,
}: {
  rec: Recommendation;
  draft: MeetingDraft;
  saving: boolean;
  onBack: () => void;
  onAccept: () => void;
  onOverride: () => void;
}) {
  const color = verdictStyle(rec.verdict);

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className={`rounded-2xl p-5 border ${color.bg} ${color.border}`}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold mb-2">
          <span className={color.accent}>{color.icon}</span>
          <span className={color.accent}>{color.label}</span>
        </div>
        <div className="font-display text-2xl text-ink-900 leading-snug">{rec.headline}</div>
        {rec.asyncAlternative && (
          <div className="mt-3 text-sm text-ink-700 bg-white/70 rounded-lg p-3 border border-ink-100">
            <span className="font-medium">Async instead: </span>
            {rec.asyncAlternative}
          </div>
        )}
      </div>

      {rec.verdict !== 'kill' && rec.verdict !== 'async' && (
        <>
          <section className="rounded-xl border border-ink-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
                <Users className="w-4 h-4" /> Attendees
              </div>
              <div className="text-xs text-ink-400">
                {rec.recommendedAttendees.length} of {draft.attendees.length}
              </div>
            </div>
            <div className="space-y-2">
              {rec.recommendedAttendees.map((a) => (
                <AttendeeRow key={a.name} a={a} keep />
              ))}
              {rec.droppedAttendees.map((a) => (
                <AttendeeRow key={a.name} a={a} keep={false} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Stat icon={<Clock className="w-4 h-4" />} label="Trimmed to" value={`${rec.recommendedDuration} min`} />
            <Stat icon={<Sparkles className="w-4 h-4" />} label="Clear owner" value={rec.owner} />
          </section>

          {rec.agenda.length > 0 && (
            <section className="rounded-xl border border-ink-100 p-4">
              <div className="text-sm font-medium text-ink-800 mb-2">Agenda</div>
              <ol className="space-y-1.5 text-sm text-ink-600 list-decimal list-inside">
                {rec.agenda.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="text-sm text-ink-500 hover:text-ink-800">
          Back
        </button>
        <div className="flex gap-2">
          {rec.verdict === 'kill' || rec.verdict === 'async' ? (
            <>
              <button
                onClick={onOverride}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg border border-ink-200 text-ink-600 hover:border-ink-400"
              >
                Schedule anyway
              </button>
              <button
                onClick={onAccept}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blood-600 hover:bg-blood-700 text-white font-medium"
              >
                <Skull className="w-4 h-4" /> Kill it
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOverride}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg border border-ink-200 text-ink-600 hover:border-ink-400"
              >
                Ignore suggestions
              </button>
              <button
                onClick={onAccept}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-ink-800 hover:bg-ink-700 text-white font-medium"
              >
                <Check className="w-4 h-4" /> Apply & schedule
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendeeRow({ a, keep }: { a: Attendee; keep: boolean }) {
  return (
    <div
      className={`flex items-start justify-between rounded-lg px-3 py-2 border ${
        keep ? 'border-ink-100 bg-white' : 'border-ink-100 bg-ink-50/60'
      }`}
    >
      <div className={keep ? '' : 'opacity-60 line-through'}>
        <div className="text-sm font-medium text-ink-800">{a.name}</div>
        <div className="text-xs text-ink-500">{a.role}</div>
      </div>
      <div className="text-right">
        <div
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
            keep ? 'bg-ink-800 text-white' : 'bg-blood-50 text-blood-700 border border-blood-100'
          }`}
        >
          {keep ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {keep ? 'Keep' : 'Drop'}
        </div>
        <div className="text-[11px] text-ink-400 mt-1 max-w-[200px]">{a.reason}</div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <div className="flex items-center gap-2 text-xs text-ink-400 uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="font-display text-lg text-ink-800 mt-1">{value}</div>
    </div>
  );
}

function verdictStyle(v: Verdict) {
  if (v === 'kill')
    return {
      label: 'Kill this meeting',
      bg: 'bg-blood-50',
      border: 'border-blood-200',
      accent: 'text-blood-700',
      icon: <Skull className="w-3.5 h-3.5 inline" />,
    };
  if (v === 'async')
    return {
      label: 'Do it async',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      accent: 'text-amber-700',
      icon: <Zap className="w-3.5 h-3.5 inline" />,
    };
  if (v === 'trim')
    return {
      label: 'Trim & proceed',
      bg: 'bg-ink-50',
      border: 'border-ink-200',
      accent: 'text-ink-700',
      icon: <AlertCircle className="w-3.5 h-3.5 inline" />,
    };
  return {
    label: 'Keep it',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-700',
    icon: <Check className="w-3.5 h-3.5 inline" />,
  };
}
