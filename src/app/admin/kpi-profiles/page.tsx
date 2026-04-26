'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';
const token = () => localStorage.getItem('token');
const req = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...opts?.headers },
  });
  return r.json();
};

const AVAILABLE_METRICS = [
  { key: 'total_area_m2',        label: 'Área trabajada',          unit: 'm²' },
  { key: 'liters_per_ha',        label: 'Dosis aplicada',          unit: 'L/ha' },
  { key: 'coverage_efficiency',  label: 'Eficiencia cobertura',    unit: '%' },
  { key: 'duration_seconds',     label: 'Duración vuelo',          unit: 'min' },
  { key: 'distance_m',           label: 'Distancia recorrida',     unit: 'm' },
  { key: 'max_altitude',         label: 'Altitud máxima',          unit: 'm' },
  { key: 'max_speed',            label: 'Velocidad máxima',        unit: 'm/s' },
  { key: 'avg_speed',            label: 'Velocidad promedio',      unit: 'm/s' },
  { key: 'battery_consumed',     label: 'Batería consumida',       unit: '%' },
  { key: 'total_spray_liters',   label: 'Total aplicado',          unit: 'L' },
  { key: 'gps_points',           label: 'Puntos GPS',              unit: 'pts' },
];

export default function KpiProfilesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [newProfile, setNewProfile] = useState({ name: '', description: '', is_global: false });
  const [editMetric, setEditMetric] = useState<any>(null);
  const [addingMetric, setAddingMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({ metric_key: '', label: '', unit: '', target_value: '', warning_threshold: '', critical_threshold: '', comparison: 'gte' });
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);
  useEffect(() => { if (user) loadProfiles(); }, [user]);

  async function loadProfiles() {
    const r = await req('/api/kpi-profiles');
    if (r.success) setProfiles(r.data);
  }

  async function selectProfile(p: any) {
    setSelected(p);
    const r = await req(`/api/kpi-profiles/${p.id}`);
    if (r.success) setMetrics(r.data.metrics || []);
  }

  async function createProfile() {
    if (!newProfile.name) return;
    const r = await req('/api/kpi-profiles', { method: 'POST', body: JSON.stringify(newProfile) });
    if (r.success) { await loadProfiles(); setNewProfile({ name: '', description: '', is_global: false }); setMsg('Perfil creado'); }
  }

  async function setDefault(id: string) {
    await req(`/api/kpi-profiles/${id}`, { method: 'PUT', body: JSON.stringify({ is_default: true }) });
    await loadProfiles();
    setMsg('Perfil marcado como predeterminado');
  }

  async function deleteProfile(id: string) {
    await req(`/api/kpi-profiles/${id}`, { method: 'DELETE' });
    setSelected(null); setMetrics([]);
    await loadProfiles();
  }

  async function addMetric() {
    if (!newMetric.metric_key || !selected) return;
    const meta = AVAILABLE_METRICS.find(m => m.key === newMetric.metric_key);
    const body = {
      ...newMetric,
      label: newMetric.label || meta?.label || newMetric.metric_key,
      unit:  newMetric.unit  || meta?.unit  || '',
      target_value:       newMetric.target_value       ? +newMetric.target_value       : null,
      warning_threshold:  newMetric.warning_threshold  ? +newMetric.warning_threshold  : null,
      critical_threshold: newMetric.critical_threshold ? +newMetric.critical_threshold : null,
    };
    const r = await req(`/api/kpi-profiles/${selected.id}/metrics`, { method: 'POST', body: JSON.stringify(body) });
    if (r.success) {
      const r2 = await req(`/api/kpi-profiles/${selected.id}`);
      if (r2.success) setMetrics(r2.data.metrics || []);
      setNewMetric({ metric_key: '', label: '', unit: '', target_value: '', warning_threshold: '', critical_threshold: '', comparison: 'gte' });
      setAddingMetric(false);
      setMsg('Métrica agregada');
    }
  }

  async function saveMetric(m: any) {
    await req(`/api/kpi-profiles/${selected.id}/metrics/${m.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        label: m.label, unit: m.unit,
        target_value:       m.target_value       ? +m.target_value       : null,
        warning_threshold:  m.warning_threshold  ? +m.warning_threshold  : null,
        critical_threshold: m.critical_threshold ? +m.critical_threshold : null,
        comparison: m.comparison,
      }),
    });
    setEditMetric(null);
    const r2 = await req(`/api/kpi-profiles/${selected.id}`);
    if (r2.success) setMetrics(r2.data.metrics || []);
    setMsg('Métrica actualizada');
  }

  async function deleteMetric(metricId: string) {
    await req(`/api/kpi-profiles/${selected.id}/metrics/${metricId}`, { method: 'DELETE' });
    setMetrics(prev => prev.filter(m => m.id !== metricId));
  }

  if (loading) return null;

  return (
    <div className="min-h-screen relative z-10 p-3 md:p-6 mobile-pb">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Perfiles de KPI</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configura qué métricas aparecen en los reportes de vuelo</p>
        </div>
        <button onClick={() => router.push('/admin')}
          className="text-xs text-slate-500 hover:text-slate-300 glass px-3 py-1.5 rounded-full">
          ← Admin
        </button>
      </div>

      {msg && (
        <div className="mb-4 text-xs px-3 py-2 rounded-xl text-green-400"
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Lista de perfiles */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perfiles</h2>

          {profiles.map(p => (
            <div key={p.id}
              onClick={() => selectProfile(p)}
              className="glass p-3 cursor-pointer transition-all"
              style={{ border: selected?.id === p.id ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200 truncate">{p.name}</p>
                    {p.is_default && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                        predeterminado
                      </span>
                    )}
                    {p.is_global && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                        global
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-slate-600 mt-0.5 truncate">{p.description}</p>}
                  <p className="text-xs text-slate-600 mt-1">{p.metric_count} métricas</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {!p.is_default && (
                    <button onClick={e => { e.stopPropagation(); setDefault(p.id); }}
                      className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      ★
                    </button>
                  )}
                  {!p.is_global && (
                    <button onClick={e => { e.stopPropagation(); deleteProfile(p.id); }}
                      className="text-xs px-2 py-1 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Crear perfil */}
          <div className="glass p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Nuevo perfil</p>
            <input value={newProfile.name} onChange={e => setNewProfile(p=>({...p,name:e.target.value}))}
              placeholder="Nombre del perfil"
              className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <input value={newProfile.description} onChange={e => setNewProfile(p=>({...p,description:e.target.value}))}
              placeholder="Descripción (opcional)"
              className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            {user?.role === 'superadmin' && (
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={newProfile.is_global}
                  onChange={e => setNewProfile(p=>({...p,is_global:e.target.checked}))} />
                Perfil global (todos los clientes)
              </label>
            )}
            <button onClick={createProfile}
              className="w-full text-xs py-2 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
              + Crear perfil
            </button>
          </div>
        </div>

        {/* Editor de métricas del perfil seleccionado */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="glass p-12 text-center text-slate-600 text-sm">
              Selecciona un perfil para editar sus KPIs
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Métricas de: <span className="text-slate-300">{selected.name}</span>
                </h2>
                <button onClick={() => setAddingMetric(true)}
                  className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                  style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                  + Agregar KPI
                </button>
              </div>

              {/* Formulario agregar métrica */}
              {addingMetric && (
                <div className="glass p-4 space-y-3" style={{ border: '1px solid rgba(0,255,136,0.2)' }}>
                  <p className="text-xs font-semibold text-green-400">Nueva métrica</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Métrica</p>
                      <select value={newMetric.metric_key}
                        onChange={e => {
                          const meta = AVAILABLE_METRICS.find(m => m.key === e.target.value);
                          setNewMetric(p => ({ ...p, metric_key: e.target.value, label: meta?.label||'', unit: meta?.unit||'' }));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <option value="">Seleccionar...</option>
                        {AVAILABLE_METRICS.map(m => (
                          <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Comparación</p>
                      <select value={newMetric.comparison}
                        onChange={e => setNewMetric(p=>({...p,comparison:e.target.value}))}
                        className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <option value="gte">≥ Mayor o igual (más es mejor)</option>
                        <option value="lte">≤ Menor o igual (menos es mejor)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'target_value', label: '🎯 Objetivo', placeholder: 'ej: 10000' },
                      { key: 'warning_threshold', label: '⚠ Warning', placeholder: 'ej: 8000' },
                      { key: 'critical_threshold', label: '✗ Crítico', placeholder: 'ej: 5000' },
                    ].map(f => (
                      <div key={f.key}>
                        <p className="text-xs text-slate-500 mb-1">{f.label}</p>
                        <input type="number" placeholder={f.placeholder}
                          value={(newMetric as any)[f.key]}
                          onChange={e => setNewMetric(p=>({...p,[f.key]:e.target.value}))}
                          className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addMetric}
                      className="flex-1 text-xs py-2 rounded-lg font-semibold"
                      style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                      Agregar
                    </button>
                    <button onClick={() => setAddingMetric(false)}
                      className="text-xs px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista métricas */}
              {metrics.length === 0 && !addingMetric && (
                <div className="glass p-8 text-center text-slate-600 text-sm">Sin métricas — agrega KPIs con el botón de arriba</div>
              )}

              {metrics.map((m: any) => (
                <div key={m.id} className="glass p-3">
                  {editMetric?.id === m.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editMetric.label} onChange={e => setEditMetric((p:any)=>({...p,label:e.target.value}))}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <select value={editMetric.comparison} onChange={e => setEditMetric((p:any)=>({...p,comparison:e.target.value}))}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <option value="gte">≥ Más es mejor</option>
                          <option value="lte">≤ Menos es mejor</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['target_value','warning_threshold','critical_threshold'] as const).map(f => (
                          <input key={f} type="number" placeholder={f.replace('_',' ')}
                            value={editMetric[f] ?? ''}
                            onChange={e => setEditMetric((p:any)=>({...p,[f]:e.target.value}))}
                            className="px-3 py-1.5 rounded-lg text-xs text-slate-200 outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveMetric(editMetric)}
                          className="flex-1 text-xs py-1.5 rounded-lg font-semibold"
                          style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                          Guardar
                        </button>
                        <button onClick={() => setEditMetric(null)}
                          className="text-xs px-3 py-1.5 rounded-lg text-slate-500"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-200">{m.label}</p>
                          <span className="text-xs text-slate-500">{m.unit}</span>
                          <span className="text-xs text-slate-600">{m.comparison === 'gte' ? '↑ más es mejor' : '↓ menos es mejor'}</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs">
                          {m.target_value != null && <span className="text-cyan-400">🎯 {m.target_value}</span>}
                          {m.warning_threshold != null && <span className="text-yellow-400">⚠ {m.warning_threshold}</span>}
                          {m.critical_threshold != null && <span className="text-red-400">✗ {m.critical_threshold}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditMetric({...m})}
                          className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          ✎
                        </button>
                        <button onClick={() => deleteMetric(m.id)}
                          className="text-xs px-2 py-1 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
