'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<'login'|'register'>('login');
  const [orgName, setOrgName]   = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        router.push(u.role === 'superadmin' ? '/admin' : '/dashboard');
      } else {
        const { api } = await import('@/lib/api');
        const res = await api.register(orgName, email, password);
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Ambient orbs */}
      <div className="fixed rounded-full pointer-events-none"
        style={{ width: 480, height: 480, background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', top: '5%', left: '15%' }} />
      <div className="fixed rounded-full pointer-events-none"
        style={{ width: 480, height: 480, background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', bottom: '5%', right: '15%' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-2xl font-bold mb-4"
            style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-400))', color: '#fff', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
            ◈
          </div>
          <h1 className="text-2xl font-bold gradient-text">DJI SaaS</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Precision Agriculture Platform</p>
        </div>

        <div className="card p-7" style={{ boxShadow: '0 0 40px rgba(16,185,129,0.08)' }}>
          {/* Mode toggle */}
          <div className="flex gap-1.5 mb-6 p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize"
                style={{
                  background: mode===m ? 'var(--surface)' : 'transparent',
                  color:      mode===m ? 'var(--text-1)'  : 'var(--text-3)',
                  boxShadow:  mode===m ? 'var(--shadow)'  : 'none',
                }}>
                {m === 'login' ? 'Ingresar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input value={orgName} onChange={e=>setOrgName(e.target.value)}
                placeholder="Nombre de organización" className="input" required />
            )}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="Email" className="input" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Contraseña" className="input" required />

            {error && (
              <p className="text-xs text-center px-3 py-2 rounded-lg"
                style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-3 mt-1"
              style={{ fontSize: '0.875rem' }}>
              {loading ? 'Cargando…' : mode === 'login' ? 'Entrar al Dashboard' : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-3)' }}>
          DJI SaaS · Agrodrones Plataforma
        </p>
      </div>
    </div>
  );
}
