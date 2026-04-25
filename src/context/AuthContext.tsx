'use client';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthCtx {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

// Refresh 2 minutes before expiry
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<any>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleRefresh(expiresInSeconds: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = Math.max(0, expiresInSeconds * 1000 - REFRESH_BUFFER_MS);
    timerRef.current = setTimeout(doRefresh, delay);
  }

  async function doRefresh() {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return;
    try {
      const res = await api.refresh(rt);
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
        localStorage.setItem('token_expiry', String(Date.now() + res.expires_in * 1000));
        setToken(res.access_token);
        scheduleRefresh(res.expires_in);
      }
    } catch {
      // Refresh failed — force re-login
      doLogout();
    }
  }

  function doLogout() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const rt = localStorage.getItem('refresh_token');
    if (rt) api.logout(rt).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    const t       = localStorage.getItem('token');
    const u       = localStorage.getItem('user');
    const expiry  = localStorage.getItem('token_expiry');

    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      const remaining = expiry ? (Number(expiry) - Date.now()) / 1000 : 0;
      if (remaining > 30) {
        scheduleRefresh(remaining);
      } else {
        // Token expired or about to — refresh immediately
        doRefresh();
      }
    }
    setLoading(false);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    localStorage.setItem('token',         res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    localStorage.setItem('token_expiry',  String(Date.now() + res.expires_in * 1000));
    localStorage.setItem('user',          JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    scheduleRefresh(res.expires_in);
  }

  return (
    <Ctx.Provider value={{ user, token, login, logout: doLogout, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
