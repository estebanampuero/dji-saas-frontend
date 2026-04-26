'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const mainNav = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard',  route: null },
  { id: 'fleet',     icon: '🚁', label: 'Flota',      route: null },
  { id: 'alerts',    icon: '⚡', label: 'Alertas',    route: null },
  { id: 'history',   icon: '📋', label: 'Historial',  route: '/history' },
];

const systemNav = [
  { id: 'reports',  icon: '📊', label: 'Reportes',  route: '/reports'        },
  { id: 'admin',    icon: '⚙️', label: 'Ajustes',   route: '/admin'          },
];

interface Props { active: string; onChange: (id: string) => void; alertCount?: number; }

export default function Sidebar({ active, onChange, alertCount }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleNav(n: { id: string; route: string | null }) {
    if (n.route) router.push(n.route);
    else onChange(n.id);
  }

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col h-screen flex-shrink-0 border-r"
        style={{ width: 260, background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))', color: '#fff' }}>◈</div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>DJI SaaS</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Precision Ag Platform</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-3)' }}>Principal</p>
          {mainNav.map(n => (
            <button key={n.id} onClick={() => handleNav(n)}
              className={`nav-item w-full text-left relative${active === n.id ? ' active' : ''}`}>
              <span className="text-base leading-none w-5 text-center flex-shrink-0">{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.id === 'alerts' && !!alertCount && (
                <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--red)', color: '#fff' }}>
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
          ))}

          <p className="text-xs font-semibold uppercase tracking-widest px-3 mt-5 mb-2" style={{ color: 'var(--text-3)' }}>Sistema</p>
          {systemNav.map(n => (
            <button key={n.id} onClick={() => handleNav(n)}
              className={`nav-item w-full text-left${active === n.id ? ' active' : ''}`}>
              <span className="text-base leading-none w-5 text-center flex-shrink-0">{n.icon}</span>
              <span className="flex-1">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))', color: '#fff' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{user?.email ?? '—'}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{user?.role ?? 'user'}</p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="text-base transition-colors hover:text-red-400 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)' }}>
        {mainNav.map(n => (
          <button key={n.id} onClick={() => handleNav(n)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative"
            style={{
              color:      active === n.id ? 'var(--brand-600)' : 'var(--text-3)',
              background: active === n.id ? 'var(--brand-50)' : 'transparent',
            }}>
            <span className="text-lg leading-none">{n.icon}</span>
            <span className="text-xs">{n.label}</span>
            {n.id === 'alerts' && !!alertCount && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: 'var(--red)', color: '#fff' }}>{alertCount > 9 ? '9+' : alertCount}</span>
            )}
          </button>
        ))}
        <button onClick={logout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
          style={{ color: 'var(--text-3)' }}>
          <span className="text-lg leading-none">⏻</span>
          <span className="text-xs">Salir</span>
        </button>
      </nav>
    </>
  );
}
