import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { register } from '../services/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/Toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await register({ email, password });
      setSuccess('Registered successfully — redirecting to login…');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Create your account</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Start booking services and tracking orders in one place.
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
                autoComplete="new-password"
                placeholder="Create a password"
                hint="At least 8 characters is recommended."
              />
              {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}
              {success ? <InlineNotice kind="success">{success}</InlineNotice> : null}
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <Button type="submit" loading={loading}>
                  Register
                </Button>
                <span className="muted" style={{ fontSize: 13 }}>
                  Already have an account? <Link to="/login">Login</Link>
                </span>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Security
            </div>
            <h3 style={{ marginTop: 0 }}>Passwords are hashed</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Your password is never stored in plain text. You’ll see a hashed value in MongoDB (normal).
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

