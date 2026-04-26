import type { Alert } from '@/types';

const sev = {
  critical: { pill: 'pill-red',    icon: '🔴' },
  warning:  { pill: 'pill-yellow', icon: '🟡' },
  info:     { pill: 'pill-blue',   icon: '🔵' },
};

interface Props { alert: Alert; onResolve?: (id: string) => void; }

export default function AlertItem({ alert, onResolve }: Props) {
  const s = sev[alert.severity as keyof typeof sev] ?? sev.info;
  return (
    <div className="card p-4 flex items-start gap-3">
      <span className="text-sm mt-0.5 flex-shrink-0">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`pill ${s.pill}`}>{alert.type.replace(/_/g,' ')}</span>
          {alert.nickname && <span className="text-xs" style={{ color: 'var(--text-3)' }}>· {alert.nickname}</span>}
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{alert.message}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{new Date(alert.created_at).toLocaleTimeString()}</p>
      </div>
      {onResolve && (
        <button onClick={() => onResolve(alert.id)}
          className="text-xs flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e=>(e.currentTarget.style.color='var(--green)')}
          onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
          ✓ resolver
        </button>
      )}
    </div>
  );
}
