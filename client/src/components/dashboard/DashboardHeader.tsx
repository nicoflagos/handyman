import React from 'react';

export function DashboardHeader({ title, fullName }: { title: string; fullName: string }) {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
        Welcome, <strong style={{ color: 'var(--color-text-primary)' }}>{fullName}</strong>
      </p>
    </div>
  );
}

