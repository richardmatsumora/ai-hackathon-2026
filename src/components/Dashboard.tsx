import { Clock, Leaf, PoundSterling, Skull, Sparkles, TreePine, Zap } from 'lucide-react';
import type { Kpis } from '../lib/kpi';
import type { MeetingRow } from '../lib/types';

export function Dashboard({ kpis, rows }: { kpis: Kpis; rows: MeetingRow[] }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Live impact</div>
        <div className="font-display text-2xl text-ink-800">What we've killed for you</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          accent="blood"
          icon={<Skull className="w-5 h-5" />}
          label="Unnecessary meetings avoided"
          value={String(kpis.avoided)}
          sub={`${kpis.totalIntercepts} intercepts this session`}
        />
        <Card
          accent="ink"
          icon={<Clock className="w-5 h-5" />}
          label="Attendee-hours saved"
          value={kpis.attendeeHoursSaved.toFixed(1)}
          sub="time back in the day"
        />
        <Card
          accent="ink"
          icon={<PoundSterling className="w-5 h-5" />}
          label="Cost saved"
          value={formatMoney(kpis.costSaved)}
          sub="weighted by role rates"
          gated
        />
        <Card
          accent="emerald"
          icon={<Sparkles className="w-5 h-5" />}
          label="Meeting Promoter Score"
          value={kpis.mps > 0 ? `+${kpis.mps}` : String(kpis.mps)}
          sub="quality, not just quantity"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <EsgCard
          icon={<Leaf className="w-5 h-5" />}
          label="CO₂e avoided"
          value={`${kpis.co2Kg.toFixed(1)} kg`}
        />
        <EsgCard
          icon={<Zap className="w-5 h-5" />}
          label="Energy saved"
          value={`${kpis.kwh.toFixed(1)} kWh`}
        />
        <EsgCard
          icon={<TreePine className="w-5 h-5" />}
          label="Tree-equivalent"
          value={`≈ ${kpis.trees.toFixed(1)} trees / year`}
        />
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div className="font-display text-lg text-ink-800">Recent verdicts</div>
          <div className="text-xs text-ink-400">{rows.length} intercepted</div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">
            Create a meeting on the calendar to see the interceptor in action.
          </div>
        ) : (
          <ul>
            {rows.slice(0, 8).map((r) => (
              <li key={r.id} className="px-5 py-3 border-t border-ink-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink-800">{r.title || 'Untitled meeting'}</div>
                  <div className="text-xs text-ink-400">
                    {r.goal} · {r.attendees_proposed} → {r.attendees_recommended} attendees ·{' '}
                    {r.duration_minutes}m
                  </div>
                </div>
                <VerdictTag v={r.verdict} accepted={r.accepted} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  if (n >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n)}`;
}

function Card({
  icon,
  label,
  value,
  sub,
  accent,
  gated,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: 'blood' | 'ink' | 'emerald';
  gated?: boolean;
}) {
  const tone =
    accent === 'blood'
      ? 'bg-blood-600 text-white'
      : accent === 'emerald'
      ? 'bg-emerald-600 text-white'
      : 'bg-ink-800 text-white';
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>{icon}</div>
        {gated && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">
            Premium
          </span>
        )}
      </div>
      <div>
        <div className="font-display text-2xl text-ink-900">{value}</div>
        <div className="text-xs text-ink-500 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-ink-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function EsgCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
      <div className="flex items-center gap-2 text-emerald-700">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="font-display text-xl text-ink-900 mt-2">{value}</div>
    </div>
  );
}

function VerdictTag({ v, accepted }: { v: string; accepted: boolean }) {
  const map: Record<string, string> = {
    kill: 'bg-blood-50 text-blood-700 border-blood-100',
    async: 'bg-amber-50 text-amber-700 border-amber-100',
    trim: 'bg-ink-50 text-ink-700 border-ink-200',
    keep: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${map[v] || map.keep}`}>
        {v}
      </span>
      <span
        className={`text-[10px] uppercase tracking-wider ${
          accepted ? 'text-ink-400' : 'text-blood-500'
        }`}
      >
        {accepted ? 'applied' : 'overridden'}
      </span>
    </div>
  );
}
