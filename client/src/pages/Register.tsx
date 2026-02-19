import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { register, resendVerifyEmail, verifyEmail } from '../services/auth';
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
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const res: any = await register({ firstName, lastName, phone, gender, email, password, role });
      setDevCode(res?.devEmailVerificationCode || null);
      setVerifyStep(true);
      setSuccess('Account created. Verify your email to continue.');
      return;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await verifyEmail({ email, code: emailCode });
      setSuccess('Email verified - redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed');
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

            {!verifyStep ? (
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
            ) : (
              <form onSubmit={handleVerify} className="col" style={{ marginTop: 12 }}>
                <InlineNotice kind="info">We sent a verification code to your email. Enter it below to verify your account.</InlineNotice>
                {devCode ? <InlineNotice kind="info">Dev code: {devCode}</InlineNotice> : null}
                <Input
                  label="Email verification code"
                  value={emailCode}
                  onChange={e => setEmailCode(e.target.value)}
                  inputMode="numeric"
                  placeholder="6-digit code"
                />
                {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}
                {success ? <InlineNotice kind="success">{success}</InlineNotice> : null}
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <Button type="submit" loading={loading}>
                    Verify email
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!email || loading}
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);
                      try {
                        setLoading(true);
                        const res: any = await resendVerifyEmail({ email });
                        if (res?.devEmailVerificationCode) setDevCode(res.devEmailVerificationCode);
                        setSuccess(res?.sent ? 'Verification email resent.' : 'SMTP not configured. Check server logs for the code.');
                      } catch (err: any) {
                        setError(err?.response?.data?.message || 'Unable to resend code');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resend code
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setVerifyStep(false);
                      setSuccess(null);
                      setError(null);
                    }}
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
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
