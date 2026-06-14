export interface Insight {
  id: string;
  merchantId: string;
  title: string;
  content: string;
  category: 'MORNING_BRIEF' | 'GROWTH_RECOMMENDATION' | 'CREDIT_COACH';
  type: 'AI' | 'MANUAL';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MorningBriefResponse {
  insight: Insight;
  brief: string;
  context?: {
    summary?: any;
    cashflow?: any;
    creditReadiness?: any;
  };
}

export interface GrowthRecommendationsResponse {
  insight: Insight;
  recommendations: string;
}

export interface CreditCoachResponse {
  insight: Insight;
  explanation: string;
}

export interface InsightsListResponse {
  insights: Insight[];
}

async function postRequest<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

async function getRequest<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

async function patchRequest<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

async function deleteRequest<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

export function generateMorningBrief(forceRegenerate = false): Promise<MorningBriefResponse> {
  return postRequest<MorningBriefResponse>('/api/ai/morning-brief', { forceRegenerate });
}

export function generateGrowthRecommendations(forceRegenerate = false): Promise<GrowthRecommendationsResponse> {
  return postRequest<GrowthRecommendationsResponse>('/api/ai/growth-recommendations', { forceRegenerate });
}

export function generateCreditCoach(forceRegenerate = false): Promise<CreditCoachResponse> {
  return postRequest<CreditCoachResponse>('/api/ai/credit-coach', { forceRegenerate });
}

export function getInsights(category?: string): Promise<InsightsListResponse> {
  const url = category ? `/api/insights?category=${category}` : '/api/insights';
  return getRequest<InsightsListResponse>(url);
}

export function togglePinInsight(id: string): Promise<{ insight: Insight }> {
  return patchRequest<{ insight: Insight }>(`/api/insights/${id}/pin`);
}

export function deleteInsight(id: string): Promise<{ message: string }> {
  return deleteRequest<{ message: string }>(`/api/insights/${id}`);
}

export interface AskCfoResponse {
  question: string;
  answer: string;
}

export function askCfo(question: string): Promise<AskCfoResponse> {
  return postRequest<AskCfoResponse>('/api/ai/ask-cfo', { question });
}

