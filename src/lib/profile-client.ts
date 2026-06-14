export interface MerchantProfile {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
  createdAt: string;
}

export interface ProfileUpdatePayload {
  businessName?: string;
  businessType?: string;
  businessCategory?: string;
  location?: string;
}

export interface ProfileUpdateResponse {
  merchant: MerchantProfile & { updatedAt: string };
}

export async function getMerchantProfile(): Promise<MerchantProfile> {
  const res = await fetch('/api/merchant/profile', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to load merchant profile');
  }

  return json.data as MerchantProfile;
}

export async function updateMerchantProfile(payload: ProfileUpdatePayload): Promise<ProfileUpdateResponse> {
  const res = await fetch('/api/merchant/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to update merchant profile');
  }

  return json.data as ProfileUpdateResponse;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to log out');
  }
}
