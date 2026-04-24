const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const adminApi = {
  // Global
  stats:             () => req<any>('/api/admin/stats'),
  metricDefs:        () => req<any>('/api/admin/metrics/definitions'),
  allDrones:         () => req<any>('/api/admin/drones'),

  // Orgs
  listOrgs:          () => req<any>('/api/admin/orgs'),
  createOrg:         (data: any) => req<any>('/api/admin/orgs', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrg:         (id: string) => req<any>(`/api/admin/orgs/${id}`, { method: 'DELETE' }),
  getOrg:            (id: string) => req<any>(`/api/admin/orgs/${id}`),

  // Users
  addUser:           (orgId: string, data: any) => req<any>(`/api/admin/orgs/${orgId}/users`, { method: 'POST', body: JSON.stringify(data) }),
  resetPassword:     (orgId: string, userId: string, password: string) =>
    req<any>(`/api/admin/orgs/${orgId}/users/${userId}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),

  // Metrics config
  getOrgMetrics:     (orgId: string) => req<any>(`/api/admin/orgs/${orgId}/metrics`),
  setOrgMetrics:     (orgId: string, metrics: any[]) => req<any>(`/api/admin/orgs/${orgId}/metrics`, { method: 'PUT', body: JSON.stringify({ metrics }) }),

  // KPI rules
  getKpis:           (orgId: string) => req<any>(`/api/admin/orgs/${orgId}/kpis`),
  createKpi:         (orgId: string, data: any) => req<any>(`/api/admin/orgs/${orgId}/kpis`, { method: 'POST', body: JSON.stringify(data) }),
  updateKpi:         (orgId: string, ruleId: string, data: any) => req<any>(`/api/admin/orgs/${orgId}/kpis/${ruleId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteKpi:         (orgId: string, ruleId: string) => req<any>(`/api/admin/orgs/${orgId}/kpis/${ruleId}`, { method: 'DELETE' }),

  // Drones
  assignDrone:       (data: any) => req<any>('/api/admin/drones', { method: 'POST', body: JSON.stringify(data) }),
  moveDrone:         (droneId: string, orgId: string) => req<any>(`/api/admin/drones/${droneId}/move`, { method: 'PATCH', body: JSON.stringify({ org_id: orgId }) }),
  getDroneLive:      (droneId: string) => req<any>(`/api/admin/drones/${droneId}/live`),
};
