'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/adminApi';
import MetricsConfigurator from '@/components/admin/MetricsConfigurator';
import KpiBuilder from '@/components/admin/KpiBuilder';
import AdminStatCard from '@/components/admin/AdminStatCard';

type Modal = { type: 'metrics' | 'kpi'; orgId: string; orgName: string } | null;

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab,     setTab]     = useState<'orgs' | 'drones' | 'create'>('orgs');
  const [orgs,    setOrgs]    = useState<any[]>([]);
  const [drones,  setDrones]  = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [modal,   setModal]   = useState<Modal>(null);
  const [form,    setForm]    = useState({ name: '', admin_email: '', admin_password: '' });
  const [droneForm, setDroneForm] = useState({ serial_number: '', model: '', nickname: '', org_id: '' });
  const [creating, setCreating] = useState(false);
  const [msg,      setMsg]    = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) router.push('/login');
  }, [user, loading]);

  async function load() {
    const [s, o, d] = await Promise.all([adminApi.stats(), adminApi.listOrgs(), adminApi.allDrones()]);
    setStats(s.data); setOrgs(o.data); setDrones(d.data);
  }

  useEffect(() => { if (user?.role === 'superadmin') load(); }, [user]);

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

  async function deleteOrg(id: string, name: string) {
    if (!confirm(`¿Eliminar la organización "${name}"? Esta acción no se puede deshacer.`)) return;
    await adminApi.deleteOrg(id);
    load();
  }

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><p className="text-cyan-400 animate-pulse text-sm">Cargando...</p></div>;

  return (
    <div className="min-h-screen relative z-10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(0,212,255,0.1))', border: '1px solid rgba(167,139,250,0.2)' }}>◈</div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Panel Superadmin</h1>
            <p className="text-xs text-slate-500">DJI SaaS — Control total del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-xs text-slate-500 hover:text-slate-300 glass px-3 py-1.5 rounded-full">← Dashboard</button>
          <span className="text-xs text-slate-600 glass px-3 py-1.5 rounded-full">{user.email}</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <AdminStatCard label="Organizaciones"    value={stats.total_orgs}         icon="🏢" color="#00d4ff" />
          <AdminStatCard label="Drones totales"    value={stats.total_drones}       icon="🚁" color="#00ff88" />
          <AdminStatCard label="Drones online"     value={stats.online_drones}      icon="📡" color="#00ff88" />
          <AdminStatCard label="Vuelos totales"    value={stats.total_flights}      icon="✈️" color="#a78bfa" />
          <AdminStatCard label="Horas de vuelo"    value={stats.total_flight_hours} icon="⏱"  color="#a78bfa" />
          <AdminStatCard label="Registros telemetría" value={stats.telemetry_records} icon="📊" color="#00d4ff" />
          <AdminStatCard label="Alertas abiertas"  value={stats.open_alerts}        icon="⚠️" color="#ff6b35" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'orgs',   label: '🏢 Clientes',     count: orgs.length },
          { id: 'drones', label: '🚁 Drones',        count: drones.length },
          { id: 'create', label: '+ Nuevo cliente',  count: null },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); setMsg(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === t.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#a78bfa' : '#475569', border: tab === t.id ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent' }}>
            {t.label}
            {t.count !== null && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 text-sm px-4 py-2 rounded-xl" style={{ background: msg.startsWith('✓') ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)', color: msg.startsWith('✓') ? '#00ff88' : '#ef4444', border: `1px solid ${msg.startsWith('✓') ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{msg}</div>}

      {/* ORGS TAB */}
      {tab === 'orgs' && (
        <div className="space-y-3">
          {orgs.length === 0 && <div className="glass p-8 text-center text-slate-600 text-sm">Sin clientes. Crea el primero →</div>}
          {orgs.map((org: any) => (
            <div key={org.id} className="glass p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-100">{org.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
                      {org.drone_count} drones
                    </span>
                  </div>
                  <div className="flex gap-6 text-xs text-slate-500">
                    <span>👤 {org.user_count} usuarios</span>
                    <span>✈️ {org.flight_count} vuelos</span>
                    <span className="font-mono text-slate-600">{org.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ type: 'metrics', orgId: org.id, orgName: org.name })}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
                    📊 Métricas
                  </button>
                  <button onClick={() => setModal({ type: 'kpi', orgId: org.id, orgName: org.name })}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' }}>
                    🎯 KPIs
                  </button>
                  <button onClick={() => deleteOrg(org.id, org.name)}
                    className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRONES TAB */}
      {tab === 'drones' && (
        <div className="space-y-4">
          <form onSubmit={createDrone} className="glass p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asignar nuevo dron</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'serial_number', ph: 'Serial Number *' },
                { key: 'model',         ph: 'Modelo' },
                { key: 'nickname',      ph: 'Nickname' },
              ].map(f => (
                <input key={f.key} value={(droneForm as any)[f.key]} onChange={e => setDroneForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.ph} required={f.key === 'serial_number'}
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
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: d.is_online ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.08)', color: d.is_online ? '#00ff88' : '#ef4444' }}>
                  {d.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE ORG TAB */}
      {tab === 'create' && (
        <div className="max-w-lg">
          <form onSubmit={createOrg} className="glass p-6 space-y-4">
            <h3 className="font-semibold text-slate-200">Crear nuevo cliente</h3>
            {[
              { key: 'name',           ph: 'Nombre de la empresa', type: 'text' },
              { key: 'admin_email',    ph: 'Email del administrador', type: 'email' },
              { key: 'admin_password', ph: 'Contraseña inicial', type: 'password' },
            ].map(f => (
              <input key={f.key} type={f.type} value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.ph} required
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            ))}
            <p className="text-xs text-slate-600">Se crearán: organización + usuario admin + acceso a todas las métricas por defecto.</p>
            <button type="submit" disabled={creating}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
              {creating ? 'Creando...' : '🏢 Crear cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'metrics' && <MetricsConfigurator orgId={modal.orgId} orgName={modal.orgName} onClose={() => setModal(null)} />}
      {modal?.type === 'kpi'     && <KpiBuilder          orgId={modal.orgId} orgName={modal.orgName} onClose={() => setModal(null)} />}
    </div>
  );
}
