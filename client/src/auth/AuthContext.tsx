import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../apiClient';
import { getAuthMode } from './authMode';
import { decodeJwt, JwtPayload } from '../lib/jwt';

type AuthState = {
  token: string | null;
  claims: JwtPayload | null; // token-mode only (cookie-mode claims come from /me)
  me: any | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  setToken: (token: string | null) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return sessionStorage.getItem('token');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => readToken());
  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    try {
      if (newToken) sessionStorage.setItem('token', newToken);
      else sessionStorage.removeItem('token');
    } catch {
      // ignore
    }
  };

  const refreshMe = async () => {
    try {
      const res = await apiClient.get('/me');
      setMe(res.data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const mode = getAuthMode();
    const shouldTry = mode === 'cookie' || !!token;
    if (!shouldTry) {
      setLoading(false);
      setMe(null);
      return;
    }
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      setToken(null);
      setMe(null);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    token,
    claims,
    setToken,
    me,
    loading,
    refreshMe,
    logout: () => {
      try {
        apiClient.post('/auth/logout').catch(() => {});
      } catch {
        // ignore
      }
      setToken(null);
      setMe(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
