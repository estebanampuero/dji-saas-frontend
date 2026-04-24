import type { Drone } from '@/types';

interface Props { drone: Drone; selected: boolean; onClick: () => void; }

export default function DroneCard({ drone, selected, onClick }: Props) {
  return (
    <div onClick={onClick} className="glass p-4 cursor-pointer transition-all duration-200"
      style={{ borderColor: selected ? 'rgba(0,212,255,0.4)' : undefined, boxShadow: selected ? '0 0 20px rgba(0,212,255,0.1)' : undefined }}>
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-full h-full rounded-xl flex items-center justify-center text-xl"
            style={{ background: drone.is_online ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${drone.is_online ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
            🚁
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 pulse"
            style={{ background: drone.is_online ? '#00ff88' : '#ef4444' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{drone.nickname || drone.serial_number}</p>
          <p className="text-xs text-slate-500 truncate">{drone.model || 'DJI Drone'}</p>
        </div>
        <div className="ml-auto text-xs" style={{ color: drone.is_online ? '#00ff88' : '#64748b' }}>
          {drone.is_online ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
}
