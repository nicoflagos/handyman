import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../services/orders';
import { Button } from '../../ui/Button';

export function MarketplaceList({
  isProvider,
  orders,
  state,
}: {
  isProvider: boolean;
  orders: Order[];
  state: 'loading' | 'ready' | 'error';
}) {
  if (!isProvider) return null;
  return (
    <div className="card">
      <div className="cardInner">
        <div className="pill" style={{ marginBottom: 10 }}>
          Marketplace
        </div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Available jobs</h3>
            <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
              Accept a job to move it to your assigned list.
            </p>
          </div>
          <Link to="/provider/settings" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Handyman settings</Button>
          </Link>
        </div>

        <div className="col" style={{ gap: 10, marginTop: 12 }}>
          {orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '12px 12px',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{o.title}</strong>
                  <span className="pill">{o.status}</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  {o.serviceKey}
                </div>
              </div>
            </Link>
          ))}
          {state === 'ready' && orders.length === 0 ? <span className="muted">No open jobs right now.</span> : null}
        </div>
      </div>
    </div>
  );
}

