export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${small ? 'w-7 h-7' : 'w-9 h-9'} rounded-lg blade flex items-center justify-center shadow-soft`}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-2 rounded-b-full bg-blood-600 animate-drip" />
      </div>
      <div className="leading-tight">
        <div className={`font-display font-bold tracking-tight ${small ? 'text-sm' : 'text-base'}`}>
          Meet is <span className="text-blood-600">Murder</span>
        </div>
        {!small && <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Kill the meeting, keep the work</div>}
      </div>
    </div>
  );
}
