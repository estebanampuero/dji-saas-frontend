interface Props { lat?: number; lng?: number; satellites?: number; gpsLevel?: number; rtk?: boolean; }

export default function GPSPanel({ lat, lng, satellites, gpsLevel, rtk }: Props) {
  const bars = Array.from({ length: 5 }, (_, i) => i < (gpsLevel ?? 0));
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">📡 GPS Signal</h3>
        {rtk && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">RTK</span>}
      </div>
      {/* Signal bars */}
      <div className="flex items-end gap-1 mb-4 h-8">
        {bars.map((active, i) => (
          <div key={i} className="flex-1 rounded-sm transition-all duration-300"
            style={{ height: `${(i+1)*20}%`, background: active ? '#00d4ff' : 'rgba(255,255,255,0.08)', boxShadow: active ? '0 0 6px rgba(0,212,255,0.4)' : 'none' }} />
        ))}
        <span className="text-xs text-slate-400 ml-2 self-end">{satellites ?? 0} sats</span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Latitude</span>
          <span className="text-cyan-400 font-mono">{lat?.toFixed(6) ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Longitude</span>
          <span className="text-cyan-400 font-mono">{lng?.toFixed(6) ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
