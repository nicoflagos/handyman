import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { register } from '../services/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/Toast';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!acceptedLegal) {
      setError('Please confirm you have read and agree to the Terms and Privacy Policy.');
      return;
    }
    try {
      setLoading(true);
      await register({ firstName, lastName, phone, gender, email, password, role });
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
                <div className="grid2">
                  <Input label="First name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Ada" />
                  <Input label="Last name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Okafor" />
                </div>
                <Input
                  label="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. +2348012345678"
                  hint="Use international format (E.164) for easier verification."
                />
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Gender</span>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.18)',
                      color: 'rgba(255,255,255,0.92)',
                      outline: 'none',
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <Input
                  label="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Account type</span>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'customer' | 'provider')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.18)',
                      color: 'rgba(255,255,255,0.92)',
                      outline: 'none',
                    }}
                  >
                    <option value="customer">Customer</option>
                    <option value="provider">Handyman</option>
                  </select>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Handymen can accept jobs from the marketplace.</span>
                </label>
                <div className="col" style={{ gap: 8 }}>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    hint="At least 8 characters is recommended."
                  />
                  <label className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                    <span className="muted" style={{ fontSize: 13 }}>
                      Show password
                    </span>
                  </label>
                </div>
                <label className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={acceptedLegal}
                    onChange={e => setAcceptedLegal(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                    I have read and agree to the{' '}
                    <Link to="/terms" target="_blank" rel="noreferrer">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}
                {success ? <InlineNotice kind="success">{success}</InlineNotice> : null}
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <Button type="submit" loading={loading} disabled={!acceptedLegal}>
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
              Your password is never stored in plain text. It's securely hashed.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
