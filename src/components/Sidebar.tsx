'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const nav = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard', route: null },
  { id: 'fleet',     icon: '🚁', label: 'Fleet',     route: null },
  { id: 'alerts',    icon: '⚠️', label: 'Alertas',   route: null },
  { id: 'history',   icon: '📋', label: 'Historial', route: '/history' },
];

interface Props { active: string; onChange: (id: string) => void; alertCount?: number; }

export default function Sidebar({ active, onChange, alertCount }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleNav(n: typeof nav[0]) {
    if (n.route) router.push(n.route);
    else onChange(n.id);
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-16 h-screen flex-col items-center py-6 gap-2 border-r border-white/5 relative z-10 flex-shrink-0"
        style={{ background: 'rgba(5,10,24,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-lg"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.1))', border: '1px solid rgba(0,212,255,0.2)' }}>
          ◈
        </div>

        {nav.map(n => (
          <button key={n.id} onClick={() => handleNav(n)} title={n.label}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all duration-200 relative group"
            style={{
              background: active === n.id ? 'rgba(0,212,255,0.1)' : 'transparent',
              color:      active === n.id ? '#00d4ff' : '#475569',
              border:     active === n.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
            }}>
            {n.icon}
            {n.id === 'alerts' && !!alertCount && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: '#ef4444', color: 'white' }}>{alertCount > 9 ? '9+' : alertCount}</span>
            )}
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {n.label}
            </span>
          </button>
        ))}

        <div className="mt-auto">
          <button onClick={logout} title="Cerrar sesión"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-slate-600 hover:text-red-400 transition-colors">
            ⏻
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 border-t border-white/5"
        style={{ background: 'rgba(5,10,24,0.95)', backdropFilter: 'blur(20px)' }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => handleNav(n)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative"
            style={{
              color:      active === n.id ? '#00d4ff' : '#475569',
              background: active === n.id ? 'rgba(0,212,255,0.08)' : 'transparent',
            }}>
            <span className="text-lg leading-none">{n.icon}</span>
            <span className="text-xs">{n.label}</span>
            {n.id === 'alerts' && !!alertCount && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: '#ef4444', color: 'white' }}>{alertCount > 9 ? '9+' : alertCount}</span>
            )}
          </button>
        ))}
        <button onClick={logout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-red-400 transition-colors">
          <span className="text-lg leading-none">⏻</span>
          <span className="text-xs">Salir</span>
        </button>
      </nav>
    </>
  );
}
