import { apiClient } from '../apiClient';

export type AdminUser = {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  role?: 'customer' | 'provider' | 'admin';
  avatarUrl?: string;
  walletBalance?: number;
  createdAt?: string;
  updatedAt?: string;
  providerProfile?: {
    verified?: boolean;
    verifiedAt?: string;
    country?: string;
    state?: string;
    lga?: string;
    lc?: string;
    skills?: string[];
    available?: boolean;
    availabilityNote?: string;
    address?: string;
    passportPhotoUrl?: string;
    idType?: string;
    idNumber?: string;
    idImageUrl?: string;
    workImageUrls?: string[];
  };
};

export type AdminOrder = any;

export type AdminTransaction = any;

export async function adminListUsers(input?: { q?: string; role?: string; limit?: number }): Promise<AdminUser[]> {
  const res = await apiClient.get('/admin/users', { params: input || {} });
  return res.data as AdminUser[];
}

export async function adminListOrders(input?: { status?: string; limit?: number }): Promise<AdminOrder[]> {
  const res = await apiClient.get('/admin/orders', { params: input || {} });
  return res.data as AdminOrder[];
}

export async function adminListTransactions(input?: { userId?: string; limit?: number }): Promise<AdminTransaction[]> {
  const res = await apiClient.get('/admin/transactions', { params: input || {} });
  return res.data as AdminTransaction[];
}

export async function adminGetProviderIdImageUrl(userId: string): Promise<string> {
  const res = await apiClient.get(`/admin/users/${userId}/id-image`);
  return String((res.data as any)?.url || '');
}

export async function adminGetProviderPassportPhotoUrl(userId: string): Promise<string> {
  const res = await apiClient.get(`/admin/users/${userId}/passport-photo`);
  return String((res.data as any)?.url || '');
}
