interface Props { lat?: number; lng?: number; satellites?: number; gpsLevel?: number; rtk?: boolean; }

export default function GPSPanel({ lat, lng, satellites, gpsLevel, rtk }: Props) {
  const latN = lat != null ? Number(lat) : null;
  const lngN = lng != null ? Number(lng) : null;
  const bars = Array.from({ length: 5 }, (_, i) => i < (gpsLevel ?? 0));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>📡 GPS Signal</h3>
        {rtk && (
          <span className="pill pill-cyan">RTK</span>
        )}
      </div>

      {/* Signal bars */}
      <div className="flex items-end gap-1 mb-4 h-8">
        {bars.map((active, i) => (
          <div key={i} className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${(i+1)*20}%`,
              background: active ? 'var(--cyan)' : 'var(--surface-2)',
              boxShadow: active ? '0 0 4px rgba(6,182,212,0.3)' : 'none',
            }} />
        ))}
        <span className="text-xs ml-2 self-end" style={{ color: 'var(--text-3)' }}>{satellites ?? 0} sats</span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-3)' }}>Latitud</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--cyan)' }}>
            {latN != null ? latN.toFixed(6) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-3)' }}>Longitud</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--cyan)' }}>
            {lngN != null ? lngN.toFixed(6) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
