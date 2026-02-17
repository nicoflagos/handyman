import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function getHealth() {
  const url = API_ORIGIN ? `${API_ORIGIN}/health` : '/health';
  const res = await axios.get(url);
  return res.data;
}

