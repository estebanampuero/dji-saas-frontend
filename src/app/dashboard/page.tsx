'use client';
import { useEffect, useState, useCallback } from 'react';
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

  const { telemetry, alerts: wsAlerts, connected } = useSocket(selected?.serial_number);
  const activeTelemetry = telemetry ?? latestTelem;
  const allAlerts = [...wsAlerts, ...dbAlerts].slice(0, 30);

  // Set of enabled metric keys for this org
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-cyan-400 text-sm animate-pulse">Initializing...</div>
    </div>
  );

  const openAlerts = allAlerts.filter(a => !a.resolved);

  // Determine which main panels to show
  const showBattery    = show('battery_percent') || show('battery_voltage');
  const showGPS        = show('lat') || show('satellite_count');
  const showFlight     = show('altitude') || show('flight_mode') || show('horizontal_speed');
  const extraMetrics   = [
    show('gimbal_pitch')      && { key: 'gimbal_pitch',      label: label('gimbal_pitch', 'Gimbal Pitch'), value: activeTelemetry?.gimbal_pitch?.toFixed(1),      unit: '°',   color: '#a78bfa' },
    show('vertical_speed')    && { key: 'vertical_speed',    label: label('vertical_speed', 'V.Speed'),   value: activeTelemetry?.vertical_speed?.toFixed(1),    unit: 'm/s', color: '#00d4ff' },
    show('rc_signal_quality') && { key: 'rc_signal_quality', label: label('rc_signal_quality', 'RC Signal'), value: activeTelemetry?.rc_signal_quality,            unit: '%',   color: '#00ff88' },
    show('gimbal_yaw')        && { key: 'gimbal_yaw',        label: label('gimbal_yaw', 'Gimbal Yaw'),    value: activeTelemetry?.gimbal_yaw?.toFixed(1),        unit: '°',   color: '#fbbf24' },
    show('gimbal_roll')       && { key: 'gimbal_roll',       label: label('gimbal_roll', 'Gimbal Roll'),  value: activeTelemetry?.gimbal_roll?.toFixed(1),        unit: '°',   color: '#fb923c' },
    show('wind_speed')        && { key: 'wind_speed',        label: label('wind_speed', 'Viento'),        value: activeTelemetry?.wind_speed?.toFixed(1),        unit: 'm/s', color: '#34d399' },
  ].filter(Boolean) as { key: string; label: string; value: any; unit: string; color: string }[];

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <Sidebar active={tab} onChange={setTab} alertCount={openAlerts.length} />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {tab === 'dashboard' && 'Live Dashboard'}
              {tab === 'fleet'     && 'Fleet Management'}
              {tab === 'flights'   && 'Flight History'}
              {tab === 'alerts'    && 'Alerts'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: connected ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${connected ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: connected ? '#00ff88' : '#ef4444' }} />
              <span className="text-xs" style={{ color: connected ? '#00ff88' : '#ef4444' }}>{connected ? 'WS LIVE' : 'OFFLINE'}</span>
            </div>
            <div className="text-xs text-slate-500 glass px-3 py-1.5 rounded-full">
              {user?.email}
            </div>
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Drones"   value={stats?.total_drones ?? 0}                  icon="🚁" color="cyan"   />
              <StatCard label="Flight Hours"   value={stats?.total_flight_hours ?? 0} unit="h"   icon="⏱" color="green"  />
              <StatCard label="Distance"       value={stats?.total_distance_km ?? 0}  unit="km"  icon="📍" color="purple" />
              <StatCard label="Open Alerts"    value={openAlerts.length}                          icon="⚠️" color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Fleet sidebar */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fleet</h2>
                {drones.length === 0 && (
                  <div className="glass p-4 text-center text-xs text-slate-600">
                    No drones registered yet.<br/>
                    <button onClick={() => setTab('fleet')} className="text-cyan-400 mt-1 hover:underline">Add drone →</button>
                  </div>
                )}
                {drones.map(d => (
                  <DroneCard key={d.id} drone={d} selected={selected?.id === d.id} onClick={() => setSelected(d)} />
                ))}
              </div>

              {/* Telemetry panels */}
              <div className="lg:col-span-2 space-y-4">
                {selected ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full pulse" style={{ background: selected.is_online ? '#00ff88' : '#ef4444' }} />
                      <span className="text-sm font-semibold text-slate-200">{selected.nickname || selected.serial_number}</span>
                      <span className="text-xs text-slate-500">{selected.model}</span>
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

                    {showFlight && (
                      <FlightStatus
                        mode={show('flight_mode') ? activeTelemetry?.flight_mode : undefined}
                        isFlying={show('is_flying') ? activeTelemetry?.is_flying : undefined}
                        altitude={show('altitude') ? activeTelemetry?.altitude : undefined}
                        speed={show('horizontal_speed') ? activeTelemetry?.horizontal_speed : undefined}
                        heading={show('heading') ? activeTelemetry?.heading : undefined}
                        windSpeed={show('wind_speed') ? activeTelemetry?.wind_speed : undefined} />
                    )}

                    {/* Extra metrics — only those enabled */}
                    {extraMetrics.length > 0 && (
                      <div className={`grid gap-3 grid-cols-${Math.min(extraMetrics.length, 3)}`}
                        style={{ gridTemplateColumns: `repeat(${Math.min(extraMetrics.length, 3)}, minmax(0, 1fr))` }}>
                        {extraMetrics.map(m => (
                          <div key={m.key} className="glass p-3 text-center">
                            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                            <p className="text-lg font-bold" style={{ color: m.color }}>
                              {m.value ?? '—'}<span className="text-xs text-slate-500 ml-0.5">{m.unit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass p-12 text-center text-slate-600 text-sm">Select a drone to view telemetry</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-3 max-w-2xl">
            {openAlerts.length === 0 && (
              <div className="glass p-8 text-center text-slate-600 text-sm">No active alerts 🎉</div>
            )}
            {openAlerts.map((a, i) => (
              <AlertItem key={a.id ?? i} alert={a} onResolve={resolveAlert} />
            ))}
          </div>
        )}

        {/* FLEET TAB */}
        {tab === 'fleet' && (
          <div className="space-y-4 max-w-2xl">
            <AddDroneForm onAdded={load} />
            <div className="space-y-3">
              {drones.map(d => (
                <div key={d.id} className="glass p-4 flex items-center gap-4">
                  <span className="text-2xl">🚁</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{d.nickname || d.serial_number}</p>
                    <p className="text-xs text-slate-500">SN: {d.serial_number} • {d.model || 'Unknown model'}</p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: d.is_online ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.08)', color: d.is_online ? '#00ff88' : '#ef4444' }}>
                    {d.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Live alerts toast */}
      {wsAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50 w-72">
          {wsAlerts.slice(0,3).map((a,i) => (
            <div key={i} className="glass p-3 text-xs animate-pulse" style={{ borderColor: a.severity==='critical' ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)' }}>
              <span style={{ color: a.severity==='critical' ? '#ef4444' : '#fbbf24' }}>⚠ {a.message}</span>
            </div>
          ))}
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
    <form onSubmit={submit} className="glass p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Register New Drone</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { val: sn,       set: setSn,       ph: 'Serial Number *' },
          { val: model,    set: setModel,    ph: 'Model (e.g. DJI Mavic 3)' },
          { val: nickname, set: setNickname, ph: 'Nickname' },
        ].map((f,i) => (
          <input key={i} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
            className="px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none w-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            required={i===0} />
        ))}
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <button type="submit" disabled={loading}
        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
        {loading ? 'Adding...' : '+ Add Drone'}
      </button>
    </form>
  );
}
