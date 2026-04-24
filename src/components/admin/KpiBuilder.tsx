'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

const OPERATORS = ['<', '<=', '>', '>=', '='];
const SEVERITIES = [
  { value: 'critical', label: 'Crítico', color: '#ef4444' },
  { value: 'warning',  label: 'Advertencia', color: '#fbbf24' },
  { value: 'info',     label: 'Informativo', color: '#00d4ff' },
];

interface Props { orgId: string; orgName: string; onClose: () => void; }

export default function KpiBuilder({ orgId, orgName, onClose }: Props) {
  const [rules,   setRules]   = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [form,    setForm]    = useState({ metric_key: '', label: '', operator: '<', threshold: '', severity: 'warning' });
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getKpis(orgId), adminApi.metricDefs()]).then(([k, m]) => {
      setRules(k.data); setMetrics(m.data);
    });
  }, [orgId]);

  async function addRule(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await adminApi.createKpi(orgId, { ...form, threshold: parseFloat(form.threshold) });
      setRules(prev => [res.data, ...prev]);
      setForm({ metric_key: '', label: '', operator: '<', threshold: '', severity: 'warning' });
    } finally { setSaving(false); }
  }

  async function deleteRule(id: string) {
    await adminApi.deleteKpi(orgId, id);
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function toggleRule(rule: any) {
    await adminApi.updateKpi(orgId, rule.id, { ...rule, enabled: !rule.enabled });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
  }

  const sevColor = (s: string) => SEVERITIES.find(x => x.value === s)?.color ?? '#94a3b8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="font-bold text-slate-100">Reglas KPI</h2>
            <p className="text-xs text-slate-500 mt-0.5">{orgName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        {/* Add rule form */}
        <form onSubmit={addRule} className="p-5 border-b border-white/5 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nueva regla</p>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.metric_key} onChange={e => setForm(f => ({ ...f, metric_key: e.target.value }))}
              className="col-span-2 px-3 py-2 rounded-xl text-sm text-slate-200 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} required>
              <option value="">Seleccionar métrica...</option>
              {metrics.map((m: any) => <option key={m.key} value={m.key}>{m.label} ({m.unit || 'sin unidad'})</option>)}
            </select>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Nombre de la alerta" required
              className="col-span-2 px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div className="flex gap-2">
              <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}
                className="px-3 py-2 rounded-xl text-sm text-slate-200 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
              <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                placeholder="Umbral" required
                className="flex-1 px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: sevColor(form.severity) }}>
              {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
            {saving ? 'Guardando...' : '+ Agregar regla'}
          </button>
        </form>

        {/* Rules list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {rules.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Sin reglas configuradas</p>}
          {rules.map((rule: any) => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: rule.enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', opacity: rule.enabled ? 1 : 0.5 }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sevColor(rule.severity) }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium">{rule.label}</p>
                <p className="text-xs text-slate-500">{rule.metric_key} {rule.operator} {rule.threshold}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${sevColor(rule.severity)}15`, color: sevColor(rule.severity) }}>{rule.severity}</span>
              <button onClick={() => toggleRule(rule)} className="text-xs text-slate-600 hover:text-cyan-400">{rule.enabled ? '⏸' : '▶'}</button>
              <button onClick={() => deleteRule(rule.id)} className="text-xs text-slate-600 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
