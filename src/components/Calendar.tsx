import { Plus, Skull } from 'lucide-react';
import type { MeetingRow, Attendee } from '../lib/types';
import { TEAM } from '../lib/seed';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

type StaticEvent = {
  day: number;
  start: number;
  len: number;
  title: string;
  type: 'dead' | 'alive';
  attendees: Attendee[];
  duration: number;
};

const STATIC_EVENTS: StaticEvent[] = [
  { day: 0, start: 9,  len: 1, title: 'Team standup',   type: 'dead',  duration: 30, attendees: TEAM.slice(0, 6) },
  { day: 0, start: 11, len: 1, title: '1:1 with Priya', type: 'alive', duration: 30, attendees: TEAM.slice(0, 2) },
  { day: 1, start: 10, len: 2, title: 'Roadmap review', type: 'alive', duration: 60, attendees: TEAM.slice(0, 5) },
  { day: 2, start: 13, len: 1, title: 'Design crit',    type: 'dead',  duration: 45, attendees: TEAM.slice(2, 6) },
  { day: 3, start: 14, len: 1, title: 'Customer call',  type: 'alive', duration: 30, attendees: TEAM.slice(1, 4) },
  { day: 4, start: 9,  len: 1, title: 'Team standup',   type: 'dead',  duration: 30, attendees: TEAM.slice(0, 6) },
];

function assignSlot(_row: MeetingRow, index: number): { day: number; start: number } {
  const day = index % 5;
  const hourOptions = HOURS.filter(
    (h) => !STATIC_EVENTS.some((e) => e.day === day && e.start === h)
  );
  const start = hourOptions[index % hourOptions.length] ?? 10;
  return { day, start };
}

type EditPayload = { title: string; duration: number; attendees: Attendee[] };

type Props = {
  onNew: (slot: { day: number; hour: number }) => void;
  onEdit: (payload: EditPayload) => void;
  rows?: MeetingRow[];
  onEditRow?: (row: MeetingRow) => void;
};

export function Calendar({ onNew, onEdit, rows = [], onEditRow }: Props) {
  const slotMap = new Map<string, MeetingRow>();
  rows.slice(0, 8).forEach((row, i) => {
    const { day, start } = assignSlot(row, i);
    const key = `${day}-${start}`;
    if (!slotMap.has(key)) slotMap.set(key, row);
  });

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: '#1f1b13', border: '2px solid #4d4635', boxShadow: '4px 4px 0px #000' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 4, background: '#f2c94c' }} />

      <div className="flex items-center justify-between px-6 py-4 mt-1" style={{ borderBottom: '1px solid #4d4635' }}>
        <div>
          <div className="font-sans text-[10px] tracking-[0.22em] uppercase" style={{ color: '#99907b' }}>
            Evidence log — week of
          </div>
          <div className="font-display font-black text-2xl mt-0.5" style={{ color: '#eae1d4', letterSpacing: '-0.03em' }}>
            APR 27 – MAY 1
          </div>
        </div>
        <button
          onClick={() => onNew({ day: 2, hour: 10 })}
          className="btn-stamp inline-flex items-center gap-2 font-display font-black text-sm px-4 py-2.5"
          style={{ background: '#f2c94c', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', letterSpacing: '-0.01em' }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> CREATE MEETING
        </button>
      </div>

      <div className="grid grid-cols-[56px_repeat(5,1fr)] text-xs">
        <div style={{ borderBottom: '1px solid #4d4635' }} />
        {DAYS.map((d, i) => (
          <div key={d} className="px-2 py-2.5 text-center font-sans font-medium tracking-[0.15em]"
            style={{ color: '#99907b', borderBottom: '1px solid #4d4635', borderLeft: '1px solid #4d4635' }}>
            {d} <span style={{ color: '#4d4635' }}>{27 + i}</span>
          </div>
        ))}
        {HOURS.map((h) => (
          <Row key={h} hour={h} onNew={onNew} onEdit={onEdit} slotMap={slotMap} onEditRow={onEditRow} />
        ))}
      </div>
    </div>
  );
}

