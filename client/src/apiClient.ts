import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('token');
    if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  } catch {
    // ignore
  }
  return cfg;
});

