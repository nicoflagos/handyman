import { apiClient } from '../apiClient';

export type ProviderProfile = {
  zip?: string;
  skills: string[];
  available: boolean;
  availabilityNote?: string;
};

export type Me = {
  _id: string;
  email: string;
  username: string;
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

