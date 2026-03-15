export type AuthMode = 'cookie' | 'token';

export function getAuthMode(): AuthMode {
  const raw = String(import.meta.env.VITE_AUTH_MODE || '').trim().toLowerCase();
  if (raw === 'cookie') return 'cookie';
  if (raw === 'token') return 'token';
  return 'token';
}

