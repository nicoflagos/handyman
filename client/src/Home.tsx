import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from './api';
import { useAuth } from './auth/AuthContext';
import { Button } from './ui/Button';

export default function Home() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const auth = useAuth();

  useEffect(() => {
    getHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  const statusLabel = status === 'loading' ? 'Checking API…' : status === 'ok' ? 'API online' : 'API error';
  const statusColor =
    status === 'ok'
      ? 'rgba(34,197,94,0.95)'
      : status === 'error'
        ? 'rgba(239,68,68,0.95)'
        : 'rgba(255,255,255,0.72)';

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="pill" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: statusColor }} />
          <span>{statusLabel}</span>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {auth.token ? (
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="ghost">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="cardInner">
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 44, lineHeight: 1.05 }}>
            Book help fast.
            <br />
            Track everything.
          </h1>
          <p className="muted" style={{ marginTop: 0, fontSize: 16, maxWidth: 760 }}>
            A simple full‑stack starter for an on‑demand service marketplace: auth, orders, and a clean UX baseline.
          </p>

          <div className="row" style={{ flexWrap: 'wrap', marginTop: 14 }}>
            <span className="pill">Auth + JWT</span>
            <span className="pill">Orders API</span>
            <span className="pill">MongoDB</span>
            <span className="pill">Render deploy</span>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardInner">
            <h3 style={{ marginTop: 0 }}>What’s next</h3>
            <ul className="muted" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              <li>Service catalog + order creation wizard</li>
              <li>Order status timeline (requested → accepted → in progress → completed)</li>
              <li>Profile settings and saved addresses</li>
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="cardInner">
            <h3 style={{ marginTop: 0 }}>Quick links</h3>
            <div className="col" style={{ gap: 10 }}>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <a href="/health">API health</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

