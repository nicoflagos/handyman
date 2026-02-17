import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function Input({ label, hint, error, ...rest }: InputProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{label}</span>
      <input
        {...rest}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 12,
          border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.14)'}`,
          background: 'rgba(0,0,0,0.18)',
          color: 'rgba(255,255,255,0.92)',
          outline: 'none',
        }}
      />
      {error ? (
        <span style={{ fontSize: 13, color: 'rgba(239,68,68,0.95)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{hint}</span>
      ) : null}
    </label>
  );
}

