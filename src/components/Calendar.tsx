import { Plus } from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

type CalEvent = { day: number; start: number; len: number; title: string; type: 'dead' | 'alive' };

const EVENTS: CalEvent[] = [
  { day: 0, start: 9,  len: 1, title: 'Team standup',    type: 'dead' },
  { day: 0, start: 11, len: 1, title: '1:1 with Priya',  type: 'alive' },
  { day: 1, start: 10, len: 2, title: 'Roadmap review',  type: 'alive' },
  { day: 2, start: 13, len: 1, title: 'Design crit',     type: 'dead' },
  { day: 3, start: 14, len: 1, title: 'Customer call',   type: 'alive' },
  { day: 4, start: 9,  len: 1, title: 'Team standup',    type: 'dead' },
];

export function Calendar({ onNew }: { onNew: (slot: { day: number; hour: number }) => void }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#1f1b13',
        border: '2px solid #4d4635',
        boxShadow: '4px 4px 0px #000',
      }}
    >
      {/* Case-file yellow tab */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 4, background: '#f2c94c' }} />

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 mt-1"
        style={{ borderBottom: '1px solid #4d4635' }}
      >
        <div>
          <div className="font-sans text-[10px] tracking-[0.22em] uppercase" style={{ color: '#99907b' }}>
            Evidence log — week of
          </div>
          <div
            className="font-display font-black text-2xl mt-0.5"
            style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}
          >
            APR 27 – MAY 1
          </div>
        </div>
        <button
          onClick={() => onNew({ day: 2, hour: 10 })}
          className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-4 py-2.5"
          style={{
            background: '#f2c94c',
            color: '#000',
            border: '2px solid #000',
            boxShadow: '4px 4px 0px #000',
            letterSpacing: '-0.01em',
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> CREATE MEETING
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[56px_repeat(5,1fr)] text-xs">
        {/* Day headers */}
        <div style={{ borderBottom: '1px solid #4d4635' }} />
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="px-2 py-2.5 text-center font-sans font-medium tracking-[0.15em]"
            style={{ color: '#99907b', borderBottom: '1px solid #4d4635', borderLeft: '1px solid #4d4635' }}
          >
            {d} <span style={{ color: '#4d4635' }}>{27 + i}</span>
          </div>
        ))}

        {/* Hour rows */}
        {HOURS.map((h) => (
          <Row key={h} hour={h} onNew={onNew} />
        ))}
      </div>
    </div>
  );
}

function Row({ hour, onNew }: { hour: number; onNew: (s: { day: number; hour: number }) => void }) {
  const label = hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`;
  return (
    <>
      <div
        className="px-2 py-3 text-right font-sans font-medium"
        style={{ color: '#4d4635', borderTop: '1px solid #2d2a21', fontSize: 10 }}
      >
        {label}
      </div>
      {[0, 1, 2, 3, 4].map((day) => {
        const ev = EVENTS.find((e) => e.day === day && e.start === hour);
        return (
          <button
            key={day}
            onClick={() => onNew({ day, hour })}
            className="relative h-14 group text-left"
            style={{ borderTop: '1px solid #2d2a21', borderLeft: '1px solid #2d2a21' }}
          >
            {/* hover flash */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(242,201,76,0.04)' }}
            />
            <span
              className="absolute inset-0 items-center justify-center font-sans font-medium tracking-widest opacity-0 group-hover:opacity-100 flex text-[10px] pointer-events-none"
              style={{ color: '#f2c94c' }}
            >
              + NEW
            </span>

            {ev && (
              <EventBlock ev={ev} />
            )}
          </button>
        );
      })}
    </>
  );
}

function EventBlock({ ev }: { ev: CalEvent }) {
  const isDead = ev.type === 'dead';
  return (
    <div
      className="absolute inset-x-1 top-1 px-2 py-1 overflow-hidden"
      style={{
        height: `calc(${ev.len * 3.5}rem - 0.5rem)`,
        background: isDead ? '#231f17' : '#2d2a21',
        border: `1px solid ${isDead ? '#4d4635' : '#99907b'}`,
        boxShadow: isDead ? 'none' : '2px 2px 0px #000',
      }}
    >
      {isDead && (
        <div
          className="absolute top-0 right-0 px-1 font-sans font-medium"
          style={{ fontSize: 8, letterSpacing: '0.1em', background: '#eb5757', color: '#000' }}
        >
          CASE CLOSED
        </div>
      )}
      <div
        className="font-sans font-medium leading-tight mt-0.5"
        style={{ fontSize: 11, color: isDead ? '#4d4635' : '#eae1d4' }}
      >
        {ev.title}
      </div>
    </div>
  );
}
