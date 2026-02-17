import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { acceptOrder, getOrder, Order, OrderStatus, setOrderStatus } from '../services/orders';
import { InlineNotice } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function formatDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'accepted':
      return 'Accepted';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'canceled':
      return 'Canceled';
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const auth = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isProvider = auth.claims?.role === 'provider' || auth.claims?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    setState('loading');
    getOrder(id)
      .then(o => {
        setOrder(o);
        setState('ready');
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Unable to load order');
        setState('error');
      });
  }, [id]);

  const timeline = useMemo(() => {
    const items = order?.timeline || [];
    return [...items].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [order]);

  async function run(action: () => Promise<Order>) {
    if (!id) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await action();
      setOrder(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Order</h2>
            <p className="muted" style={{ margin: 0 }}>
              Status timeline and actions.
            </p>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/services" style={{ textDecoration: 'none' }}>
              <Button variant="ghost">Catalog</Button>
            </Link>
          </div>
        </div>

        {state === 'error' ? <InlineNotice kind="error">{error || 'Error'}</InlineNotice> : null}
        {error && state !== 'error' ? <InlineNotice kind="error">{error}</InlineNotice> : null}
        {state === 'loading' ? <span className="muted">Loading…</span> : null}

        {order ? (
          <div className="grid2" style={{ alignItems: 'start' }}>
            <div className="card">
              <div className="cardInner">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 6 }}>{order.title}</h3>
                    <div className="pill">{statusLabel(order.status)}</div>
                  </div>
                  <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isProvider && order.status === 'requested' ? (
                      <Button loading={busy} onClick={() => run(() => acceptOrder(order._id))}>
                        Accept job
                      </Button>
                    ) : null}
                    {isProvider && order.status === 'accepted' ? (
                      <Button loading={busy} onClick={() => run(() => setOrderStatus(order._id, 'in_progress'))}>
                        Start
                      </Button>
                    ) : null}
                    {isProvider && order.status === 'in_progress' ? (
                      <Button loading={busy} onClick={() => run(() => setOrderStatus(order._id, 'completed'))}>
                        Complete
                      </Button>
                    ) : null}
                    {order.status !== 'completed' && order.status !== 'canceled' ? (
                      <Button variant="danger" loading={busy} onClick={() => run(() => setOrderStatus(order._id, 'canceled'))}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>

                {order.description ? (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {order.description}
                  </p>
                ) : null}

                <div style={{ height: 14 }} />
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <span className="pill">Service: {order.serviceKey}</span>
                  {order.address ? <span className="pill">Address: {order.address}</span> : null}
                  {order.scheduledAt ? <span className="pill">When: {formatDate(order.scheduledAt)}</span> : null}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardInner">
                <h3 style={{ marginTop: 0 }}>Timeline</h3>
                <div className="col" style={{ gap: 10 }}>
                  {timeline.map((e, idx) => (
                    <div
                      key={`${e.status}-${e.at}-${idx}`}
                      style={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(0,0,0,0.12)',
                        borderRadius: 12,
                        padding: '10px 12px',
                      }}
                    >
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <strong>{statusLabel(e.status)}</strong>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {formatDate(e.at)}
                        </span>
                      </div>
                      {e.note ? <div className="muted">{e.note}</div> : null}
                    </div>
                  ))}
                  {timeline.length === 0 ? <span className="muted">No events yet.</span> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

