import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

export async function login({ email, password }: { email: string; password: string }) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data.token;
}

export async function register({ email, password }: { email: string; password: string }) {
  const res = await axios.post(`${API_BASE}/auth/register`, { email, password });
  return res.data;
}
