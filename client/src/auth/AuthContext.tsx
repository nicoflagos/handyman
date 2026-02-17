import React, { createContext, useContext, useMemo, useState } from 'react';
import { decodeJwt, JwtPayload } from '../lib/jwt';

type AuthState = {
  token: string | null;
  claims: JwtPayload | null;
};

type AuthContextValue = AuthState & {
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readToken());

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    try {
      if (newToken) localStorage.setItem('token', newToken);
      else localStorage.removeItem('token');
    } catch {
      // ignore
    }
  };

  const value: AuthContextValue = {
    token,
    claims,
    setToken,
    logout: () => setToken(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

