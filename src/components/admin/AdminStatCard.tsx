interface Props { label: string; value: string | number; icon: string; color: string; }
export default function AdminStatCard({ label, value, icon, color }: Props) {
  return (
    <div className="glass p-5 relative overflow-hidden" style={{ borderColor: `${color}30` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="w-2 h-2 rounded-full pulse" style={{ background: color }} />
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
    </div>
  );
}
