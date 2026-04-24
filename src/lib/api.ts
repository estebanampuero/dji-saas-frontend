const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  login:      (email: string, password: string) =>
    req<any>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:   (org_name: string, email: string, password: string) =>
    req<any>('/api/auth/register', { method: 'POST', body: JSON.stringify({ org_name, email, password }) }),
  drones:     () => req<any>('/api/drones'),
  addDrone:   (data: any) => req<any>('/api/drones', { method: 'POST', body: JSON.stringify(data) }),
  latest:     (id: string) => req<any>(`/api/drones/${id}/telemetry/latest`),
  telemetry:  (id: string, from?: string, to?: string) =>
    req<any>(`/api/drones/${id}/telemetry?limit=200${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`),
  flights:    () => req<any>('/api/flights'),
  alerts:     () => req<any>('/api/alerts'),
  stats:            () => req<any>('/api/stats/summary'),
  resolve:          (id: string) => req<any>(`/api/alerts/${id}/resolve`, { method: 'PATCH' }),
  metricVisibility: () => req<any>('/api/metrics/visibility'),
};
