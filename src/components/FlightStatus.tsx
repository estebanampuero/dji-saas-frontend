interface Props { mode?: string; isFlying?: boolean; altitude?: number; speed?: number; heading?: number; windSpeed?: number; }

const modeColors: Record<string, string> = {
  GPS:      '#06B6D4',
  MANUAL:   '#EAB308',
  WAYPOINT: '#10B981',
  RTH:      '#8B5CF6',
  SPORT:    '#F97316',
  ATTI:     '#EF4444',
};

export default function FlightStatus({ mode, isFlying, altitude, speed, heading, windSpeed }: Props) {
  const mColor = modeColors[mode?.toUpperCase() ?? ''] ?? '#9CA3AF';
  const alt = altitude  != null ? Number(altitude)  : null;
  const spd = speed     != null ? Number(speed)     : null;
  const hdg = heading   != null ? Number(heading)   : null;
  const wnd = windSpeed != null ? Number(windSpeed) : null;
  const headingRad = ((hdg ?? 0) * Math.PI) / 180;
  const cx = 40, cy = 40, r = 28;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>✈️ Estado de Vuelo</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full pulse"
            style={{ background: isFlying ? '#10B981' : '#EF4444' }} />
          <span className="text-xs font-semibold"
            style={{ color: isFlying ? '#10B981' : '#EF4444' }}>
            {isFlying ? 'EN VUELO' : 'EN TIERRA'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Compass */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r={r-8} fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth="1" />
            {['N','E','S','W'].map((d,i) => {
              const a = i * 90 * Math.PI / 180;
              return <text key={d} x={cx + (r+6)*Math.sin(a)} y={cy - (r+6)*Math.cos(a) + 3.5}
                textAnchor="middle" fontSize="7" fontWeight="600"
                fill={d==='N' ? '#06B6D4' : '#9CA3AF'}>{d}</text>;
            })}
            <line x1={cx} y1={cy} x2={cx + r*Math.sin(headingRad)} y2={cy - r*Math.cos(headingRad)}
              stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="3" fill="#06B6D4" />
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs flex-1">
          <div>
            <p style={{ color: 'var(--text-3)' }}>Altitud</p>
            <p className="font-bold text-base" style={{ color: 'var(--cyan)' }}>
              {alt != null ? alt.toFixed(1) : '—'}<span className="font-normal text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>m</span>
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-3)' }}>Vel. H</p>
            <p className="font-bold text-base" style={{ color: 'var(--accent)' }}>
              {spd != null ? spd.toFixed(1) : '—'}<span className="font-normal text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>m/s</span>
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-3)' }}>Rumbo</p>
            <p className="font-bold text-base" style={{ color: 'var(--purple)' }}>
              {hdg != null ? hdg.toFixed(0) : '—'}<span className="font-normal text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>°</span>
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-3)' }}>Viento</p>
            <p className="font-bold text-base" style={{ color: 'var(--orange)' }}>
              {wnd != null ? wnd.toFixed(1) : '—'}<span className="font-normal text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>m/s</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <span className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{ background: `${mColor}15`, color: mColor, border: `1px solid ${mColor}30` }}>
          MODO: {mode?.toUpperCase() ?? 'DESCONOCIDO'}
        </span>
      </div>
    </div>
  );
}
