import React from 'react';
import { Layout } from '../components/Layout';
import { listMyOrders, Order } from '../services/orders';
import { InlineNotice } from '../ui/Toast';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');

  React.useEffect(() => {
    setState('loading');
    listMyOrders()
      .then(setOrders)
      .then(() => setState('ready'))
      .catch(() => setState('error'));
  }, []);

  return (
    <Layout>
      <div className="col" style={{ gap: 16 }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>Admin</h2>
          <p className="muted" style={{ margin: 0 }}>
            All orders (latest 100). Click any order to view timeline and update status.
          </p>
        </div>

        {state === 'error' ? <InlineNotice kind="error">Unable to load orders.</InlineNotice> : null}
        {state === 'loading' ? <span className="muted">Loading…</span> : null}

        <div className="col" style={{ gap: 10 }}>
          {orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.12)',
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{o.title}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {o.status}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {o.serviceKey} • {o._id}
                </div>
              </div>
            </Link>
          ))}
          {state === 'ready' && orders.length === 0 ? <span className="muted">No orders.</span> : null}
        </div>
      </div>
    </Layout>
  );
}

