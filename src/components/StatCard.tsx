interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: 'cyan' | 'green' | 'purple' | 'orange';
  sub?: string;
}

const colors = {
  cyan:   { border: 'rgba(0,212,255,0.2)',  text: '#00d4ff', glow: 'rgba(0,212,255,0.1)'  },
  green:  { border: 'rgba(0,255,136,0.2)',  text: '#00ff88', glow: 'rgba(0,255,136,0.1)'  },
  purple: { border: 'rgba(167,139,250,0.2)',text: '#a78bfa', glow: 'rgba(167,139,250,0.1)' },
  orange: { border: 'rgba(255,107,53,0.2)', text: '#ff6b35', glow: 'rgba(255,107,53,0.1)' },
};

export default function StatCard({ label, value, unit, icon, color, sub }: Props) {
  const c = colors[color];
  return (
    <div className="glass p-5 relative overflow-hidden" style={{ borderColor: c.border, boxShadow: `0 0 24px ${c.glow}` }}>
      <div className="scan-line" />
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${c.glow}`, color: c.text, border: `1px solid ${c.border}` }}>
          LIVE
        </span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold" style={{ color: c.text }}>{value ?? '—'}</span>
        {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
      </div>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs mt-2" style={{ color: c.text }}>{sub}</p>}
    </div>
  );
}
