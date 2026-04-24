interface Props { mode?: string; isFlying?: boolean; altitude?: number; speed?: number; heading?: number; windSpeed?: number; }

const modeColors: Record<string, string> = {
  GPS: '#00d4ff', MANUAL: '#fbbf24', WAYPOINT: '#00ff88',
  RTH: '#a78bfa', SPORT: '#ff6b35', ATTI: '#f87171',
};

export default function FlightStatus({ mode, isFlying, altitude, speed, heading, windSpeed }: Props) {
  const mColor = modeColors[mode?.toUpperCase() ?? ''] ?? '#94a3b8';
  const headingRad = ((heading ?? 0) * Math.PI) / 180;
  const cx = 40, cy = 40, r = 28;
  const nx = cx + r * Math.sin(headingRad);
  const ny = cy - r * Math.cos(headingRad);

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">✈️ Flight Status</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full pulse" style={{ background: isFlying ? '#00ff88' : '#ef4444' }} />
          <span className="text-xs" style={{ color: isFlying ? '#00ff88' : '#ef4444' }}>{isFlying ? 'AIRBORNE' : 'LANDED'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Compass */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={r-8} fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth="1" />
            {['N','E','S','W'].map((d,i) => {
              const a = i * 90 * Math.PI / 180;
              return <text key={d} x={cx + (r+6)*Math.sin(a)} y={cy - (r+6)*Math.cos(a) + 3.5}
                textAnchor="middle" fontSize="7" fill={d==='N'?'#00d4ff':'rgba(148,163,184,0.6)'}>{d}</text>;
            })}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="3" fill="#00d4ff" />
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs flex-1">
          <div>
            <p className="text-slate-500">Altitude</p>
            <p className="text-cyan-400 font-bold text-base">{altitude?.toFixed(1) ?? '—'}<span className="text-slate-500 font-normal text-xs">m</span></p>
          </div>
          <div>
            <p className="text-slate-500">H.Speed</p>
            <p className="text-green-400 font-bold text-base">{speed?.toFixed(1) ?? '—'}<span className="text-slate-500 font-normal text-xs">m/s</span></p>
          </div>
          <div>
            <p className="text-slate-500">Heading</p>
            <p className="text-purple-400 font-bold text-base">{heading?.toFixed(0) ?? '—'}<span className="text-slate-500 font-normal text-xs">°</span></p>
          </div>
          <div>
            <p className="text-slate-500">Wind</p>
            <p className="text-orange-400 font-bold text-base">{windSpeed?.toFixed(1) ?? '—'}<span className="text-slate-500 font-normal text-xs">m/s</span></p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: `${mColor}15`, color: mColor, border: `1px solid ${mColor}30` }}>
          MODE: {mode?.toUpperCase() ?? 'UNKNOWN'}
        </span>
      </div>
    </div>
  );
}
