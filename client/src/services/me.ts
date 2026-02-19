import { apiClient } from '../apiClient';

export type ProviderProfile = {
  // Deprecated (v1). Kept for backward compatibility with older clients.
  zip?: string;
  country?: string;
  state?: string;
  lga?: string;
  skills: string[];
  available: boolean;
  availabilityNote?: string;
};

export type Me = {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string;
  walletBalance?: number;
  ratingAsCustomerAvg?: number;
  ratingAsCustomerCount?: number;
  ratingAsHandymanAvg?: number;
  ratingAsHandymanCount?: number;
  role: 'customer' | 'provider' | 'admin';
  providerProfile?: ProviderProfile;
};

export async function getMe(): Promise<Me> {
  const res = await apiClient.get('/me');
  return res.data as Me;
}

export async function updateProviderProfile(input: ProviderProfile): Promise<Me> {
  const res = await apiClient.put('/providers/me', input);
  return res.data as Me;
}

export async function uploadAvatar(file: File): Promise<Me> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post('/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data as Me;
}

export type Transaction = {
  _id: string;
  direction: 'in' | 'out';
  type: string;
  amount: number;
  currency: 'NGN';
  ref?: string;
  createdAt: string;
};

export async function listMyTransactions(): Promise<Transaction[]> {
  const res = await apiClient.get('/me/transactions');
  return res.data as Transaction[];
}

export async function topUpWallet(amount: number): Promise<Me> {
  const res = await apiClient.post('/wallet/topup', { amount });
  return res.data as Me;
}
