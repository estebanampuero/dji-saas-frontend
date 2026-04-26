interface Props { percent: number; voltage?: number; temp?: number; remainingMin?: number; }

export default function BatteryGauge({ percent, voltage, temp, remainingMin }: Props) {
  const pct = Number(percent ?? 0);
  const color = pct > 50 ? '#10B981' : pct > 25 ? '#EAB308' : '#EF4444';
  const colorBg = pct > 50 ? 'rgba(16,185,129,0.08)' : pct > 25 ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)';
  const segments = Array.from({ length: 20 }, (_, i) => i * 5);

  return (
    <div className="card p-5 glow-brand">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>🔋 Batería</h3>
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 mb-4">
        {segments.map(s => (
          <div key={s} className="flex-1 h-5 rounded-sm transition-all duration-500"
            style={{
              background: s < pct ? color : 'var(--surface-2)',
              boxShadow: s < pct ? `0 0 4px ${color}40` : 'none',
            }} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {voltage != null && (
          <div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Voltaje</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>{Number(voltage).toFixed(2)}V</p>
          </div>
        )}
        {temp != null && (
          <div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Temp</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--orange)' }}>{temp}°C</p>
          </div>
        )}
        {remainingMin != null && (
          <div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Restante</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{Math.floor((remainingMin||0)/60)}m {(remainingMin||0)%60}s</p>
          </div>
        )}
      </div>
    </div>
  );
}
