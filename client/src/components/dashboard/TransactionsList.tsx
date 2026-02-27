import React from 'react';
import { Transaction } from '../../services/me';

export function TransactionsList({
  state,
  items,
}: {
  state: 'loading' | 'ready' | 'error';
  items: Transaction[];
}) {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="pill" style={{ marginBottom: 10 }}>
          Transactions
        </div>
        {state === 'loading' ? <span className="muted">Loading...</span> : null}
        <div className="col" style={{ gap: 8, marginTop: 10 }}>
          {items.map(t => (
            <div
              key={t._id}
              className="row"
              style={{
                justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: '12px 12px',
                gap: 10,
              }}
            >
              <div>
                <strong>{t.type}</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>
                  {t.direction === 'in' ? '+' : '-'}
                  {'\u20A6'}
                  {Number(t.amount).toLocaleString('en-NG')}
                </strong>
              </div>
            </div>
          ))}
          {state === 'ready' && items.length === 0 ? <span className="muted">No transactions yet.</span> : null}
        </div>
      </div>
    </div>
  );
}

