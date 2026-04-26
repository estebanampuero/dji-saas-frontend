interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: 'cyan' | 'green' | 'purple' | 'orange' | 'accent';
  sub?: string;
  trend?: number;
  live?: boolean;
}

const colorMap = {
  cyan:   { text: '#0E7490', glow: 'rgba(6,182,212,0.08)',    border: 'rgba(6,182,212,0.2)',     bg: 'rgba(6,182,212,0.06)'    },
  green:  { text: '#059669', glow: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',    bg: 'rgba(16,185,129,0.06)'   },
  purple: { text: '#7C3AED', glow: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.2)',    bg: 'rgba(139,92,246,0.06)'   },
  orange: { text: '#C2410C', glow: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.2)',    bg: 'rgba(249,115,22,0.06)'   },
  accent: { text: '#047857', glow: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',    bg: 'rgba(16,185,129,0.06)'   },
};

export default function StatCard({ label, value, unit, icon, color, sub, trend, live }: Props) {
  const c = colorMap[color];
  const trendUp   = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;

  return (
    <div className="card card-lift p-5 relative overflow-hidden cursor-default">
      {/* Color accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: c.text }} />

      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          {icon}
        </div>
        {live && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: 'var(--success-text)' }} />
            LIVE
          </span>
        )}
        {trend != null && !live && (
          <span className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: trendUp ? '#059669' : trendDown ? '#DC2626' : 'var(--text-3)' }}>
            {trendUp ? '↑' : trendDown ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="kpi-value" style={{ color: c.text }}>{value ?? '—'}</span>
        {unit && <span className="text-sm mb-0.5" style={{ color: 'var(--text-3)' }}>{unit}</span>}
      </div>

      <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-2)' }}>{label}</p>
      {sub && <p className="text-xs mt-1 font-semibold" style={{ color: c.text }}>{sub}</p>}
    </div>
  );
}
