import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid transparent',
        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
        textDecoration: 'none',
        color: 'rgba(255,255,255,0.9)',
      })}
    >
      {label}
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(11, 18, 32, 0.65)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="container" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 10 }}>
              <Link to="/" style={{ fontWeight: 800, letterSpacing: 0.2, textDecoration: 'none' }}>
                Handyman
              </Link>
              <span className="pill">On‑Demand Service</span>
            </div>

            <nav className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <TopLink to="/" label="Home" />
              {auth.token ? <TopLink to="/dashboard" label="Dashboard" /> : null}
              {auth.token ? null : <TopLink to="/login" label="Login" />}
              {auth.token ? null : <TopLink to="/register" label="Register" />}
              {auth.token ? (
                <Button variant="ghost" onClick={auth.logout}>
                  Logout
                </Button>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      <main className="container">{children}</main>
    </>
  );
}

