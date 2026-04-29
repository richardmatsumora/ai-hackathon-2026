export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Chalk-outline crime-scene badge */}
      <div
        className={`relative flex-shrink-0 ${small ? 'w-8 h-8' : 'w-10 h-10'} overflow-hidden`}
        style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000' }}
      >
        <img
          src="/WhatsApp_Image_2026-04-29_at_16.52.04.jpeg"
          alt="Meet is Murder — chalk outline"
          className="absolute inset-0 w-full h-full object-cover"
        />
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
