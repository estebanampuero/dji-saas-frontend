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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background orbs */}
      <div className="fixed w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', top: '10%', left: '20%' }} />
      <div className="fixed w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)', bottom: '10%', right: '20%' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-4xl">🚁</span>
            <div className="text-left">
              <h1 className="text-2xl font-bold gradient-text">DJI SaaS</h1>
              <p className="text-xs text-slate-500">Aquaculture Drone Platform</p>
            </div>
          </div>
        </div>

        <div className="glass p-8 glow-cyan">
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{ background: mode===m ? 'rgba(0,212,255,0.12)' : 'transparent', color: mode===m ? '#00d4ff' : '#475569', border: mode===m ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent' }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Organization name"
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} required />
            )}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} required />
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{ background: loading ? 'rgba(0,212,255,0.05)' : 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.1))', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
