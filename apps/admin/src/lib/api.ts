const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const json = await res.json();
  const { accessToken, refreshToken: newRefreshToken } = json.data;

  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', newRefreshToken);

  return accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    if (!getRefreshToken()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    try {
      const newToken = await new Promise<string>((resolve, reject) => {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshAccessToken()
            .then((token) => {
              isRefreshing = false;
              processQueue(null, token);
              resolve(token);
            })
            .catch((err) => {
              isRefreshing = false;
              processQueue(err, null);
              reject(err);
            });
        } else {
          failedQueue.push({ resolve, reject });
        }
      });

      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;

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
    subscriptions: {
      all: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<{ data: any[] }>(`/players/subscriptions/all${qs}`);
      },
      list: (playerId: string) => get<{ data: any[] }>(`/players/${playerId}/subscriptions`),
      create: (playerId: string, data: unknown) => post<{ data: any }>(`/players/${playerId}/subscriptions`, data),
      bulk: (data: unknown) => post<{ data: any }>('/players/subscriptions/bulk', data),
      sendLink: (subId: string, data?: unknown) => patch<{ data: any }>(`/players/subscriptions/${subId}/send-link`, data ?? {}),
      markPaid: (subId: string) => patch<{ data: any }>(`/players/subscriptions/${subId}/pay`, {}),
      remove: (subId: string) => del<void>(`/players/subscriptions/${subId}`),
    },
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
  members: {
    list: () => get<{ data: any[] }>('/members'),
    create: (data: unknown) => post<{ data: any }>('/members', data),
    get: (id: string) => get<{ data: any }>(`/members/${id}`),
    update: (id: string, data: unknown) => put<{ data: any }>(`/members/${id}`, data),
    remove: (id: string) => del<void>(`/members/${id}`),
    linkPlayer: (id: string, playerId: string) => post<{ data: any }>(`/members/${id}/players`, { playerId }),
    unlinkPlayer: (id: string, playerId: string) => del<void>(`/members/${id}/players/${playerId}`),
    subscriptions: {
      all: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<{ data: any[] }>(`/members/subscriptions/all${qs}`);
      },
      list: (id: string) => get<{ data: any[] }>(`/members/${id}/subscriptions`),
      create: (id: string, data: unknown) => post<{ data: any }>(`/members/${id}/subscriptions`, data),
      bulk: (data: unknown) => post<{ data: any }>('/members/subscriptions/bulk', data),
      sendLink: (subId: string, data?: unknown) => patch<{ data: any }>(`/members/subscriptions/${subId}/send-link`, data ?? {}),
      markPaid: (subId: string) => patch<{ data: any }>(`/members/subscriptions/${subId}/pay`, {}),
      remove: (subId: string) => del<void>(`/members/subscriptions/${subId}`),
    },
  },
  notifications: {
    list: () => get<{ data: any[] }>('/notifications/all'),
    create: (data: unknown) => post<{ data: any }>('/notifications', data),
    remove: (id: string) => del<void>(`/notifications/${id}`),
  },
  whatsapp: {
    status: () => get<{ data: { connected: boolean } }>('/whatsapp/status'),
    send: (phone: string, message: string) => post<{ data: any }>('/whatsapp/send', { phone, message }),
    sendSubscription: (subId: string, type: string = 'player') =>
      post<{ data: any }>(`/whatsapp/send-subscription/${subId}`, { type }),
    bulkSendPlayer: (subscriptionIds: string[]) =>
      post<{ data: any }>('/whatsapp/bulk-send-player', { subscriptionIds }),
    bulkSendMember: (subscriptionIds: string[]) =>
      post<{ data: any }>('/whatsapp/bulk-send-member', { subscriptionIds }),
  },
  sponsors: {
    list: () => get<{ data: any[] }>('/sponsors'),
    get: (id: string) => get<{ data: any }>(`/sponsors/${id}`),
    create: (data: unknown) => post<{ data: any }>('/sponsors', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/sponsors/${id}`, data),
    toggle: (id: string) => patch<{ data: any }>(`/sponsors/${id}/toggle`, {}),
    remove: (id: string) => del<void>(`/sponsors/${id}`),
    plans: {
      list: (sponsorId: string) => get<{ data: any[] }>(`/sponsors/${sponsorId}/plans`),
      create: (sponsorId: string, data: unknown) => post<{ data: any }>(`/sponsors/${sponsorId}/plans`, data),
      update: (planId: string, data: unknown) => put<{ data: any }>(`/sponsors/plans/${planId}`, data),
      remove: (planId: string) => del<void>(`/sponsors/plans/${planId}`),
    },
  },
  sponsorships: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[] }>(`/sponsorships${qs}`);
    },
    create: (data: unknown) => post<{ data: any }>('/sponsorships', data),
    cancel: (id: string) => patch<{ data: any }>(`/sponsorships/${id}/cancel`, {}),
    payments: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<{ data: any[] }>(`/sponsorships/payments${qs}`);
      },
      generate: (sponsorshipId: string, data: unknown) =>
        post<{ data: any }>(`/sponsorships/${sponsorshipId}/payments`, data),
      bulk: (data: unknown) => post<{ data: any }>('/sponsorships/payments/bulk', data),
      markPaid: (paymentId: string) => patch<{ data: any }>(`/sponsorships/payments/${paymentId}/pay`, {}),
      remove: (paymentId: string) => del<void>(`/sponsorships/payments/${paymentId}`),
    },
  },
  benefits: {
    listAll: () => get<{ data: any[] }>('/benefits/admin'),
    get: (id: string) => get<{ data: any }>(`/benefits/admin/${id}`),
    create: (data: unknown) => post<{ data: any }>('/benefits/admin', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/benefits/admin/${id}`, data),
    remove: (id: string) => del<void>(`/benefits/admin/${id}`),
    toggle: (id: string) => patch<{ data: any }>(`/benefits/admin/${id}/toggle`, {}),
  },
  club: {
    get: () => get<{ data: any }>('/club'),
    update: (data: unknown) => put<{ data: any }>('/club', data),
    categories: {
      list: () => get<{ data: any[] }>('/club/categories'),
      create: (data: unknown) => post<{ data: any }>('/club/categories', data),
      update: (id: string, data: unknown) => put<{ data: any }>(`/club/categories/${id}`, data),
      remove: (id: string) => del<void>(`/club/categories/${id}`),
    },
    news: {
      list: () => get<{ data: any[] }>('/club/news'),
      create: (data: unknown) => post<{ data: any }>('/club/news', data),
      update: (id: string, data: unknown) => put<{ data: any }>(`/club/news/${id}`, data),
      remove: (id: string) => del<void>(`/club/news/${id}`),
    },
    staff: {
      list: () => get<{ data: any[] }>('/club/staff'),
      create: (data: unknown) => post<{ data: any }>('/club/staff', data),
      update: (id: string, data: unknown) => put<{ data: any }>(`/club/staff/${id}`, data),
      remove: (id: string) => del<void>(`/club/staff/${id}`),
    },
    gallery: {
      list: () => get<{ data: any[] }>('/club/gallery'),
      add: (data: unknown) => post<{ data: any }>('/club/gallery', data),
      remove: (id: string) => del<void>(`/club/gallery/${id}`),
    },
    fields: {
      list: () => get<{ data: any[] }>('/club/fields'),
      create: (data: unknown) => post<{ data: any }>('/club/fields', data),
      update: (id: string, data: unknown) => put<{ data: any }>(`/club/fields/${id}`, data),
      remove: (id: string) => del<void>(`/club/fields/${id}`),
    },
    credentials: {
      generate: (playerId: string) => post<{ data: any }>(`/club/credentials/${playerId}`, {}),
      get: (playerId: string) => get<{ data: any }>(`/club/credentials/${playerId}`),
    },
    finance: {
      all: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return get<{ data: any[] }>(`/club/finance/all${qs}`);
      },
    },
    payments: {
      list: (teamId?: string) => {
        const qs = teamId ? `?teamId=${teamId}` : '';
        return get<{ data: any[] }>(`/club/payments${qs}`);
      },
      create: (data: unknown) => post<{ data: any }>('/club/payments', data),
      markPaid: (id: string) => patch<{ data: any }>(`/club/payments/${id}/pay`, {}),
      remove: (id: string) => del<void>(`/club/payments/${id}`),
    },
  },
};
