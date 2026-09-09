import type {
  AuthUser,
  Conversation,
  Dealer,
  DealerActivity,
  LlmUsageSummary,
  Order,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Thrown to signal the caller should redirect to /login — handled by AuthContext. */
export class SessionExpiredError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message || `Request failed (${response.status})`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getOrders: () => request<Order[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    request<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getEscalations: () => request<Conversation[]>('/admin/escalations'),
  replyToEscalation: (id: string, reply: string) =>
    request<Conversation>(`/admin/escalations/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    }),
  getDealers: () => request<Dealer[]>('/dealers'),
  getDealerActivity: (dealerId: string) =>
    request<DealerActivity>(`/admin/dealers/${dealerId}/activity`),
  getLlmUsage: () => request<LlmUsageSummary>('/admin/llm-usage'),
};
