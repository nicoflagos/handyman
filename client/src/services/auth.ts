import { apiClient } from '../apiClient';

export async function login({ email, password }: { email: string; password: string }) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data.token;
}

export async function register({
  firstName,
  lastName,
  phone,
  gender,
  email,
  password,
  role,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  password: string;
  role?: 'customer' | 'provider';
}) {
  const res = await apiClient.post('/auth/register', { firstName, lastName, phone, gender, email, password, role });
  return res.data;
}

export async function verifyEmail(input: { email: string; code: string }) {
  const res = await apiClient.post('/auth/verify-email', input);
  return res.data as { email: string; emailVerified: boolean };
}
