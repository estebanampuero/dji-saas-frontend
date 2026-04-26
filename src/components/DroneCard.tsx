import type { Drone } from '@/types';

interface Props { drone: Drone; selected: boolean; onClick: () => void; }

export default function DroneCard({ drone, selected, onClick }: Props) {
  return (
    <div onClick={onClick}
      className={`card card-lift p-3.5 cursor-pointer${selected ? ' active' : ''}`}
      style={selected ? { borderColor: 'rgba(99,102,241,0.4)', boxShadow: '0 0 24px rgba(99,102,241,0.12)' } : undefined}>
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-full h-full rounded-xl flex items-center justify-center text-xl"
            style={{
              background: drone.is_online ? 'rgba(34,197,94,0.1)'  : 'var(--surface-2)',
              border:     drone.is_online ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border)',
            }}>
            🚁
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full pulse"
            style={{ background: drone.is_online ? 'var(--green)' : 'var(--red)', border: '2px solid var(--surface)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
            {drone.nickname || drone.serial_number}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{drone.model || 'DJI Drone'}</p>
        </div>
        <span className={`pill flex-shrink-0 ${drone.is_online ? 'pill-green' : 'pill-gray'}`}>
          {drone.is_online ? 'LIVE' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
