import type { Alert } from '@/types';

const sev = {
  critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444', icon: '🔴' },
  warning:  { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24', icon: '🟡' },
  info:     { bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.2)',  text: '#00d4ff', icon: '🔵' },
};

interface Props { alert: Alert; onResolve?: (id: string) => void; }

export default function AlertItem({ alert, onResolve }: Props) {
  const s = sev[alert.severity] ?? sev.info;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl transition-all" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-sm mt-0.5">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: s.text }}>{alert.type.replace(/_/g,' ')}</span>
          {alert.nickname && <span className="text-xs text-slate-500">• {alert.nickname}</span>}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{alert.message}</p>
        <p className="text-xs text-slate-600 mt-1">{new Date(alert.created_at).toLocaleTimeString()}</p>
      </div>
      {onResolve && (
        <button onClick={() => onResolve(alert.id)} className="text-xs text-slate-500 hover:text-green-400 transition-colors flex-shrink-0">✓</button>
      )}
    </div>
  );
}
