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

const errorMessages = {
  ar: {
    400: 'المعطيات غير صحيحة. راجع المعلومات وأعاود حاول.',
    401: 'انتهت الجلسة ديالك. دخل من جديد.',
    403: 'ما عندكش الصلاحية لهاد العملية.',
    404: 'هاد العنصر ما كاينش.',
    409: 'هاد العملية ما متوافقةش مع حالة الملف الحالية.',
    413: 'الملف كبير بزاف.',
    default: 'وقع مشكل. أعاود حاول.',
  },
  fr: {
    400: 'Les informations saisies sont invalides. Vérifiez puis réessayez.',
    401: 'Votre session a expiré. Connectez-vous à nouveau.',
    403: "Vous n'avez pas la permission d'effectuer cette action.",
    404: "L'élément demandé est introuvable.",
    409: "Cette action est incompatible avec l'état actuel.",
    413: 'Le fichier envoyé est trop volumineux.',
    default: 'Une erreur est survenue. Réessayez.',
  },
  en: {
    400: 'Please review the entered information and try again.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested record was not found.',
    409: 'This action conflicts with the current record status.',
    413: 'The uploaded file is too large.',
    default: 'Something went wrong. Please try again.',
  },
} as const;

function currentLanguage(): keyof typeof errorMessages {
  if (typeof window === 'undefined') return 'ar';
  const stored = localStorage.getItem('user');
  if (!stored) return 'ar';
  try {
    const language = JSON.parse(stored)?.preferredLanguage;
    return language === 'fr' || language === 'en' ? language : 'ar';
  } catch {
    return 'ar';
  }
}

function safeErrorMessage(status: number): string {
  const messages = errorMessages[currentLanguage()];
  return messages[status as keyof typeof messages] || messages.default;
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
