interface Props { percent: number; voltage?: number; temp?: number; remainingMin?: number; }

export default function BatteryGauge({ percent, voltage, temp, remainingMin }: Props) {
  const pct = Number(percent ?? 0);
  const color = pct > 50 ? '#00ff88' : pct > 25 ? '#fbbf24' : '#ef4444';
  const segments = Array.from({ length: 20 }, (_, i) => i * 5);

  return (
    <div className="glass p-5 glow-cyan">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">🔋 Battery</h3>
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 mb-4">
        {segments.map(s => (
          <div key={s} className="flex-1 h-6 rounded-sm transition-all duration-500"
            style={{ background: s < pct ? color : 'rgba(255,255,255,0.06)', boxShadow: s < pct ? `0 0 6px ${color}40` : 'none' }} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {voltage != null && (
          <div>
            <p className="text-xs text-slate-500">Voltage</p>
            <p className="text-sm font-semibold text-cyan-400">{Number(voltage).toFixed(2)}V</p>
          </div>
        )}
        {temp != null && (
          <div>
            <p className="text-xs text-slate-500">Temp</p>
            <p className="text-sm font-semibold text-orange-400">{temp}°C</p>
          </div>
        )}
        {remainingMin != null && (
          <div>
            <p className="text-xs text-slate-500">Remaining</p>
            <p className="text-sm font-semibold text-green-400">{Math.floor((remainingMin||0)/60)}m {(remainingMin||0)%60}s</p>
          </div>
        )}
      </div>
    </div>
  );
}
