import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, disabled, children, ...rest }: ButtonProps) {
  const styles: React.CSSProperties =
    variant === 'primary'
      ? {
          border: '1px solid rgba(0, 230, 118, 0.55)',
          background: 'linear-gradient(135deg, rgba(0,230,118,1), rgba(105,240,174,0.95))',
          color: '#07110e',
        }
      : variant === 'danger'
        ? {
            border: '1px solid rgba(255, 82, 82, 0.45)',
            background: 'rgba(255, 82, 82, 0.14)',
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
      {loading ? 'Working...' : children}
    </button>
  );
}
