import React from 'react';
import { Button } from '../../ui/Button';

export function WalletCard({
  balance,
  onTopUp,
  action,
}: {
  balance: number;
  onTopUp: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="card walletCard">
      <div className="cardInner">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
            Wallet Balance
          </span>
          <span className="pill" style={{ background: 'rgba(0,0,0,0.18)', color: 'rgba(7,17,14,0.84)' }}>
            NGN
          </span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 10, marginBottom: 12 }}>
          {'\u20A6'}
          {Number(balance || 0).toLocaleString('en-NG')}
        </div>
        <div className="col" style={{ gap: 10 }}>
          <Button
            variant="ghost"
            onClick={onTopUp}
            style={{
              border: '1px solid rgba(0,0,0,0.18)',
              background: 'rgba(0,0,0,0.18)',
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            Top up wallet
          </Button>
          {action}
        </div>
      </div>
    </div>
  );
}

