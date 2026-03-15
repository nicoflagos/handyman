import axios from 'axios';
import { getAuthMode } from './auth/authMode';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use(cfg => {
  try {
    // Token mode fallback (cookie mode uses HttpOnly cookies).
    if (getAuthMode() === 'token') {
      const token = sessionStorage.getItem('token');
      if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    }
  } catch {
    // ignore
  }
  return cfg;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        sessionStorage.removeItem('token');
      } catch {
        // ignore
      }
      try {
        window.dispatchEvent(new Event('auth:expired'));
      } catch {
        // ignore
      }
    }
    return Promise.reject(err);
  },
 );
