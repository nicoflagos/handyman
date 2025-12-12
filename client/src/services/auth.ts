import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function login({ email, password }: { email: string; password: string }) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data.token;
}

export async function register({ email, password }: { email: string; password: string }) {
  const res = await axios.post(`${API_URL}/auth/register`, { email, password });
  return res.data;
}
