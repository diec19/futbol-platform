import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3001/api/v1'
  : ((Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://10.0.2.2:3001/api/v1');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error' }));
    throw new Error(err.error ?? 'Request failed');
  }

  return res.json();
}

const get = <T>(url: string) => request<T>(url);

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
};
