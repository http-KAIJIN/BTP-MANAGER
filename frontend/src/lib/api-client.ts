const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function safeErrorMessage(status: number): string {
  if (status === 400) return 'The submitted information is invalid. Please review the form.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 409) return 'This action conflicts with the current record status.';
  if (status === 413) return 'The uploaded file is too large.';
  return 'Something went wrong. Please try again.';
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value);
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    if (process.env.NODE_ENV !== 'production') await res.json().catch(() => null);
    throw new ApiError(safeErrorMessage(res.status), res.status);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | undefined>) =>
    request<T>(endpoint, { params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') await res.json().catch(() => null);
      throw new ApiError(safeErrorMessage(res.status), res.status);
    }
    return res.json();
  },

  auth: {
    login: (email: string, password: string) =>
      request<import('./types').AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    refresh: (refreshToken: string) =>
      request<import('./types').AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    me: () => request<import('./types').User>('/auth/me'),
  },
};
