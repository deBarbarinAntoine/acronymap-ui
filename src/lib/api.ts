const API_BASE_URL = 'http://localhost:8080';

// ─── Type Definitions ───────────────────────────────────────────────────────

export type ApiError = {
  error: string;
  status: number;
};

export type ApiValidationError = {
  message: string;
  errors: Record<string, string>;
};

export type User = {
  id: string;
  email: string;
  profile: 'standard' | 'admin';
  is_active: boolean;
  created_at: string;
};

export type AcronymResult = {
  search: string;
  master_id: string;
  data: Record<string, string>;
};

// ─── Core Fetch Wrapper ─────────────────────────────────────────────────────

export async function api<ResponseType>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ResponseType> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as ResponseType;
  }

  return response.json();
}

// ─── Auth Endpoints ─────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api<{ message: string }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    api<{ message: string; user_id: string }>('/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    api<{ message: string }>('/users/logout', {
      method: 'POST',
    }),
};

// ─── User Management Endpoints ──────────────────────────────────────────────

export const userApi = {
  getAll: () =>
    api<{ users: User[] }>('/users'),

  update: (id: string, data: { email: string; profile: 'standard' | 'admin'; is_active: boolean }) =>
    api<{ message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string, is_active: boolean) =>
    api<{ message: string }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),

  updateEmail: (email: string) =>
    api<{ message: string }>('/users/email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),
};

// ─── Acronym Endpoints ──────────────────────────────────────────────────────

export const acronymApi = {
  search: (query: string, category?: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    return api<{ count: number; results: AcronymResult[] | null }>(`/acronyms?${params.toString()}`);
  },

  getByTerm: (term: string) =>
    api<AcronymResult>(`/acronyms/${encodeURIComponent(term)}`),
};

// ─── Admin Acronym Endpoints ────────────────────────────────────────────────

export const acronymAdminApi = {
  upsert: (term: string, data: { fields: Record<string, string>; aliases: string[] }) =>
    api<{ message: string }>(`/acronyms/${encodeURIComponent(term)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFields: (term: string, fields: string[]) =>
    api<{ message: string }>(`/acronyms/${encodeURIComponent(term)}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    }),

  delete: (term: string) =>
    api<{ message: string }>(`/acronyms/${encodeURIComponent(term)}`, {
      method: 'DELETE',
    }),
};
