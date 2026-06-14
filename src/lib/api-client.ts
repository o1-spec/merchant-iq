export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? 'Something went wrong. Please try again.');
  }

  return json.data as T;
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>('GET', url);
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>('POST', url, body);
}

export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', url, body);
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>('DELETE', url);
}
