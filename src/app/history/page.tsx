'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

interface Flight {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  status: string;
  max_altitude: number;
  max_speed: number;
  total_area_m2: number;
  total_spray_liters: number;
  mission_name: string;
  filename: string;
  telemetry_points: number;
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [drones,    setDrones]    = useState<any[]>([]);
  const [selected,  setSelected]  = useState<string>('');
  const [flights,   setFlights]   = useState<Flight[]>([]);
  const [importing, setImporting] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [loadingF,  setLoadingF]  = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) api.drones().then(r => {
      setDrones(r.data ?? []);
      if (r.data?.length) setSelected(r.data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    setLoadingF(true);
    fetch(`${BASE}/api/agras/flights/${selected}`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(r => setFlights(r.data ?? []))
      .finally(() => setLoadingF(false));
  }, [selected]);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    const drone = drones.find(d => d.id === selected);
    if (!drone) return;

    setImporting(true); setMsg('');
    try {
      const text = await file.text();
      const res = await fetch(`${BASE}/api/agras/import`, {
        method: 'POST',
        headers: {
          Authorization:    `Bearer ${token()}`,
          'Content-Type':   'text/plain',
          'x-filename':     file.name,
          'x-drone-sn':     drone.serial_number,
          'x-mission-name': file.name.replace(/\.[^.]+$/, ''),
        },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const d = data.data;
      setMsg(`✓ Importado: ${d.points_imported} puntos · ${d.total_area_m2 ? (d.total_area_m2 >= 10000 ? (d.total_area_m2/10000).toFixed(2)+'ha' : d.total_area_m2.toFixed(0)+'m²') : 'sin área'} · ${d.duration_sec ? Math.round(d.duration_sec/60)+'min' : ''}`);
      // Recargar vuelos
      const r2 = await fetch(`${BASE}/api/agras/flights/${selected}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const j2 = await r2.json();
      setFlights(j2.data ?? []);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function fmtDuration(sec: number) {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  function fmtArea(m2: number) {
    if (!m2) return '—';
    return m2 >= 10000 ? (m2 / 10000).toFixed(3) + ' ha' : m2.toFixed(0) + ' m²';
  }

  function fmtDate(ts: string) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  }

  const totalArea    = flights.reduce((s, f) => s + (f.total_area_m2 || 0), 0);
  const totalFlights = flights.length;
  const totalHours   = flights.reduce((s, f) => s + (f.duration_seconds || 0), 0) / 3600;

  if (loading) return null;

  return (
    <div className="min-h-screen relative z-10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Historial de Vuelos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Importa y consulta operaciones pasadas</p>
        </div>
        <button onClick={() => router.push('/dashboard')}
          className="text-xs text-slate-500 hover:text-slate-300 glass px-3 py-1.5 rounded-full">
          ← Dashboard
        </button>
      </div>

      {/* Selector de dron */}
      <div className="flex items-center gap-3 mb-6">
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm text-slate-200 outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {drones.map(d => (
            <option key={d.id} value={d.id}>{d.nickname || d.serial_number} — {d.model}</option>
          ))}
        </select>

        {/* Botón importar */}
        <label className="cursor-pointer">
          <input ref={fileRef} type="file" accept=".csv,.kml,.txt" className="hidden" onChange={handleImport} disabled={importing} />
          <span className="text-xs px-4 py-2 rounded-xl font-semibold transition-all inline-block"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)', opacity: importing ? 0.5 : 1 }}>
            {importing ? '⏳ Importando...' : '⬆ Importar CSV / KML de DJI Agras'}
          </span>
        </label>
      </div>

      {msg && (
        <div className="mb-4 text-sm px-4 py-2 rounded-xl"
          style={{
            background: msg.startsWith('✓') ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
            color:      msg.startsWith('✓') ? '#00ff88' : '#ef4444',
            border:    `1px solid ${msg.startsWith('✓') ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>{msg}</div>
      )}

      {/* Cómo exportar de DJI Agras */}
      <div className="glass p-4 mb-6 text-xs text-slate-400 space-y-1"
        style={{ borderColor: 'rgba(167,139,250,0.15)' }}>
        <p className="text-slate-300 font-semibold mb-2">📱 Cómo exportar desde DJI Agras</p>
        <p>1. Abre DJI Agras → <strong className="text-slate-200">Mis Operaciones</strong></p>
        <p>2. Selecciona cualquier operación pasada</p>
        <p>3. Toca los <strong className="text-slate-200">tres puntos (···)</strong> → <strong className="text-slate-200">Exportar registro de vuelo</strong></p>
        <p>4. Elige <strong className="text-slate-200">CSV</strong> o <strong className="text-slate-200">KML</strong> → guarda el archivo</p>
        <p>5. Sube el archivo aquí con el botón ⬆ de arriba</p>
      </div>

      {/* Stats resumen */}
      {flights.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Vuelos totales',  value: totalFlights,              unit: '',    color: '#00d4ff' },
            { label: 'Área cubierta',   value: fmtArea(totalArea),        unit: '',    color: '#00ff88' },
            { label: 'Horas de vuelo',  value: totalHours.toFixed(1),     unit: 'h',   color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="glass p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}<span className="text-xs text-slate-500 ml-1">{s.unit}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de vuelos */}
      {loadingF ? (
        <div className="glass p-8 text-center text-slate-600 text-sm animate-pulse">Cargando historial...</div>
      ) : flights.length === 0 ? (
        <div className="glass p-12 text-center space-y-2">
          <p className="text-slate-500 text-sm">Sin vuelos registrados aún</p>
          <p className="text-slate-600 text-xs">Importa un CSV de DJI Agras o conecta el dron para empezar a registrar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flights.map(f => (
            <div key={f.id} className="glass p-4 flex items-center gap-4">
              <div className="text-2xl">✈️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {f.mission_name || f.filename || 'Vuelo sin nombre'}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: f.status === 'completed' ? 'rgba(0,255,136,0.08)' : 'rgba(251,191,36,0.08)', color: f.status === 'completed' ? '#00ff88' : '#fbbf24' }}>
                    {f.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {fmtDate(f.started_at)}
                  {f.ended_at && f.started_at !== f.ended_at && ` → ${fmtDate(f.ended_at)}`}
                </p>
              </div>
              <div className="flex gap-4 text-center flex-shrink-0">
                {f.total_area_m2 && (
                  <div>
                    <p className="text-xs text-slate-500">Área</p>
                    <p className="text-sm font-semibold text-green-400">{fmtArea(f.total_area_m2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Duración</p>
                  <p className="text-sm font-semibold text-cyan-400">{fmtDuration(f.duration_seconds)}</p>
                </div>
                {f.max_altitude && (
                  <div>
                    <p className="text-xs text-slate-500">Alt. máx</p>
                    <p className="text-sm font-semibold text-purple-400">{f.max_altitude?.toFixed(1)}m</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Puntos</p>
                  <p className="text-sm font-semibold text-slate-400">{f.telemetry_points?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
