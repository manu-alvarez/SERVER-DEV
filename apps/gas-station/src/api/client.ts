const BASE = '/_gas-station/api';

let _token: string | null = localStorage.getItem('gas-station_token');

export function setToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem('gas-station_token', t);
  else localStorage.removeItem('gas-station_token');
}

export function getToken() { return _token; }

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}


export const api = {
  login: (name: string, pin: string) => req<{ token: string; user: any }>('POST', '/auth/login', { name, pin }),
  register: (data: any) => req('POST', '/auth/register', data),
  me: () => req<any>('GET', '/auth/me'),
  changePin: (pin: string, newPin: string) => req('PUT', '/auth/pin', { pin, newPin }),
  users: () => req<any[]>('GET', '/auth/users'),

  getTemplates: () => req<any[]>('GET', '/checklists/templates'),
  createTemplate: (t: any) => req('POST', '/checklists/templates', t),
  updateTemplate: (id: number, t: any) => req('PUT', `/checklists/templates/${id}`, t),
  deleteTemplate: (id: number) => req('DELETE', `/checklists/templates/${id}`),
  reorderTemplates: (ids: number[]) => req('PUT', '/checklists/templates-reorder', { ids }),
  moveTemplate: (id: number, direction: 'up' | 'down') => req('PUT', `/checklists/templates/${id}/move`, { direction }),

  getEntries: (date: string, phase: string) => req<any[]>('GET', `/checklists/entries?date=${date}&phase=${phase}`),
  updateEntry: (id: number, data: any) => req('PUT', `/checklists/entries/${id}`, data),
  getSummary: (params: string) => req<any>('GET', `/checklists/summary?${params}`),

  getProducts: () => req<any[]>('GET', '/products'),
  createProduct: (p: any) => req('POST', '/products', p),
  updateProduct: (id: number, p: any) => req('PUT', `/products/${id}`, p),
  deleteProduct: (id: number) => req('DELETE', `/products/${id}`),
  getBatches: () => req<any[]>('GET', '/products/batches'),
  createBatch: (b: any) => req('POST', '/products/batches', b),
  updateBatch: (id: number, b: any) => req('PUT', `/products/batches/${id}`, b),
  deleteBatch: (id: number) => req('DELETE', `/products/batches/${id}`),
  getAlerts: () => req<any[]>('GET', '/products/alerts'),
  getHistory: () => req<any[]>('GET', '/products/history'),

  getIncidents: (params?: string) => req<any[]>('GET', `/incidents${params ? '?' + params : ''}`),
  getIncident: (id: number) => req<any>('GET', `/incidents/${id}`),
  createIncident: (i: any) => req('POST', '/incidents', i),
  updateIncident: (id: number, i: any) => req('PUT', `/incidents/${id}`, i),
  deleteIncident: (id: number) => req('DELETE', `/incidents/${id}`),
  getIncidentStats: () => req<any>('GET', '/incidents/stats/summary'),

  getTimesheet: (month: number, year: number) => req<any[]>('GET', `/timesheet?month=${month}&year=${year}`),
  createTimesheet: (e: any) => req('POST', '/timesheet', e),
  updateTimesheet: (id: number, e: any) => req('PUT', `/timesheet/${id}`, e),
  deleteTimesheet: (id: number) => req('DELETE', `/timesheet/${id}`),
  getTimesheetSummary: (month: number, year: number) => req<any>('GET', `/timesheet/summary?month=${month}&year=${year}`),
  getTimesheetConfig: () => req<any>('GET', '/timesheet/config'),
  updateTimesheetConfig: (c: any) => req('PUT', '/timesheet/config', c),

  getSettings: () => req<any>('GET', '/settings'),
  updateSettings: (s: any) => req('PUT', '/settings', s),
  exportData: () => req<any>('GET', '/settings/export'),
  importData: (d: any) => req('POST', '/settings/import', d),
};
