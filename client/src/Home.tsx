import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Button } from './ui/Button';

export default function Home() {
  const auth = useAuth();

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
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
              <Button>Register</Button>
            </Link>
          </>
        )}
      </div>

      <div className="card">
        <div className="cardInner">
          <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 44, lineHeight: 1.05 }}>
            Book help fast!
            <br />
            Connect with local skilled workers, technicians and artisans in your area.
          </h1>
          <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: 18, maxWidth: 760 }}>
            Track everything.
          </p>
        </div>
      </div>
    </div>
  );
}
