import { Clock, Leaf, PoundSterling, Skull, Sparkles, TreePine, Zap } from 'lucide-react';
import type { Kpis } from '../lib/kpi';
import type { MeetingRow } from '../lib/types';

export function Dashboard({ kpis, rows }: { kpis: Kpis; rows: MeetingRow[] }) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <div className="font-sans font-medium text-[10px] tracking-[0.22em] uppercase" style={{ color: '#4d4635' }}>
          Evidence summary
        </div>
        <div className="font-display font-black text-3xl mt-1" style={{ color: '#eae1d4', letterSpacing: '-0.04em' }}>
          What we've killed for you
        </div>
      </div>

      {/* Primary KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          color="red"
          icon={<Skull className="w-5 h-5" />}
          label="Meetings avoided"
          value={String(kpis.avoided)}
          sub={`${kpis.totalIntercepts} total intercepts`}
        />
        <KpiCard
          color="yellow"
          icon={<Clock className="w-5 h-5" />}
          label="Attendee-hours saved"
          value={kpis.attendeeHoursSaved.toFixed(1)}
          sub="time back in the day"
        />
        <KpiCard
          color="yellow"
          icon={<PoundSterling className="w-5 h-5" />}
          label="Cost saved"
          value={formatMoney(kpis.costSaved)}
          sub="weighted by role"
          gated
        />
        <KpiCard
          color="blue"
          icon={<Sparkles className="w-5 h-5" />}
          label="Meeting Promoter Score"
          value={kpis.mps > 0 ? `+${kpis.mps}` : String(kpis.mps)}
          sub="quality signal"
        />
      </div>

      {/* ESG strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <EsgCard icon={<Leaf className="w-4 h-4" />} label="CO₂e avoided" value={`${kpis.co2Kg.toFixed(1)} kg`} />
        <EsgCard icon={<Zap className="w-4 h-4" />} label="Energy saved" value={`${kpis.kwh.toFixed(1)} kWh`} />
        <EsgCard icon={<TreePine className="w-4 h-4" />} label="Tree-equivalent" value={`≈ ${kpis.trees.toFixed(1)} / year`} />
      </div>

      {/* Verdicts table */}
      <div className="relative" style={{ border: '2px solid #4d4635', boxShadow: '4px 4px 0px #000' }}>
        {/* Yellow tab */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 3, background: '#f2c94c' }} />

        <div className="flex items-center justify-between px-5 py-3 mt-1" style={{ borderBottom: '1px solid #4d4635', background: '#231f17' }}>
          <div className="font-display font-black text-base" style={{ color: '#eae1d4', letterSpacing: '-0.02em' }}>
            CASE FILES
          </div>
          <span className="font-sans font-medium text-[10px] px-2 py-0.5 tracking-[0.1em]"
            style={{ background: '#1f1b13', border: '1px solid #2d9cdb', color: '#2d9cdb' }}>
            {rows.length} INTERCEPTED
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center font-sans text-sm" style={{ color: '#4d4635' }}>
            No cases yet. Create a meeting on the calendar to open the first file.
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_80px_90px_80px] px-5 py-2 font-sans font-medium text-[10px] tracking-[0.15em] uppercase"
              style={{ borderBottom: '1px solid #2d2a21', color: '#4d4635', background: '#1f1b13' }}>
              <div>Meeting</div>
              <div className="text-center">Goal</div>
              <div className="text-center">Attendees</div>
              <div className="text-center">Verdict</div>
              <div className="text-center">Status</div>
            </div>
            {rows.slice(0, 10).map((r, i) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_80px_80px_90px_80px] items-center px-5 py-3"
                style={{ borderTop: i > 0 ? '1px solid #2d2a21' : 'none' }}
              >
                <div>
                  <div className="font-sans font-medium text-sm" style={{ color: '#eae1d4' }}>
                    {r.title || 'Untitled meeting'}
                  </div>
                  <div className="font-sans text-xs mt-0.5" style={{ color: '#4d4635' }}>
                    {r.duration_minutes}m · £{Math.round(Number(r.avg_hourly_rate))}/hr avg
                  </div>
                </div>
                <div className="text-center">
                  <span className="font-sans text-[10px] tracking-[0.08em] uppercase" style={{ color: '#99907b' }}>{r.goal}</span>
                </div>
                <div className="text-center font-sans text-sm" style={{ color: '#99907b' }}>
                  {r.attendees_proposed}
                  {r.attendees_recommended < r.attendees_proposed && (
                    <span style={{ color: '#f2c94c' }}> → {r.attendees_recommended}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  <VerdictBadge v={r.verdict} />
                </div>
                <div className="text-center">
                  <span className="font-sans text-[10px] tracking-[0.1em] uppercase" style={{ color: r.accepted ? '#4d4635' : '#eb5757' }}>
                    {r.accepted ? 'applied' : 'overridden'}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  if (n >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n)}`;
}

function KpiCard({ icon, label, value, sub, color, gated }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  color: 'red' | 'yellow' | 'blue'; gated?: boolean;
}) {
  const accent = color === 'red' ? '#eb5757' : color === 'yellow' ? '#f2c94c' : '#2d9cdb';
  return (
    <div className="relative px-4 py-4" style={{ background: '#1f1b13', border: '1px solid #4d4635', boxShadow: '3px 3px 0px #000' }}>
      {/* colored top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div className="flex items-start justify-between mt-1">
        <div style={{ color: accent }}>{icon}</div>
        {gated && (
          <span className="font-sans text-[9px] tracking-[0.12em] px-1.5 py-0.5 uppercase"
            style={{ background: '#231f17', border: '1px solid #4d4635', color: '#4d4635' }}>
            Premium
          </span>
        )}
      </div>
      <div className="font-display font-black text-3xl mt-3" style={{ color: '#eae1d4', letterSpacing: '-0.04em' }}>
        {value}
      </div>
      <div className="font-sans text-xs mt-1" style={{ color: '#99907b' }}>{label}</div>
      {sub && <div className="font-sans text-[11px] mt-0.5" style={{ color: '#4d4635' }}>{sub}</div>}
    </div>
  );
}

function EsgCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3" style={{ background: '#1a1f1a', border: '1px solid #2a3b2a' }}>
      <div className="flex items-center gap-2 font-sans text-[10px] tracking-[0.15em] uppercase" style={{ color: '#4caf7d' }}>
        {icon} {label}
      </div>
      <div className="font-display font-black text-xl mt-1.5" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  );
}

function VerdictBadge({ v }: { v: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    kill:  { bg: '#1a0a0a', color: '#eb5757', border: '#eb5757' },
    async: { bg: '#1a1400', color: '#f2c94c', border: '#f2c94c' },
    trim:  { bg: '#1f1b13', color: '#99907b', border: '#4d4635' },
    keep:  { bg: '#0a1a0e', color: '#4caf7d', border: '#4caf7d' },
  };
  const s = map[v] || map.keep;
  return (
    <span className="font-sans font-medium text-[10px] px-2 py-0.5 tracking-[0.1em] uppercase"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {v}
    </span>
  );
}
