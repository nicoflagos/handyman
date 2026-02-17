import { apiClient } from '../apiClient';

export async function login({ email, password }: { email: string; password: string }) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data.token;
}

export async function register({
  email,
  password,
  role,
}: {
  email: string;
  password: string;
  role?: 'customer' | 'provider';
}) {
  const res = await apiClient.post('/auth/register', { email, password, role });
  return res.data;
}
