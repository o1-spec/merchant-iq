import { apiGet, apiPost } from './api-client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
}

export interface MerchantProfile {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  merchant: MerchantProfile | null;
}

export interface AuthResult {
  user: AuthUser;
}

export function login(payload: LoginPayload): Promise<AuthResult> {
  return apiPost<AuthResult>('/api/auth/login', payload);
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return apiPost<AuthResult>('/api/auth/register', payload);
}

export function demoLogin(): Promise<AuthResult> {
  return apiPost<AuthResult>('/api/auth/demo-login');
}

export function getMe(): Promise<AuthResult> {
  return apiGet<AuthResult>('/api/auth/me');
}
