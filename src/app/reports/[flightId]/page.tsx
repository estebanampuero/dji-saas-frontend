'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

async function req(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token()}` } });
  return r.json();
}

function fmt(val: any, unit: string) {
  if (val == null) return '—';
  if (unit === 'min') return `${val} min`;
  if (unit === 'm²') return val >= 10000 ? `${(val/10000).toFixed(3)} ha` : `${val} m²`;
  if (unit === 'm') return val >= 1000 ? `${(val/1000).toFixed(2)} km` : `${val} m`;
  return `${val}${unit ? ' '+unit : ''}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    ok:       { bg: 'rgba(0,255,136,0.1)',  border: 'rgba(0,255,136,0.3)',  color: '#00ff88', label: '✓ OK' },
    warning:  { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24', label: '⚠ Atención' },
    critical: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444', label: '✗ Crítico' },
  };
  const s = map[status] || map.ok;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}

function GpsMap({ route }: { route: { lat: number; lng: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !route.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const lats = route.map(p => p.lat), lngs = route.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 20;

    const toX = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng || 1)) * (W - pad*2);
    const toY = (lat: number) => H - pad - ((lat - minLat) / (maxLat - minLat || 1)) * (H - pad*2);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    // Route line
    ctx.beginPath();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 6;
    route.forEach((p, i) => {
      i === 0 ? ctx.moveTo(toX(p.lng), toY(p.lat)) : ctx.lineTo(toX(p.lng), toY(p.lat));
    });
    ctx.stroke();

    // Start point
    ctx.beginPath();
    ctx.arc(toX(route[0].lng), toY(route[0].lat), 6, 0, Math.PI*2);
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fill();

    // End point
    const last = route[route.length-1];
    ctx.beginPath();
    ctx.arc(toX(last.lng), toY(last.lat), 6, 0, Math.PI*2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fill();
  }, [route]);

  if (!route.length) return (
    <div className="glass flex items-center justify-center h-48 text-slate-600 text-sm">Sin datos GPS</div>
  );

  return (
    <div className="glass p-2 rounded-xl overflow-hidden">
      <canvas ref={canvasRef} width={600} height={280} className="w-full rounded-lg" />
      <div className="flex gap-4 mt-2 px-2 text-xs text-slate-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />Inicio</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />Fin</span>
        <span className="ml-auto">{route.length} puntos GPS</span>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { flightId } = useParams<{ flightId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    req(`/api/reports/${flightId}`).then(r => {
      if (r.success) setData(r.data);
    }).finally(() => setFetching(false));
  }, [user, flightId]);

  function handlePrint() {
    window.print();
  }

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-cyan-400 text-sm animate-pulse">Generando reporte...</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-400 text-sm">Reporte no encontrado</div>
    </div>
  );

  const m = data.metrics;
  const kpis: any[] = data.kpi_results;
  const okCount   = kpis.filter(k => k.status === 'ok').length;
  const warnCount = kpis.filter(k => k.status === 'warning').length;
  const critCount = kpis.filter(k => k.status === 'critical').length;

  const summaryCards = [
    { label: 'Área trabajada',     value: m.total_area_ha ? `${m.total_area_ha} ha` : m.total_area_m2 ? `${m.total_area_m2} m²` : '—', color: '#00ff88',  icon: '🌱' },
    { label: 'Duración',           value: m.duration_min ? `${m.duration_min} min` : '—',                                              color: '#00d4ff',  icon: '⏱' },
    { label: 'Distancia',          value: m.distance_km ? `${m.distance_km} km` : m.distance_m ? `${m.distance_m} m` : '—',           color: '#a78bfa',  icon: '📍' },
    { label: 'Aplicado',           value: m.total_spray_liters ? `${m.total_spray_liters} L` : '—',                                    color: '#34d399',  icon: '💧' },
    { label: 'Dosis/ha',           value: m.liters_per_ha ? `${m.liters_per_ha} L/ha` : '—',                                          color: '#fbbf24',  icon: '⚗️' },
    { label: 'Batería consumida',  value: m.battery_consumed != null ? `${m.battery_consumed}%` : '—',                                 color: '#fb923c',  icon: '🔋' },
  ];

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .glass { border: 1px solid #ddd !important; background: white !important; }
        }
      `}</style>

      <div className="min-h-screen relative z-10 p-3 md:p-6" ref={printRef}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 no-print">
          <button onClick={() => router.back()}
            className="text-xs text-slate-500 hover:text-slate-300 glass px-3 py-1.5 rounded-full">
            ← Volver
          </button>
          <button onClick={handlePrint}
            className="text-xs px-4 py-2 rounded-xl font-semibold"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
            ⬇ Descargar PDF
          </button>
        </div>

        {/* Encabezado del reporte */}
        <div className="glass p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">✈️</span>
              <h1 className="text-xl font-bold text-slate-100">{m.mission_name}</h1>
            </div>
            <p className="text-xs text-slate-500">{m.org_name} · {m.drone_nickname} · {m.drone_model}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              {m.started_at ? new Date(m.started_at).toLocaleString('es-CL') : '—'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
              ✓ {okCount} KPI ok
            </span>
            {warnCount > 0 && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                ⚠ {warnCount} atención
              </span>
            )}
            {critCount > 0 && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                ✗ {critCount} crítico
              </span>
            )}
          </div>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          {summaryCards.map(c => (
            <div key={c.label} className="glass p-3 text-center">
              <div className="text-lg mb-0.5">{c.icon}</div>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-sm font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Mapa GPS */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ruta de vuelo</h2>
            <GpsMap route={m.gps_route || []} />
          </div>

          {/* KPIs */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              KPIs — {data.profile_name}
            </h2>
            <div className="space-y-2">
              {kpis.length === 0 && (
                <div className="glass p-4 text-center text-xs text-slate-600">Sin KPIs configurados</div>
              )}
              {kpis.map(k => (
                <div key={k.key} className="glass p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{k.label}</p>
                    <p className="text-sm font-bold text-slate-200">
                      {fmt(k.value, k.unit)}
                      {k.target != null && (
                        <span className="text-xs text-slate-600 ml-2">/ objetivo: {fmt(k.target, k.unit)}</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={k.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla completa de métricas */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Métricas completas del vuelo</h2>
          <div className="glass p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Inicio',            value: m.started_at ? new Date(m.started_at).toLocaleString('es-CL') : '—' },
                { label: 'Fin',               value: m.ended_at ? new Date(m.ended_at).toLocaleString('es-CL') : '—' },
                { label: 'Duración',          value: m.duration_min ? `${m.duration_min} min (${m.duration_seconds}s)` : '—' },
                { label: 'Área m²',           value: m.total_area_m2 ? `${m.total_area_m2} m²` : '—' },
                { label: 'Área ha',           value: m.total_area_ha ? `${m.total_area_ha} ha` : '—' },
                { label: 'Distancia',         value: m.distance_km ? `${m.distance_km} km` : m.distance_m ? `${m.distance_m} m` : '—' },
                { label: 'Altitud máx.',      value: m.max_altitude ? `${m.max_altitude} m` : '—' },
                { label: 'Velocidad máx.',    value: m.max_speed ? `${m.max_speed} m/s` : '—' },
                { label: 'Velocidad prom.',   value: m.avg_speed ? `${m.avg_speed} m/s` : '—' },
                { label: 'Aplicado total',    value: m.total_spray_liters ? `${m.total_spray_liters} L` : '—' },
                { label: 'Dosis/ha',          value: m.liters_per_ha ? `${m.liters_per_ha} L/ha` : '—' },
                { label: 'Cobertura',         value: m.coverage_efficiency ? `${m.coverage_efficiency}%` : '—' },
                { label: 'Batería inicio',    value: m.battery_start != null ? `${m.battery_start}%` : '—' },
                { label: 'Batería fin',       value: m.battery_end != null ? `${m.battery_end}%` : '—' },
                { label: 'Batería consumida', value: m.battery_consumed != null ? `${m.battery_consumed}%` : '—' },
                { label: 'Puntos GPS',        value: `${m.gps_points || 0}` },
              ].map(r => (
                <div key={r.label} className="border-b border-white/5 pb-2">
                  <p className="text-xs text-slate-600">{r.label}</p>
                  <p className="text-sm text-slate-300 font-medium">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-700">
          Reporte generado · {new Date().toLocaleString('es-CL')} · {m.org_name}
        </div>
      </div>
    </>
  );
}
