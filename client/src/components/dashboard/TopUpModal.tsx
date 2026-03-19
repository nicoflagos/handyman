import React from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { InlineNotice } from '../../ui/Toast';
import { Modal } from '../../ui/Modal';

const PRESETS = [2000, 5000, 10000] as const;

export function TopUpModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}) {
  const [amount, setAmount] = React.useState<string>('5000');

  React.useEffect(() => {
    if (!open) return;
    setAmount('5000');
  }, [open]);

  const numericAmount = Number(amount);
  const valid = Number.isFinite(numericAmount) && numericAmount > 0;

  return (
    <Modal
      open={open}
      title="Top up your wallet"
      onClose={() => {
        if (loading) return;
        onClose();
      }}
      footer={
        <div className="row" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={!!loading}
            style={{ border: '1px solid rgba(255,255,255,0.14)' }}
          >
            Not now
          </Button>
          <Button
            type="button"
            loading={!!loading}
            disabled={!valid || !!loading}
            onClick={async () => {
              if (!valid) return;
              await onSubmit(numericAmount);
            }}
          >
            Top up ₦{valid ? numericAmount.toLocaleString('en-NG') : '0'}
          </Button>
        </div>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Quick top-up helps you book faster. You only pay when a handyman starts the job (escrow), and funds are released
        on completion.
      </p>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        {PRESETS.map(p => (
          <button
            key={p}
            type="button"
            className="chipBtn"
            onClick={() => setAmount(String(p))}
            aria-label={`Set amount to ₦${p}`}
          >
            ₦{p.toLocaleString('en-NG')}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Input
          label="Amount (NGN)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 5000"
          hint="Use any amount you want. Presets are just shortcuts."
        />
      </div>

      {error ? (
        <div style={{ marginTop: 10 }}>
          <InlineNotice kind="error">{error}</InlineNotice>
        </div>
      ) : null}
    </Modal>
  );
}

