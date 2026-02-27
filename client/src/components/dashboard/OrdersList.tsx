import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../services/orders';
import { InlineNotice } from '../../ui/Toast';

export function OrdersList({
  title,
  state,
  errorText,
  orders,
  emptyText,
}: {
  title: string;
  state: 'loading' | 'ready' | 'error';
  errorText: string;
  orders: Order[];
  emptyText: string;
}) {
  return (
    <div className="card">
      <div className="cardInner">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
        {state === 'error' ? <InlineNotice kind="error">{errorText}</InlineNotice> : null}
        {state === 'loading' ? <span className="muted">Loading...</span> : null}

        <div className="col" style={{ gap: 10, marginTop: 10 }}>
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
          {state === 'ready' && orders.length === 0 ? <span className="muted">{emptyText}</span> : null}
        </div>
      </div>
    </div>
  );
}

