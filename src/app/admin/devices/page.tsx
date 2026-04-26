'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

interface DeviceToken {
  id: string;
  label: string;
  drone_sn: string;
  token: string;
  created_at: string;
  last_used: string | null;
  setup_used: boolean;
  setup_expires_at: string | null;
}
interface SetupResult {
  install_url: string;
  termux_cmd: string;
  expires_at: string;
  label: string;
  drone_sn: string;
}

function qrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

export default function DevicesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tokens,    setTokens]    = useState<DeviceToken[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState({ label: '', drone_sn: '' });
  const [creating,  setCreating]  = useState(false);
  const [setup,     setSetup]     = useState<SetupResult | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [err,       setErr]       = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/device/tokens`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const j = await r.json();
      setTokens(j.data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.drone_sn.trim()) { setErr('El número de serie es requerido'); return; }
    setCreating(true); setErr(''); setSetup(null);
    try {
      const r = await fetch(`${BASE}/api/device/setup-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setSetup({ ...j.data, label: form.label, drone_sn: form.drone_sn });
      setForm({ label: '', drone_sn: '' });
      load();
    } catch (e: any) { setErr(e.message); }
    setCreating(false);
  }

  async function deleteToken(id: string) {
    await fetch(`${BASE}/api/device/tokens/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` }
    });
    setTokens(prev => prev.filter(t => t.id !== id));
    if (setup) setSetup(null);
  }

  function copyCmd() {
    if (!setup) return;
    navigator.clipboard.writeText(setup.termux_cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen mobile-pb" style={{ background: 'var(--bg)' }}>
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex items-center gap-4 px-6 border-b"
        style={{ height: 70, background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.push('/admin')} className="btn btn-ghost">← Admin</button>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Dispositivos RC Plus</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Genera links de instalación automática para cada controlador
          </p>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Cómo funciona */}
        <div className="card p-5" style={{ borderColor: 'var(--brand-200)', background: 'var(--brand-50)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-700)' }}>
            📱 Cómo funciona la instalación automática
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs" style={{ color: 'var(--brand-700)' }}>
            {[
              ['1', 'Genera el link aquí abajo con el SN del drone'],
              ['2', 'El piloto instala Termux en el RC Plus (una vez)'],
              ['3', 'Escanea el QR o copia el comando en Termux'],
              ['4', 'Todo se instala y configura automáticamente ✅'],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--brand-500)', color: '#fff' }}>{n}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
            Nuevo enlace de instalación
          </h2>
          <form onSubmit={generate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Nombre del dispositivo
                </label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="ej. RC Plus — Agrodrones Sur"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Número de serie del drone <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input
                  value={form.drone_sn}
                  onChange={e => setForm(f => ({ ...f, drone_sn: e.target.value }))}
                  placeholder="ej. 1ZNBJ2R0025BXX"
                  className="input"
                  required
                />
              </div>
            </div>
            {err && <p className="text-xs" style={{ color: 'var(--red)' }}>{err}</p>}
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? 'Generando…' : '🔗 Generar enlace de instalación'}
            </button>
          </form>
        </div>

        {/* Resultado con QR */}
        {setup && (
          <div className="card p-6" style={{ borderColor: 'var(--brand-200)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  ✅ Enlace generado — {setup.label || setup.drone_sn}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  Válido por 48h · Un solo uso
                </p>
              </div>
              <button onClick={() => setSetup(null)} style={{ color: 'var(--text-3)' }}>✕</button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <img src={qrUrl(setup.install_url)} alt="QR instalación"
                  className="rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                  Escanear con RC Plus
                </p>
              </div>

              {/* Instrucciones */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                    Paso 1 — Instalar Termux (si no está instalado)
                  </p>
                  <div className="rounded-lg p-3 text-xs font-mono"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
                    Descargar APK:<br />
                    <span style={{ color: 'var(--accent)' }}>f-droid.org → buscar "Termux"</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                    Paso 2 — Ejecutar en Termux (copia y pega)
                  </p>
                  <div className="rounded-lg p-3 text-xs font-mono break-all"
                    style={{ background: '#111827', color: '#34D399', border: '1px solid var(--border)' }}>
                    {setup.termux_cmd}
                  </div>
                  <button onClick={copyCmd} className="btn btn-ghost mt-2 text-xs">
                    {copied ? '✅ Copiado' : '📋 Copiar comando'}
                  </button>
                </div>

                <div className="rounded-lg p-3 text-xs"
                  style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
                  <strong>Listo.</strong> El script instala todo automáticamente, configura el token
                  del drone <strong>{setup.drone_sn}</strong> y activa el sync al terminar cada vuelo.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de dispositivos */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              Dispositivos registrados
            </h2>
            <span className="pill pill-gray">{tokens.length}</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>Cargando…</div>
          ) : tokens.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>
              Sin dispositivos aún — genera el primer enlace arriba
            </div>
          ) : (
            tokens.map(t => (
              <div key={t.id} className="table-row"
                style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    📱 {t.label || 'RC Plus'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    SN: {t.drone_sn || '—'} · Creado: {fmtDate(t.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>Último uso</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                    {fmtDate(t.last_used)}
                  </p>
                </div>

                <span className={`pill ${t.last_used ? 'pill-green' : 'pill-gray'}`}>
                  {t.last_used ? 'Activo' : 'Sin uso'}
                </span>

                <button onClick={() => deleteToken(t.id)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
