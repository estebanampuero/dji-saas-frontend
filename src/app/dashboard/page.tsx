'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import BatteryGauge from '@/components/BatteryGauge';
import GPSPanel from '@/components/GPSPanel';
import FlightStatus from '@/components/FlightStatus';
import AlertItem from '@/components/AlertItem';
import DroneCard from '@/components/DroneCard';
import type { Drone, Stats, Alert, Telemetry } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';
function token() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

interface MetricDef {
  key: string;
  label: string;
  category: string;
  unit: string;
  enabled: boolean;
  display_name: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab,          setTab]          = useState('dashboard');
  const [drones,       setDrones]       = useState<Drone[]>([]);
  const [selected,     setSelected]     = useState<Drone | null>(null);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [dbAlerts,     setDbAlerts]     = useState<Alert[]>([]);
  const [latestTelem,  setLatestTelem]  = useState<Telemetry | null>(null);
  const [metricDefs,   setMetricDefs]   = useState<MetricDef[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [uploadMsg,    setUploadMsg]    = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const { telemetry, alerts: wsAlerts, connected } = useSocket(selected?.serial_number);
  const activeTelemetry = telemetry ?? latestTelem;
  const allAlerts = [...wsAlerts, ...dbAlerts].slice(0, 30);

  const enabledKeys = new Set(metricDefs.filter(m => m.enabled).map(m => m.key));
  const show = (key: string) => enabledKeys.size === 0 || enabledKeys.has(key);
  const label = (key: string, fallback: string) => metricDefs.find(m => m.key === key)?.display_name ?? fallback;

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  const load = useCallback(async () => {
    try {
      const [dr, st, al, mv] = await Promise.all([
        api.drones(), api.stats(), api.alerts(), api.metricVisibility(),
      ]);
      setDrones(dr.data ?? []);
      setStats(st.data);
      setDbAlerts(al.data ?? []);
      setMetricDefs(mv.data ?? []);
      if (!selected && dr.data?.length) setSelected(dr.data[0]);
    } catch {}
  }, []);

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (!selected) return;
    api.latest(selected.id).then(r => setLatestTelem(r.data)).catch(() => {});
  }, [selected]);

  async function resolveAlert(id: string) {
    await api.resolve(id);
    setDbAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true); setUploadMsg('');
    try {
      const text = await file.text();
      const res = await fetch(`${BASE}/api/agras/import`, {
        method: 'POST',
        headers: {
          Authorization:    `Bearer ${token()}`,
          'Content-Type':   'text/plain',
          'x-filename':     file.name,
          'x-drone-sn':     selected.serial_number,
          'x-mission-name': file.name.replace(/\.[^.]+$/, ''),
        },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const d = data.data;
      const area = d.total_area_m2
        ? (d.total_area_m2 >= 10000 ? (d.total_area_m2/10000).toFixed(2)+'ha' : d.total_area_m2.toFixed(0)+'m²')
        : '';
      setUploadMsg(`✓ ${d.points_imported} puntos${area ? ' · '+area : ''}${d.duration_sec ? ' · '+Math.round(d.duration_sec/60)+'min' : ''}`);
      load();
    } catch (err: any) {
      setUploadMsg('✗ ' + err.message);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = '';
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
          style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))', color: '#fff' }}>◈</div>
        <p className="text-sm animate-pulse" style={{ color: 'var(--brand-600)' }}>Inicializando...</p>
      </div>
    </div>
  );

  const openAlerts = allAlerts.filter(a => !a.resolved);

  const showBattery = show('battery_percent') || show('battery_voltage');
  const showGPS     = show('lat') || show('satellite_count');
  const showFlight  = show('altitude') || show('flight_mode') || show('horizontal_speed');
  const n = (v: any) => v != null ? Number(v) : null;
  const f = (v: any, d = 1) => n(v) != null ? n(v)!.toFixed(d) : null;

  const extraMetrics = [
    show('gimbal_pitch')      && { key: 'gimbal_pitch',      label: label('gimbal_pitch', 'Gimbal Pitch'),    value: f(activeTelemetry?.gimbal_pitch),    unit: '°',   color: 'purple' as const },
    show('vertical_speed')    && { key: 'vertical_speed',    label: label('vertical_speed', 'V.Speed'),       value: f(activeTelemetry?.vertical_speed),  unit: 'm/s', color: 'cyan'   as const },
    show('rc_signal_quality') && { key: 'rc_signal_quality', label: label('rc_signal_quality', 'RC Signal'),  value: activeTelemetry?.rc_signal_quality,  unit: '%',   color: 'green'  as const },
    show('gimbal_yaw')        && { key: 'gimbal_yaw',        label: label('gimbal_yaw', 'Gimbal Yaw'),        value: f(activeTelemetry?.gimbal_yaw),      unit: '°',   color: 'orange' as const },
    show('gimbal_roll')       && { key: 'gimbal_roll',       label: label('gimbal_roll', 'Gimbal Roll'),      value: f(activeTelemetry?.gimbal_roll),     unit: '°',   color: 'orange' as const },
    show('wind_speed')        && { key: 'wind_speed',        label: label('wind_speed', 'Viento'),            value: f(activeTelemetry?.wind_speed),      unit: 'm/s', color: 'cyan'   as const },
  ].filter(Boolean) as { key: string; label: string; value: any; unit: string; color: 'cyan'|'green'|'purple'|'orange' }[];

  const tabTitle: Record<string, string> = {
    dashboard: 'Live Dashboard',
    fleet:     'Flota',
    alerts:    'Alertas',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar active={tab} onChange={setTab} alertCount={openAlerts.length} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Topbar ── */}
        <header className="flex-shrink-0 flex items-center gap-4 px-6 border-b"
          style={{ height: 70, background: 'var(--surface)', borderColor: 'var(--border)' }}>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>
              {tabTitle[tab] ?? 'Dashboard'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{new Date().toLocaleString('es-CL')}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* WS status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color:      connected ? 'var(--green)'        : 'var(--red)',
                border:     `1px solid ${connected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
              <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: connected ? 'var(--green)' : 'var(--red)' }} />
              <span className="hidden sm:inline">{connected ? 'LIVE' : 'OFF'}</span>
            </div>

            {/* Upload button */}
            <label className="cursor-pointer">
              <input ref={uploadRef} type="file" accept=".csv,.kml,.txt" className="hidden"
                onChange={handleUpload} disabled={uploading || !selected} />
              <span className="btn btn-upload" style={{ opacity: (!selected || uploading) ? 0.5 : 1 }}>
                {uploading ? '⏳' : '⬆'} <span className="hidden sm:inline">{uploading ? 'Subiendo…' : 'Subir vuelo'}</span>
              </span>
            </label>

            {user?.role === 'superadmin' && (
              <button onClick={() => router.push('/admin')} className="btn btn-ghost">
                ⚙️ <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))', color: '#fff' }}>
                {(user?.email ?? 'U').slice(0,2).toUpperCase()}
              </div>
              <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-2)' }}>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Upload result */}
        {uploadMsg && (
          <div className="mx-6 mt-3 text-xs px-4 py-2.5 rounded-lg"
            style={{
              background: uploadMsg.startsWith('✓') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              color:      uploadMsg.startsWith('✓') ? 'var(--green)'          : 'var(--red)',
              border:     `1px solid ${uploadMsg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
            {uploadMsg}
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6 mobile-pb">

          {/* DASHBOARD TAB */}
          {tab === 'dashboard' && (
            <div className="space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Drones"   value={stats?.total_drones ?? 0}                  icon="🚁" color="cyan"   live />
                <StatCard label="Horas de vuelo" value={stats?.total_flight_hours ?? 0} unit="h"   icon="⏱" color="green"  />
                <StatCard label="Distancia total"value={stats?.total_distance_km ?? 0}  unit="km"  icon="📍" color="purple" />
                <StatCard label="Alertas activas"value={openAlerts.length}                          icon="⚡" color="orange" />
              </div>

              {/* Drone selector + telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Fleet panel */}
                <div className="card p-4 space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                    Flota · {drones.length} drone{drones.length !== 1 ? 's' : ''}
                  </h2>
                  {drones.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin drones registrados.</p>
                      <button onClick={() => setTab('fleet')} className="text-xs mt-2"
                        style={{ color: 'var(--accent-2)' }}>Agregar drone →</button>
                    </div>
                  ) : (
                    drones.map(d => (
                      <DroneCard key={d.id} drone={d} selected={selected?.id === d.id} onClick={() => setSelected(d)} />
                    ))
                  )}
                </div>

                {/* Telemetry area */}
                <div className="lg:col-span-2 space-y-4">
                  {selected ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full pulse" style={{ background: selected.is_online ? 'var(--green)' : 'var(--red)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{selected.nickname || selected.serial_number}</span>
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{selected.model}</span>
                        <span className={`pill ml-auto ${selected.is_online ? 'pill-green' : 'pill-gray'}`}>
                          {selected.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      <div className={`grid gap-4 ${showBattery && showGPS ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {showBattery && (
                          <BatteryGauge
                            percent={activeTelemetry?.battery_percent ?? 0}
                            voltage={show('battery_voltage') ? activeTelemetry?.battery_voltage : undefined}
                            temp={show('battery_temp') ? activeTelemetry?.battery_temp : undefined}
                            remainingMin={show('remaining_flight_time') ? activeTelemetry?.remaining_flight_time : undefined} />
                        )}
                        {showGPS && (
                          <GPSPanel
                            lat={show('lat') ? activeTelemetry?.lat : undefined}
                            lng={show('lng') ? activeTelemetry?.lng : undefined}
                            satellites={show('satellite_count') ? activeTelemetry?.satellite_count : undefined}
                            gpsLevel={show('gps_level') ? activeTelemetry?.gps_level : undefined}
                            rtk={show('rtk_state') ? activeTelemetry?.rtk_state : undefined} />
                        )}
                      </div>

                      {(show('spray_state') || show('tank_volume_percent')) && activeTelemetry?.tank_volume_percent != null && (
                        <AgrasPanel telemetry={activeTelemetry} show={show} label={label} />
                      )}

                      {showFlight && (
                        <FlightStatus
                          mode={show('flight_mode') ? activeTelemetry?.flight_mode : undefined}
                          isFlying={show('is_flying') ? activeTelemetry?.is_flying : undefined}
                          altitude={show('altitude') ? activeTelemetry?.altitude : undefined}
                          speed={show('horizontal_speed') ? activeTelemetry?.horizontal_speed : undefined}
                          heading={show('heading') ? activeTelemetry?.heading : undefined}
                          windSpeed={show('wind_speed') ? activeTelemetry?.wind_speed : undefined} />
                      )}

                      {extraMetrics.length > 0 && (
                        <div className="grid gap-3"
                          style={{ gridTemplateColumns: `repeat(${Math.min(extraMetrics.length, 3)}, minmax(0, 1fr))` }}>
                          {extraMetrics.map(m => (
                            <div key={m.key} className="card p-3 text-center">
                              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{m.label}</p>
                              <p className="text-lg font-bold" style={{ color: `var(--${m.color === 'cyan' ? 'cyan' : m.color === 'green' ? 'green' : m.color === 'purple' ? 'purple' : 'orange'})` }}>
                                {m.value ?? '—'}<span className="text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>{m.unit}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="card p-12 text-center" style={{ color: 'var(--text-3)' }}>
                      Selecciona un drone para ver telemetría
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {tab === 'alerts' && (
            <div className="space-y-3 max-w-2xl">
              {openAlerts.length === 0 ? (
                <div className="card p-12 text-center" style={{ color: 'var(--text-3)' }}>
                  Sin alertas activas 🎉
                </div>
              ) : (
                openAlerts.map((a, i) => (
                  <AlertItem key={a.id ?? i} alert={a} onResolve={resolveAlert} />
                ))
              )}
            </div>
          )}

          {/* FLEET TAB */}
          {tab === 'fleet' && (
            <div className="space-y-4 max-w-2xl">
              <AddDroneForm onAdded={load} />
              <div className="card overflow-hidden">
                {drones.map(d => (
                  <div key={d.id} className="table-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                    <span className="text-xl">🚁</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{d.nickname || d.serial_number}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>SN: {d.serial_number} · {d.model || 'Modelo desconocido'}</p>
                    </div>
                    <span className={`pill ${d.is_online ? 'pill-green' : 'pill-gray'}`}>
                      {d.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live alert toasts */}
      {wsAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 space-y-2 z-50 w-72">
          {wsAlerts.slice(0,3).map((a,i) => (
            <div key={i} className="card p-3 text-xs"
              style={{ borderColor: a.severity==='critical' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)' }}>
              <span style={{ color: a.severity==='critical' ? 'var(--red)' : 'var(--yellow)' }}>⚠ {a.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgrasPanel({ telemetry: t, show, label }: {
  telemetry: import('@/types').Telemetry;
  show: (k: string) => boolean;
  label: (k: string, fb: string) => string;
}) {
  const nv  = (v: any) => v != null ? Number(v) : null;
  const fv  = (v: any, d = 1) => nv(v) != null ? nv(v)!.toFixed(d) : null;
  const tankPct  = t.tank_volume_percent ?? 0;
  const spraying = t.spray_state;
  const tankColor = tankPct > 40 ? 'var(--green)' : tankPct > 15 ? 'var(--yellow)' : 'var(--red)';
  const tankColorRaw = tankPct > 40 ? '#22C55E' : tankPct > 15 ? '#EAB308' : '#EF4444';

  const cards = [
    show('spray_state')    && { k: 'spray_state',    lbl: label('spray_state','Pulverización'), val: spraying ? 'ACTIVA' : 'INACTIVA',  color: spraying ? 'var(--green)' : 'var(--text-3)', unit: '' },
    show('pump_state')     && { k: 'pump_state',     lbl: label('pump_state','Bomba'),           val: t.pump_state ? 'ON' : 'OFF',       color: t.pump_state ? 'var(--cyan)' : 'var(--text-3)', unit: '' },
    show('flow_rate')      && { k: 'flow_rate',      lbl: label('flow_rate','Caudal'),           val: fv(t.flow_rate),                   color: 'var(--cyan)',   unit: 'L/min' },
    show('spread_width')   && { k: 'spread_width',   lbl: label('spread_width','Ancho trabajo'), val: fv(t.spread_width),                color: 'var(--purple)', unit: 'm' },
    show('radar_height')   && { k: 'radar_height',   lbl: label('radar_height','Altura radar'),  val: fv(t.radar_height),                color: 'var(--yellow)', unit: 'm' },
    show('payload_weight') && { k: 'payload_weight', lbl: label('payload_weight','Carga líquida'),val: fv(t.payload_weight),             color: 'var(--cyan)',   unit: 'kg' },
    show('work_state')     && { k: 'work_state',     lbl: label('work_state','Estado'),          val: t.work_state?.toUpperCase(),       color: 'var(--purple)', unit: '' },
    show('nozzle_clogged') && t.nozzle_clogged && { k: 'nozzle_clogged', lbl: 'ALERTA BOQUILLA', val: 'OBSTRUIDA', color: 'var(--red)', unit: '' },
  ].filter(Boolean) as { k: string; lbl: string; val: any; color: string; unit: string }[];

  return (
    <div className="card p-4 space-y-3"
      style={{ borderColor: spraying ? 'rgba(34,197,94,0.25)' : 'var(--border)' }}>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>🌿 Agras T25 — Pulverización</p>
        <span className={`pill ${spraying ? 'pill-green' : 'pill-gray'}`}>
          {t.work_state?.toUpperCase() ?? 'IDLE'}
        </span>
      </div>

      {show('tank_volume_percent') && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-2)' }}>{label('tank_volume_percent', 'Nivel Tanque')}</span>
            <span className="font-bold" style={{ color: tankColor }}>{tankPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${tankPct}%`, background: `linear-gradient(90deg, ${tankColorRaw}66, ${tankColorRaw})` }} />
          </div>
          {tankPct < 15 && (
            <p className="text-xs mt-1 animate-pulse" style={{ color: 'var(--red)' }}>⚠ Tanque crítico — recargar</p>
          )}
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {cards.map(m => (
            <div key={m.k} className="text-center p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>{m.lbl}</p>
              <p className="text-sm font-bold" style={{ color: m.color }}>
                {m.val ?? '—'}<span className="text-xs ml-0.5" style={{ color: 'var(--text-3)' }}>{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {(show('ac_area') || show('ac_length')) && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {show('ac_area')   && (
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Área acum.</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>
                {nv(t.ac_area) ? (nv(t.ac_area)! >= 10000 ? (nv(t.ac_area)!/10000).toFixed(3)+' ha' : nv(t.ac_area)!.toFixed(0)+' m²') : '0 m²'}
              </p>
            </div>
          )}
          {show('ac_length') && (
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Dist. acum.</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--cyan)' }}>
                {nv(t.ac_length) ? (nv(t.ac_length)! >= 1000 ? (nv(t.ac_length)!/1000).toFixed(2)+' km' : nv(t.ac_length)!.toFixed(0)+' m') : '0 m'}
              </p>
            </div>
          )}
          {show('ac_time') && (
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Tiempo acum.</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>{t.ac_time ? Math.floor(t.ac_time/60)+'min' : '0min'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddDroneForm({ onAdded }: { onAdded: () => void }) {
  const [sn, setSn]             = useState<string>('');
  const [model, setModel]       = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading]   = useState<boolean>(false);
  const [err, setErr]           = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      await api.addDrone({ serial_number: sn, model, nickname });
      setSn(''); setModel(''); setNickname('');
      onAdded();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Registrar Nuevo Drone</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={sn}       onChange={e=>setSn(e.target.value)}       placeholder="Número de Serie *" className="input" required />
        <input value={model}    onChange={e=>setModel(e.target.value)}    placeholder="Modelo (ej. DJI Mavic 3)"  className="input" />
        <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Nombre / Alias"            className="input" />
      </div>
      {err && <p className="text-xs" style={{ color: 'var(--red)' }}>{err}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Agregando…' : '+ Agregar Drone'}
      </button>
    </form>
  );
}
