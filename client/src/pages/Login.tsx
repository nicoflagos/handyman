import React, { useState } from 'react';
import { login } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const token = await login({ email, password });
      localStorage.setItem('token', token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
