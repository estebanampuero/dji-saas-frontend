'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/adminApi';
import MetricsConfigurator from '@/components/admin/MetricsConfigurator';
import KpiBuilder from '@/components/admin/KpiBuilder';
import AdminStatCard from '@/components/admin/AdminStatCard';

type Modal = { type: 'metrics' | 'kpi' | 'users'; orgId: string; orgName: string } | null;

interface OrgUser { id: string; email: string; role: string; created_at: string; }
interface OrgDetail { users: OrgUser[]; drones: any[]; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab,       setTab]       = useState<'orgs' | 'drones' | 'create'>('orgs');
  const [orgs,      setOrgs]      = useState<any[]>([]);
  const [drones,    setDrones]    = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [modal,     setModal]     = useState<Modal>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [orgDetail, setOrgDetail] = useState<Record<string, OrgDetail>>({});
  const [form,      setForm]      = useState({ name: '', admin_email: '', admin_password: '' });
  const [droneForm, setDroneForm] = useState({ serial_number: '', model: '', nickname: '', org_id: '' });
  const [userForm,  setUserForm]  = useState({ email: '', password: '', role: 'operator' });
  const [creating,  setCreating]  = useState(false);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) router.push('/login');
  }, [user, loading]);

  async function load() {
    const [s, o, d] = await Promise.all([adminApi.stats(), adminApi.listOrgs(), adminApi.allDrones()]);
    setStats(s.data); setOrgs(o.data); setDrones(d.data);
  }

  useEffect(() => { if (user?.role === 'superadmin') load(); }, [user]);

  async function expandOrg(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!orgDetail[id]) {
      const detail = await adminApi.getOrg(id);
      setOrgDetail(prev => ({ ...prev, [id]: detail.data }));
    }
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setMsg('');
    try {
      await adminApi.createOrg(form);
      setForm({ name: '', admin_email: '', admin_password: '' });
      setMsg('✓ Cliente creado exitosamente');
      setTab('orgs'); load();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    finally { setCreating(false); }
  }

  async function createDrone(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setMsg('');
    try {
      await adminApi.assignDrone(droneForm);
      setDroneForm({ serial_number: '', model: '', nickname: '', org_id: '' });
      setMsg('✓ Dron asignado');
      load();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    finally { setCreating(false); }
  }

  async function addUserToOrg(orgId: string, e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setMsg('');
    try {
      await adminApi.addUser(orgId, userForm);
      setUserForm({ email: '', password: '', role: 'operator' });
      setMsg('✓ Usuario creado');
      // Refresh org detail
      const detail = await adminApi.getOrg(orgId);
      setOrgDetail(prev => ({ ...prev, [orgId]: detail.data }));
      load();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    finally { setCreating(false); }
  }

  async function deleteOrg(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await adminApi.deleteOrg(id);
    load();
  }

  const roleColor: Record<string, string> = {
    superadmin: '#f43f5e',
    org_admin:  '#a78bfa',
    operator:   '#00d4ff',
    viewer:     '#64748b',
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-cyan-400 animate-pulse text-sm">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen relative z-10 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(0,212,255,0.1))', border: '1px solid rgba(167,139,250,0.2)' }}>◈</div>
          <div>
            <h1 className="text-lg md:text-xl font-bold gradient-text">Superadmin</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Control total del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')}
            className="text-xs text-slate-500 hover:text-slate-300 glass px-2 md:px-3 py-1.5 rounded-full">← Dashboard</button>
          <span className="text-xs text-slate-600 glass px-2 md:px-3 py-1.5 rounded-full hidden sm:block truncate max-w-[140px]">{user.email}</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3 mb-5 md:mb-8">
          <AdminStatCard label="Organizaciones"      value={stats.total_orgs}          icon="🏢" color="#00d4ff" />
          <AdminStatCard label="Drones totales"      value={stats.total_drones}        icon="🚁" color="#00ff88" />
          <AdminStatCard label="Drones online"       value={stats.online_drones}       icon="📡" color="#00ff88" />
          <AdminStatCard label="Vuelos totales"      value={stats.total_flights}       icon="✈️" color="#a78bfa" />
          <AdminStatCard label="Horas de vuelo"      value={stats.total_flight_hours}  icon="⏱"  color="#a78bfa" />
          <AdminStatCard label="Registros telemetría" value={stats.telemetry_records}  icon="📊" color="#00d4ff" />
          <AdminStatCard label="Alertas abiertas"    value={stats.open_alerts}         icon="⚠️" color="#ff6b35" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'orgs',   label: '🏢 Clientes',    count: orgs.length },
          { id: 'drones', label: '🚁 Drones',       count: drones.length },
          { id: 'create', label: '+ Nuevo cliente', count: null },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); setMsg(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
              color:      tab === t.id ? '#a78bfa' : '#475569',
              border:     tab === t.id ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
            }}>
            {t.label}
            {t.count !== null && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {msg && (
        <div className="mb-4 text-sm px-4 py-2 rounded-xl"
          style={{
            background: msg.startsWith('✓') ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
            color:      msg.startsWith('✓') ? '#00ff88' : '#ef4444',
            border:    `1px solid ${msg.startsWith('✓') ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>{msg}</div>
      )}

      {/* ── ORGS TAB ── */}
      {tab === 'orgs' && (
        <div className="space-y-3">
          {orgs.length === 0 && (
            <div className="glass p-8 text-center text-slate-600 text-sm">Sin clientes. Crea el primero →</div>
          )}
          {orgs.map((org: any) => (
            <div key={org.id} className="glass overflow-hidden">
              {/* Org header row */}
              <div className="p-5 flex items-start justify-between gap-4">
                <button className="flex-1 text-left" onClick={() => expandOrg(org.id)}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: org.drone_count > 0 ? '#00ff88' : '#475569' }} />
                    <h3 className="font-semibold text-slate-100">{org.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
                      {org.drone_count} drones
                    </span>
                  </div>
                  <div className="flex gap-5 text-xs text-slate-500">
                    <span>👤 {org.user_count} usuarios</span>
                    <span>✈️ {org.flight_count} vuelos</span>
                    <span className="font-mono text-slate-600">{org.slug}</span>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 justify-end">
                  <button onClick={() => setModal({ type: 'metrics', orgId: org.id, orgName: org.name })}
                    className="text-xs px-2 md:px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
                    📊 <span className="hidden sm:inline">Métricas</span>
                  </button>
                  <button onClick={() => setModal({ type: 'kpi', orgId: org.id, orgName: org.name })}
                    className="text-xs px-2 md:px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' }}>
                    🎯 <span className="hidden sm:inline">KPIs</span>
                  </button>
                  <button onClick={() => expandOrg(org.id)}
                    className="text-xs px-2 md:px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-colors glass">
                    {expanded === org.id ? '▲' : '▼ '}
                    <span className="hidden sm:inline">{expanded === org.id ? 'Cerrar' : 'Usuarios'}</span>
                  </button>
                  <button onClick={() => deleteOrg(org.id, org.name)}
                    className="text-xs px-2 py-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>

              {/* Expanded: user list + add user form */}
              {expanded === org.id && (
                <div className="border-t border-white/5 p-5 space-y-4">
                  {/* Users list */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usuarios</p>
                    {!orgDetail[org.id] ? (
                      <p className="text-xs text-slate-600 animate-pulse">Cargando...</p>
                    ) : orgDetail[org.id].users.length === 0 ? (
                      <p className="text-xs text-slate-600">Sin usuarios aún.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {orgDetail[org.id].users.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span className="text-sm">👤</span>
                            <span className="text-sm text-slate-300 flex-1">{u.email}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                              style={{ background: 'rgba(255,255,255,0.04)', color: roleColor[u.role] ?? '#64748b' }}>
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drones in this org */}
                  {orgDetail[org.id]?.drones?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Drones</p>
                      <div className="flex flex-wrap gap-2">
                        {orgDetail[org.id].drones.map((d: any) => (
                          <span key={d.id} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1.5"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.is_online ? '#00ff88' : '#ef4444' }} />
                            <span className="text-slate-300">{d.nickname || d.serial_number}</span>
                            <span className="text-slate-600">{d.model}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add user form */}
                  <form onSubmit={(e) => addUserToOrg(org.id, e)} className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agregar usuario</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        value={userForm.email}
                        onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        type="email" placeholder="Email *" required
                        className="px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <input
                        value={userForm.password}
                        onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        type="password" placeholder="Contraseña *" required
                        className="px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <select
                        value={userForm.role}
                        onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                        className="px-3 py-2 rounded-xl text-sm text-slate-200 outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <option value="operator">Operador</option>
                        <option value="viewer">Solo lectura</option>
                        <option value="org_admin">Admin org</option>
                      </select>
                    </div>
                    <button type="submit" disabled={creating}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                      {creating ? 'Creando...' : '+ Agregar usuario'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── DRONES TAB ── */}
      {tab === 'drones' && (
        <div className="space-y-4">
          <form onSubmit={createDrone} className="glass p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asignar nuevo dron</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'serial_number', ph: 'Serial Number *', required: true },
                { key: 'model',         ph: 'Modelo',          required: false },
                { key: 'nickname',      ph: 'Nickname',        required: false },
              ].map(f => (
                <input key={f.key} value={(droneForm as any)[f.key]}
                  onChange={e => setDroneForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.ph} required={f.required}
                  className="px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              ))}
              <select value={droneForm.org_id} onChange={e => setDroneForm(prev => ({ ...prev, org_id: e.target.value }))} required
                className="px-3 py-2 rounded-xl text-sm text-slate-200 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Asignar a cliente...</option>
                {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
              {creating ? 'Asignando...' : '+ Asignar dron'}
            </button>
          </form>

          <div className="space-y-2">
            {drones.map((d: any) => (
              <div key={d.id} className="glass p-4 flex items-center gap-4">
                <span className="text-xl">🚁</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{d.nickname || d.serial_number}</p>
                  <p className="text-xs text-slate-500">{d.serial_number} · {d.model || '—'} · <span className="text-cyan-400">{d.org_name}</span></p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: d.is_online ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.08)', color: d.is_online ? '#00ff88' : '#ef4444' }}>
                  {d.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE ORG TAB ── */}
      {tab === 'create' && (
        <div className="max-w-lg">
          <form onSubmit={createOrg} className="glass p-6 space-y-4">
            <h3 className="font-semibold text-slate-200">Crear nuevo cliente</h3>
            {[
              { key: 'name',           ph: 'Nombre de la empresa',      type: 'text' },
              { key: 'admin_email',    ph: 'Email del administrador',   type: 'email' },
              { key: 'admin_password', ph: 'Contraseña inicial',        type: 'password' },
            ].map(f => (
              <input key={f.key} type={f.type} value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.ph} required
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            ))}
            <p className="text-xs text-slate-600">
              Se crean: organización + usuario admin + acceso a todas las métricas por defecto.
              Luego puedes configurar métricas y KPIs desde el tab Clientes.
            </p>
            <button type="submit" disabled={creating}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
              {creating ? 'Creando...' : '🏢 Crear cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'metrics' && (
        <MetricsConfigurator orgId={modal.orgId} orgName={modal.orgName} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'kpi' && (
        <KpiBuilder orgId={modal.orgId} orgName={modal.orgName} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
