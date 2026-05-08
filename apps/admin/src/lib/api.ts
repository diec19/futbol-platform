const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error ?? 'Request failed');
  }

  return res.json();
}

const get = <T>(url: string) => request<T>(url, { method: 'GET' });
const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(body) });
const patch = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(url: string) => request<T>(url, { method: 'DELETE' });

export const api = {
  auth: {
    login: (login: string, password: string) =>
      post<{ data: { accessToken: string; refreshToken: string; user: any } }>('/auth/login', { login, password }),
    me: () => get<{ data: any }>('/auth/me'),
  },
  tournaments: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[]; meta: any }>(`/tournaments${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/tournaments/${id}`),
    stats: (id: string) => get<{ data: any }>(`/tournaments/${id}/stats`),
    create: (data: unknown) => post<{ data: any }>('/tournaments', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/tournaments/${id}`, data),
    updateStatus: (id: string, status: string) =>
      patch<{ data: any }>(`/tournaments/${id}/status`, { status }),
    remove: (id: string) => del<void>(`/tournaments/${id}`),
  },
  categories: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[] }>(`/categories${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/categories/${id}`),
    create: (data: unknown) => post<{ data: any }>('/categories', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/categories/${id}`, data),
    toggle: (id: string) => patch<{ data: any }>(`/categories/${id}/toggle`, {}),
    remove: (id: string) => del<void>(`/categories/${id}`),
  },
  teams: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[] }>(`/teams${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/teams/${id}`),
    create: (data: unknown) => post<{ data: any }>('/teams', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/teams/${id}`, data),
    remove: (id: string) => del<void>(`/teams/${id}`),
  },
  players: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[]; meta: any }>(`/players${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/players/${id}`),
    create: (data: unknown) => post<{ data: any }>('/players', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/players/${id}`, data),
    toggle: (id: string) => patch<{ data: any }>(`/players/${id}/toggle`, {}),
    remove: (id: string) => del<void>(`/players/${id}`),
  },
  matches: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[]; meta: any }>(`/matches${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/matches/${id}`),
    create: (data: unknown) => post<{ data: any }>('/matches', data),
    loadResult: (id: string, data: unknown) =>
      patch<{ data: any }>(`/matches/${id}/result`, data),
    postpone: (id: string, data: unknown) =>
      patch<{ data: any }>(`/matches/${id}/postpone`, data),
    generateFixture: (data: unknown) =>
      post<{ data: any[] }>('/matches/fixture/generate', data),
  },
  standings: {
    byGroup: (groupId: string) => get<{ data: any }>(`/standings/group/${groupId}`),
    byCategory: (categoryId: string) => get<{ data: any[] }>(`/standings/category/${categoryId}`),
    createGroup: (data: unknown) => post<{ data: any }>('/standings/group', data),
    addTeams: (groupId: string, teamIds: string[]) =>
      post<{ data: any }>(`/standings/group/${groupId}/teams`, { teamIds }),
  },
  brackets: {
    byCategory: (categoryId: string) => get<{ data: any[] }>(`/brackets/category/${categoryId}`),
    init: (data: unknown) => post<{ data: any }>('/brackets/init', data),
  },
  statistics: {
    global: () => get<{ data: any }>('/statistics/global'),
    summary: (tournamentId: string) =>
      get<{ data: any }>(`/statistics/tournament/${tournamentId}/summary`),
    scorers: (categoryId: string) =>
      get<{ data: any[] }>(`/statistics/category/${categoryId}/scorers`),
    cards: (categoryId: string) =>
      get<{ data: any[] }>(`/statistics/category/${categoryId}/cards`),
    fairPlay: (categoryId: string) =>
      get<{ data: any[] }>(`/statistics/category/${categoryId}/fairplay`),
  },
  referees: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[]; meta: any }>(`/referees${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/referees/${id}`),
    create: (data: unknown) => post<{ data: any }>('/referees', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/referees/${id}`, data),
    toggle: (id: string) => patch<{ data: any }>(`/referees/${id}/toggle`, {}),
    remove: (id: string) => del<void>(`/referees/${id}`),
  },
  sanctions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[] }>(`/sanctions${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/sanctions/${id}`),
    create: (data: unknown) => post<{ data: any }>('/sanctions', data),
    resolve: (id: string) => patch<{ data: any }>(`/sanctions/${id}/resolve`, {}),
    remove: (id: string) => del<void>(`/sanctions/${id}`),
  },
};
