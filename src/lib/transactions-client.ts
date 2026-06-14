import { apiGet, apiPost, apiPatch, apiDelete } from './api-client';

export interface Transaction {
  id: string;
  merchantId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string | null;
  date: string;
  source: 'CSV' | 'DEMO' | 'POS' | 'BANK_STATEMENT';
  paymentMethod: 'CASH' | 'TRANSFER' | 'POS' | 'WALLET';
  direction: 'INFLOW' | 'OUTFLOW';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'INCOME' | 'EXPENSE' | '';
  direction?: 'INFLOW' | 'OUTFLOW' | '';
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface CreateTransactionPayload {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date?: string;
  source: 'CSV' | 'DEMO' | 'POS' | 'BANK_STATEMENT';
  paymentMethod: 'CASH' | 'TRANSFER' | 'POS' | 'WALLET';
  direction: 'INFLOW' | 'OUTFLOW';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export function getTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.type) params.set('type', filters.type);
  if (filters.direction) params.set('direction', filters.direction);
  if (filters.category) params.set('category', filters.category);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  const qs = params.toString();
  return apiGet<TransactionsResponse>(`/api/transactions${qs ? `?${qs}` : ''}`);
}

export function createTransaction(payload: CreateTransactionPayload): Promise<{ transaction: Transaction }> {
  return apiPost<{ transaction: Transaction }>('/api/transactions', payload);
}

export function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<{ transaction: Transaction }> {
  return apiPatch<{ transaction: Transaction }>(`/api/transactions/${id}`, payload);
}

export function deleteTransaction(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/api/transactions/${id}`);
}
