import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getHealth() {
  const res = await axios.get(`${API_URL}/health`);
  return res.data;
}
