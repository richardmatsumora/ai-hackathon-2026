export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Crime-scene tape badge */}
      <div
        className={`relative flex-shrink-0 ${small ? 'w-8 h-8' : 'w-10 h-10'} overflow-hidden`}
        style={{ border: '2px solid #f2c94c', boxShadow: '3px 3px 0px #000' }}
      >
        {/* diagonal caution stripes */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'repeating-linear-gradient(-45deg, #f2c94c 0px, #f2c94c 4px, transparent 4px, transparent 10px)',
          }}
        />
        {/* calendar icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className={small ? 'w-4 h-4' : 'w-5 h-5'}
            fill="none"
            stroke="#f2c94c"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <rect x="3" y="4" width="18" height="17" />
            <path d="M8 2v4M16 2v4M3 9h18" />
            <path d="M8 13h2M14 13h2M8 17h2" stroke="#eb5757" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      <div>
        <div
          className={`font-display font-black tracking-tight leading-none ${small ? 'text-sm' : 'text-lg'}`}
          style={{ letterSpacing: '-0.03em', color: '#eae1d4' }}
        >
          MEET IS{' '}
          <span style={{ color: '#eb5757' }}>MURDER</span>
        </div>
        {!small && (
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mt-0.5"
            style={{ color: '#99907b' }}
          >
            Every meeting is guilty
          </div>
        )}
      </div>
    </div>
  );
}