function Row({ hour, onNew, onEdit, slotMap, onEditRow }: {
  hour: number;
  onNew: (s: { day: number; hour: number }) => void;
  onEdit: (p: EditPayload) => void;
  slotMap: Map<string, MeetingRow>;
  onEditRow?: (row: MeetingRow) => void;
}) {
  const label = hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`;
  return (
    <>
      <div className="px-2 py-3 text-right font-sans font-medium"
        style={{ color: '#4d4635', borderTop: '1px solid #2d2a21', fontSize: 10 }}>
        {label}
      </div>
      {[0, 1, 2, 3, 4].map((day) => {
        const staticEv = STATIC_EVENTS.find((e) => e.day === day && e.start === hour);
        const savedRow = slotMap.get(`${day}-${hour}`);
        return (
          <div key={day} className="relative h-14"
            style={{ borderTop: '1px solid #2d2a21', borderLeft: '1px solid #2d2a21' }}>
            {savedRow ? (
              <SavedEventBlock row={savedRow} onEdit={() => onEditRow?.(savedRow)} />
            ) : staticEv ? (
              <StaticEventBlock
                ev={staticEv}
                onEdit={() => onEdit({ title: staticEv.title, duration: staticEv.duration, attendees: staticEv.attendees })}
              />
            ) : (
              <EmptySlot onNew={() => onNew({ day, hour })} />
            )}
          </div>
        );
      })}
    </>
  );
}

function EmptySlot({ onNew }: { onNew: () => void }) {
  return (
    <button onClick={onNew} className="absolute inset-0 group w-full">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(242,201,76,0.04)' }} />
      <span className="absolute inset-0 items-center justify-center font-sans font-medium tracking-widest opacity-0 group-hover:opacity-100 flex text-[10px] pointer-events-none"
        style={{ color: '#f2c94c' }}>
        + NEW
      </span>
    </button>
  );
}

function StaticEventBlock({ ev, onEdit }: { ev: StaticEvent; onEdit: () => void }) {
  const isDead = ev.type === 'dead';
  return (
    <button
      onClick={onEdit}
      className="absolute inset-x-1 top-1 overflow-hidden text-left group"
      style={{
        height: `calc(${ev.len * 3.5}rem - 0.5rem)`,
        background: isDead ? '#231f17' : '#2d2a21',
        border: `1px solid ${isDead ? '#4d4635' : '#99907b'}`,
        boxShadow: isDead ? 'none' : '2px 2px 0px #000',
      }}
    >
      {isDead && (
        <div className="absolute top-0 right-0 px-1 font-sans font-medium"
          style={{ fontSize: 8, letterSpacing: '0.1em', background: '#eb5757', color: '#000' }}>
          CASE CLOSED
        </div>
      )}
      <div className="px-2 pt-1 font-sans font-medium leading-tight"
        style={{ fontSize: 11, color: isDead ? '#4d4635' : '#eae1d4' }}>
        {ev.title}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
        style={{ background: 'rgba(11,9,5,0.82)' }}>
        <Skull className="w-3 h-3" style={{ color: '#eb5757' }} />
        <span className="font-sans font-medium text-[9px] tracking-[0.12em] uppercase" style={{ color: '#eae1d4' }}>
          Interrogate
        </span>
      </div>
    </button>
  );
}

function SavedEventBlock({ row, onEdit }: { row: MeetingRow; onEdit: () => void }) {
  const dead = (row.verdict === 'kill' || row.verdict === 'async') && row.accepted;
  return (
    <button
      onClick={onEdit}
      className="absolute inset-x-1 top-1 overflow-hidden text-left group"
      style={{
        height: 'calc(3.5rem - 0.5rem)',
        background: dead ? '#1a0a0a' : '#2d2a21',
        border: `1px solid ${dead ? '#eb5757' : '#f2c94c'}`,
        boxShadow: dead ? 'none' : '2px 2px 0px #000',
      }}
    >
      <div className="absolute top-0 right-0 px-1.5 font-sans font-medium"
        style={{ fontSize: 7, letterSpacing: '0.12em', background: dead ? '#eb5757' : '#f2c94c', color: '#000' }}>
        {row.verdict.toUpperCase()}
      </div>
      <div className="px-2 pt-1">
        <div className="font-sans font-medium leading-tight"
          style={{ fontSize: 11, color: dead ? '#4d4635' : '#eae1d4', textDecoration: dead ? 'line-through' : 'none' }}>
          {row.title || 'Untitled'}
        </div>
        <div className="font-sans text-[9px] mt-0.5" style={{ color: '#4d4635' }}>
          {row.duration_minutes}m · {row.attendees_proposed}p
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
        style={{ background: 'rgba(11,9,5,0.82)' }}>
        <Skull className="w-3 h-3" style={{ color: '#eb5757' }} />
        <span className="font-sans font-medium text-[9px] tracking-[0.12em] uppercase" style={{ color: '#eae1d4' }}>
          Re-interrogate
        </span>
      </div>
    </button>
  );
}
