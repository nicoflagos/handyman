import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, disabled, children, ...rest }: ButtonProps) {
  const styles: React.CSSProperties =
    variant === 'primary'
      ? {
          border: '1px solid rgba(124, 92, 255, 0.4)',
          background: 'linear-gradient(135deg, rgba(124,92,255,1), rgba(45,212,191,0.95))',
          color: '#081018',
        }
      : variant === 'danger'
        ? {
            border: '1px solid rgba(239, 68, 68, 0.45)',
            background: 'rgba(239, 68, 68, 0.14)',
            color: 'rgba(255,255,255,0.92)',
          }
        : {
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.9)',
          };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        ...styles,
        borderRadius: 12,
        padding: '10px 14px',
        fontWeight: 650,
        letterSpacing: 0.2,
        opacity: disabled || loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}

