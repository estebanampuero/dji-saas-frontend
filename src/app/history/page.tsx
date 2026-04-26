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
    <div className="min-h-screen mobile-pb" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex items-center gap-4 px-6 border-b"
        style={{ height: 70, background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.push('/dashboard')} className="btn btn-ghost">
          ← Dashboard
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Historial de Vuelos</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Importa y consulta operaciones pasadas</p>
        </div>
      </header>

      <div className="p-6 space-y-5">
        {/* Drone selector + import */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selected} onChange={e => setSelected(e.target.value)} className="input flex-1">
            {drones.map(d => (
              <option key={d.id} value={d.id}>{d.nickname || d.serial_number} — {d.model}</option>
            ))}
          </select>
          <label className="cursor-pointer flex-shrink-0">
            <input ref={fileRef} type="file" accept=".csv,.kml,.txt" className="hidden" onChange={handleImport} disabled={importing} />
            <span className="btn btn-upload" style={{ opacity: importing ? 0.5 : 1 }}>
              {importing ? '⏳ Importando…' : '⬆ Importar DJI Agras'}
            </span>
          </label>
        </div>

        {msg && (
          <div className="text-sm px-4 py-2.5 rounded-lg"
            style={{
              background: msg.startsWith('✓') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              color:      msg.startsWith('✓') ? 'var(--green)'          : 'var(--red)',
              border:    `1px solid ${msg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>{msg}</div>
        )}

        {/* Export instructions */}
        <div className="card p-4 text-xs space-y-1.5"
          style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
          <p className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>📱 Cómo exportar desde DJI Agras</p>
          <p style={{ color: 'var(--text-2)' }}>1. Abre DJI Agras → <strong style={{ color: 'var(--text-1)' }}>Mis Operaciones</strong></p>
          <p style={{ color: 'var(--text-2)' }}>2. Selecciona cualquier operación pasada</p>
          <p style={{ color: 'var(--text-2)' }}>3. Toca los <strong style={{ color: 'var(--text-1)' }}>tres puntos (···)</strong> → <strong style={{ color: 'var(--text-1)' }}>Exportar registro de vuelo</strong></p>
          <p style={{ color: 'var(--text-2)' }}>4. Elige <strong style={{ color: 'var(--text-1)' }}>CSV</strong> o <strong style={{ color: 'var(--text-1)' }}>KML</strong> → guarda el archivo</p>
          <p style={{ color: 'var(--text-2)' }}>5. Sube el archivo aquí con el botón ⬆ de arriba</p>
        </div>

        {/* Summary KPIs */}
        {flights.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Vuelos totales',  value: totalFlights,          unit: '',  color: 'var(--cyan)'   },
              { label: 'Área cubierta',   value: fmtArea(totalArea),    unit: '',  color: 'var(--green)'  },
              { label: 'Horas de vuelo',  value: totalHours.toFixed(1), unit: 'h', color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="kpi-value" style={{ color: s.color }}>
                  {s.value}<span className="text-sm font-normal ml-1" style={{ color: 'var(--text-3)' }}>{s.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Flight list */}
        {loadingF ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : flights.length === 0 ? (
          <div className="card p-12 text-center space-y-2">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin vuelos registrados aún</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Importa un CSV de DJI Agras o conecta el dron para empezar a registrar</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {flights.map(f => (
              <div key={f.id} className="table-row" style={{ gridTemplateColumns: 'auto 1fr' }}>
                <span className="text-xl">✈️</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {f.mission_name || f.filename || 'Vuelo sin nombre'}
                    </p>
                    <span className={`pill flex-shrink-0 ${f.status === 'completed' ? 'pill-green' : 'pill-yellow'}`}>
                      {f.status}
                    </span>
                    <button onClick={() => router.push(`/reports/${f.id}`)}
                      className="text-xs ml-auto flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-2)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      Ver reporte →
                    </button>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{fmtDate(f.started_at)}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {f.total_area_m2 ? (
                      <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Área</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>{fmtArea(f.total_area_m2)}</p>
                      </div>
                    ) : null}
                    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Duración</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>{fmtDuration(f.duration_seconds)}</p>
                    </div>
                    {f.max_altitude ? (
                      <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Alt. máx</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>{Number(f.max_altitude).toFixed(1)}m</p>
                      </div>
                    ) : null}
                    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Puntos GPS</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{f.telemetry_points?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
