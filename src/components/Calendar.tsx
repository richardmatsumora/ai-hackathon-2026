import { Plus } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

type Event = { day: number; start: number; len: number; title: string; tone: 'ghost' | 'solid' };

const EVENTS: Event[] = [
  { day: 0, start: 9, len: 1, title: 'Team standup', tone: 'ghost' },
  { day: 0, start: 11, len: 1, title: '1:1 with Priya', tone: 'solid' },
  { day: 1, start: 10, len: 2, title: 'Roadmap review', tone: 'solid' },
  { day: 2, start: 13, len: 1, title: 'Design crit', tone: 'ghost' },
  { day: 3, start: 14, len: 1, title: 'Customer call', tone: 'solid' },
  { day: 4, start: 9, len: 1, title: 'Team standup', tone: 'ghost' },
];

export function Calendar({ onNew }: { onNew: (slot: { day: number; hour: number }) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-ink-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Your week</div>
          <div className="font-display text-xl text-ink-800">April 27 – May 1</div>
        </div>
        <button
          onClick={() => onNew({ day: 2, hour: 10 })}
          className="inline-flex items-center gap-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-white text-sm font-medium px-4 py-2 transition"
        >
          <Plus className="w-4 h-4" /> Create meeting
        </button>
      </div>

      <div className="grid grid-cols-[60px_repeat(5,1fr)] text-sm">
        <div />
        {DAYS.map((d, i) => (
          <div key={d} className="px-3 py-2 border-b border-ink-100 text-ink-500 font-medium text-center">
            {d} <span className="text-ink-300 ml-1">{27 + i}</span>
          </div>
        ))}
        {HOURS.map((h) => (
          <RowHour key={h} hour={h} onNew={onNew} />
        ))}
      </div>
    </div>
  );
}

function RowHour({ hour, onNew }: { hour: number; onNew: (s: { day: number; hour: number }) => void }) {
  return (
    <>
      <div className="px-2 py-3 text-[11px] text-ink-400 text-right border-t border-ink-100">
        {hour > 12 ? hour - 12 : hour}
        {hour >= 12 ? ' pm' : ' am'}
      </div>
      {[0, 1, 2, 3, 4].map((day) => {
        const ev = EVENTS.find((e) => e.day === day && e.start === hour);
        return (
          <button
            key={day}
            onClick={() => onNew({ day, hour })}
            className="relative h-14 border-t border-l border-ink-100 hover:bg-blood-50/60 transition group text-left"
          >
            {ev && (
              <div
                className={`absolute inset-x-1 top-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                  ev.tone === 'solid'
                    ? 'bg-ink-800 text-white'
                    : 'bg-blood-50 text-blood-700 border border-blood-100'
                }`}
                style={{ height: `calc(${ev.len * 3.5}rem - 0.5rem)` }}
              >
                {ev.title}
              </div>
            )}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-blood-600 font-medium text-xs pointer-events-none">
              + new
            </span>
          </button>
        );
      })}
    </>
  );
}
