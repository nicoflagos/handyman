import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { login } from '../services/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const token = await login({ email, password });
      auth.setToken(token);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Welcome back</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Log in to manage your profile and service orders.
            </p>

            <form onSubmit={handleSubmit} className="col" style={{ marginTop: 12 }}>
              <Input
                label="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
              />
              {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <Button type="submit" loading={loading}>
                  Login
                </Button>
                <span className="muted" style={{ fontSize: 13 }}>
                  New here? <Link to="/register">Create an account</Link>
                </span>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Tip
            </div>
            <h3 style={{ marginTop: 0 }}>Sign in is case‑insensitive</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              If you registered with mixed‑case email, logging in works either way.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

