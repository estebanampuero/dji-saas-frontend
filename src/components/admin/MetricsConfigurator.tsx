'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  position: { label: 'Posición',     icon: '📍' },
  speed:    { label: 'Velocidad',    icon: '⚡' },
  battery:  { label: 'Batería',      icon: '🔋' },
  gps:      { label: 'GPS / Señal',  icon: '📡' },
  camera:   { label: 'Gimbal/Cámara',icon: '🎥' },
  flight:   { label: 'Vuelo',        icon: '✈️' },
  device:   { label: 'Dispositivo',  icon: '📱' },
};

interface Props { orgId: string; orgName: string; onClose: () => void; }

export default function MetricsConfigurator({ orgId, orgName, onClose }: Props) {
  const [metrics, setMetrics]   = useState<any[]>([]);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [search,  setSearch]    = useState('');

  useEffect(() => {
    adminApi.getOrgMetrics(orgId).then(r => setMetrics(r.data));
  }, [orgId]);

  const grouped = metrics.reduce((acc: any, m: any) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  function toggle(key: string) {
    setMetrics(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
    setSaved(false);
  }

  function toggleCategory(cat: string, val: boolean) {
    setMetrics(prev => prev.map(m => m.category === cat ? { ...m, enabled: val } : m));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await adminApi.setOrgMetrics(orgId, metrics.map(m => ({ key: m.key, enabled: m.enabled, display_name: m.display_name })));
    setSaving(false); setSaved(true);
  }

  const filtered = search ? metrics.filter(m => m.label.toLowerCase().includes(search.toLowerCase()) || m.key.includes(search.toLowerCase())) : null;
  const displayMetrics = filtered ? { 'search': filtered } : grouped;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass w-full max-w-3xl max-h-[90vh] flex flex-col" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="font-bold text-slate-100">Configurar Métricas</h2>
            <p className="text-xs text-slate-500 mt-0.5">{orgName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{metrics.filter(m => m.enabled).length}/{metrics.length} activas</span>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar métrica..."
            className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {/* Metrics list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {Object.entries(displayMetrics).map(([cat, items]: any) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{CATEGORIES[cat]?.icon ?? '📊'}</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{CATEGORIES[cat]?.label ?? cat}</span>
                  <span className="text-xs text-slate-600">({items.filter((m:any) => m.enabled).length}/{items.length})</span>
                </div>
                {!search && (
                  <div className="flex gap-2">
                    <button onClick={() => toggleCategory(cat, true)}  className="text-xs text-cyan-500 hover:text-cyan-300">Todo</button>
                    <button onClick={() => toggleCategory(cat, false)} className="text-xs text-slate-500 hover:text-slate-300">Ninguno</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((m: any) => (
                  <div key={m.key} onClick={() => toggle(m.key)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{ background: m.enabled ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.enabled ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: m.enabled ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.enabled ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                      {m.enabled && <span className="text-cyan-400 text-xs">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{m.label}</p>
                      <p className="text-xs text-slate-500 truncate">{m.key}{m.unit ? ` · ${m.unit}` : ''}</p>
                    </div>
                    {m.is_critical && <span className="text-xs text-orange-400 ml-auto flex-shrink-0">⚠</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/5">
          <button onClick={() => setMetrics(prev => prev.map(m => ({ ...m, enabled: true })))}
            className="text-xs text-slate-500 hover:text-slate-300">Habilitar todas</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: saved ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.15)', color: saved ? '#00ff88' : '#00d4ff', border: `1px solid ${saved ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.3)'}` }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
