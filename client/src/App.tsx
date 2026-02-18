import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import Services from './pages/Services';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import Admin from './pages/Admin';
import ProviderSettings from './pages/ProviderSettings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: 'admin' | 'provider' | 'customer'; children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.token) return <Navigate to="/login" replace />;
  if (auth.claims?.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireAnyRole({
  roles,
  children,
}: {
  roles: Array<'admin' | 'provider' | 'customer'>;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  if (!auth.token) return <Navigate to="/login" replace />;
  if (!auth.claims?.role || !roles.includes(auth.claims.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/services"
            element={
              <RequireAnyRole roles={['customer']}>
                <Services />
              </RequireAnyRole>
            }
          />
          <Route
            path="/orders/new"
            element={
              <RequireAnyRole roles={['customer']}>
                <CreateOrder />
              </RequireAnyRole>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <Admin />
              </RequireRole>
            }
          />
          <Route
            path="/provider/settings"
            element={
              <RequireRole role="provider">
                <ProviderSettings />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
