import React from 'react';

export function InlineNotice({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const color =
    kind === 'error'
      ? 'rgba(239,68,68,0.95)'
      : kind === 'success'
        ? 'rgba(34,197,94,0.95)'
        : 'rgba(255,255,255,0.78)';

  const border =
    kind === 'error'
      ? 'rgba(239,68,68,0.45)'
      : kind === 'success'
        ? 'rgba(34,197,94,0.35)'
        : 'rgba(255,255,255,0.14)';

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        background: 'rgba(0,0,0,0.16)',
        borderRadius: 12,
        padding: '10px 12px',
        color,
      }}
    >
      {children}
    </div>
  );
}

