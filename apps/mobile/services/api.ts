import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://futbol-platform-production.up.railway.app/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = await AsyncStorage.getItem('member_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    const error = new Error(err.error ?? 'Request failed') as Error & { status?: number }
    error.status = res.status
    throw error
  }

  return res.json();
}

const get = <T>(url: string) => request<T>(url);
const getAuth = <T>(url: string) => request<T>(url, {}, true);
const post = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) });
const postAuth = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }, true);

export const api = {
  tournaments: {
    list: () => get<{ data: any[] }>('/tournaments?status=ACTIVE'),
    get: (id: string) => get<{ data: any }>(`/tournaments/${id}`),
  },
  categories: {
    list: (tournamentId: string) =>
      get<{ data: any[] }>(`/categories?tournamentId=${tournamentId}&active=true`),
    get: (id: string) => get<{ data: any }>(`/categories/${id}`),
  },
  teams: {
    list: (categoryId: string) => get<{ data: any[] }>(`/teams?categoryId=${categoryId}`),
    get: (id: string) => get<{ data: any }>(`/teams/${id}`),
  },
  players: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return get<{ data: any[]; meta: any }>(`/players?${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/players/${id}`),
  },
  matches: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return get<{ data: any[]; meta: any }>(`/matches?${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/matches/${id}`),
  },
  standings: {
    byCategory: (categoryId: string) =>
      get<{ data: any[] }>(`/standings/category/${categoryId}`),
  },
  brackets: {
    byCategory: (categoryId: string) =>
      get<{ data: any[] }>(`/brackets/category/${categoryId}`),
  },
  statistics: {
    scorers: (categoryId: string) =>
      get<{ data: any[] }>(`/statistics/category/${categoryId}/scorers`),
    cards: (categoryId: string) =>
      get<{ data: any[] }>(`/statistics/category/${categoryId}/cards`),
  },
  members: {
    login: (username: string, password: string) =>
      post<{ data: { accessToken: string; member: any } }>('/members/auth/login', { username, password }),
    register: (data: { fullName: string; dni: string; email: string; phone?: string; password: string }) =>
      post<{ data: any }>('/members/auth/register', data),
    me: () => getAuth<{ data: any }>('/members/auth/me'),
    linkPlayer: (data: { dni: string; birthDate: string }) =>
      postAuth<{ data: any }>('/members/auth/link-player', data),
    playerRequest: (data: { fullName: string; dni: string; birthDate: string; categoryId?: string }) =>
      postAuth<{ data: any }>('/members/auth/player-request', data),
    unlinkRequest: (data: { playerId: string; reason?: string }) =>
      postAuth<{ data: any }>('/members/auth/unlink-request', data),
  },
  club: {
    categories: () => get<{ data: any[] }>('/club/categories'),
  },
  notifications: {
    list: () => getAuth<{ data: any[] }>('/notifications'),
    unreadCount: () => getAuth<{ data: { count: number } }>('/notifications/count'),
    markRead: (id: string) =>
      request<{ data: any }>(`/notifications/${id}/read`, { method: 'PATCH' }, true),
    markAllRead: () =>
      request<{ data: any }>('/notifications/read-all', { method: 'PATCH' }, true),
  },
  news: {
    list: () => getAuth<{ data: any[] }>('/club/news'),
  },
  benefits: {
    list: () => get<{ data: any[] }>('/benefits'),
  },
  sponsors: {
    slides: () => get<{ data: any[] }>('/sponsors/slides'),
  },
};
