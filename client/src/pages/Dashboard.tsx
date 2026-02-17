import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';

export default function Dashboard() {
  const auth = useAuth();

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Dashboard</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Signed in as <strong>{auth.claims?.email || 'unknown'}</strong>
            </p>

            <div className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
              <Button variant="ghost" onClick={() => window.alert('Next: Orders UI')}>
                View orders (next)
              </Button>
              <Button variant="ghost" onClick={() => window.alert('Next: Profile UI')}>
                Edit profile (next)
              </Button>
              <Button variant="danger" onClick={auth.logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Next steps
            </div>
            <ol className="muted" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              <li>Order creation flow with service categories</li>
              <li>Provider matching + order status timeline</li>
              <li>Profile, address, and payment preferences</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}

