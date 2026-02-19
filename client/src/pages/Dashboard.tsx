import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { InlineNotice } from '../ui/Toast';
import { listMarketplaceOrders, listMyOrders, Order } from '../services/orders';
import { getMe, listMyTransactions, Me, topUpWallet, Transaction, updateProviderProfile, uploadAvatar } from '../services/me';

export default function Dashboard() {
  const auth = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [market, setMarket] = React.useState<Order[]>([]);
  const [me, setMe] = React.useState<Me | null>(null);
  const [tx, setTx] = React.useState<Transaction[]>([]);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const isProvider = auth.claims?.role === 'provider' || auth.claims?.role === 'admin';
  const isAdmin = auth.claims?.role === 'admin';

  function stars(avg?: number) {
    const n = Number(avg);
    if (!Number.isFinite(n) || n <= 0) return '☆☆☆☆☆';
    const filled = Math.max(0, Math.min(5, Math.round(n)));
    return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
  }

  React.useEffect(() => {
    setState('loading');
    Promise.all([
      listMyOrders(),
      isProvider ? listMarketplaceOrders() : Promise.resolve([]),
      getMe(),
      listMyTransactions().catch(() => [] as Transaction[]),
    ])
      .then(([my, m, meRes, txRes]) => {
        setOrders(my);
        setMarket(m);
        setMe(meRes);
        setTx(txRes);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [isProvider]);

  // Marketplace listeners (polling): keep jobs list fresh for handymen.
  React.useEffect(() => {
    if (!isProvider) return;
    if (state !== 'ready') return;
    const intervalMs = 5000;

    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const [my, m, txRes] = await Promise.all([
          listMyOrders(),
          listMarketplaceOrders(),
          listMyTransactions().catch(() => [] as Transaction[]),
        ]);
        setOrders(my);
        setMarket(m);
        setTx(txRes);
      } catch {
        // ignore transient errors
      }
    };

    const handle = setInterval(tick, intervalMs);
    const timeout = setTimeout(tick, 800);
    return () => {
      stopped = true;
      clearInterval(handle);
      clearTimeout(timeout);
    };
  }, [isProvider, state]);

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Dashboard</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Welcome,{' '}
              <strong>
                {me?.firstName || auth.claims?.firstName || auth.claims?.username || auth.claims?.email || 'there'}
                {me?.lastName ? ` ${me.lastName}` : auth.claims?.lastName ? ` ${auth.claims.lastName}` : ''}
              </strong>
            </p>

            <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              {me?.avatarUrl ? (
                <img
                  src={me.avatarUrl}
                  alt="Profile"
                  style={{ width: 88, height: 88, borderRadius: 999, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.14)' }}
                />
              ) : (
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(0,0,0,0.12)',
                  }}
                />
              )}
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Profile picture</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const updated = await uploadAvatar(file);
                      setMe(updated);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || 'Unable to upload profile picture');
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </label>
            </div>

            <div style={{ height: 10 }} />
            <div className="row" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span className="pill">Wallet: ₦{Number(me?.walletBalance || 0).toLocaleString()}</span>
              <Button
                variant="ghost"
                onClick={async () => {
                  const raw = prompt('Top-up amount (NGN)', '10000');
                  if (!raw) return;
                  const amt = Number(raw);
                  if (!Number.isFinite(amt) || amt <= 0) return alert('Enter a valid amount');
                  try {
                    const updated = await topUpWallet(amt);
                    setMe(updated);
                    const nextTx = await listMyTransactions().catch(() => [] as Transaction[]);
                    setTx(nextTx);
                  } catch (err: any) {
                    alert(err?.response?.data?.message || 'Unable to top up wallet');
                  }
                }}
              >
                Top up wallet
              </Button>
              {me?.role === 'customer' && typeof me.ratingAsCustomerAvg === 'number' ? (
                <span className="pill" title={`${me.ratingAsCustomerAvg.toFixed(1)} / 5`}>
                  Rating: {stars(me.ratingAsCustomerAvg)}
                </span>
              ) : null}
              {me?.role === 'provider' && typeof me.ratingAsHandymanAvg === 'number' ? (
                <span className="pill" title={`${me.ratingAsHandymanAvg.toFixed(1)} / 5`}>
                  Rating: {stars(me.ratingAsHandymanAvg)}
                </span>
              ) : null}
            </div>

            {me?.role === 'provider' ? (
              <div style={{ height: 10 }} />
            ) : null}
            {me?.role === 'provider' ? (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Available to take jobs</span>
                <label className="switch" aria-label="Availability toggle">
                  <input
                    type="checkbox"
                    checked={me.providerProfile?.available ?? true}
                    onChange={async e => {
                      if (!me) return;
                      const nextAvailable = e.target.checked;
                      try {
                        const updated = await updateProviderProfile({
                          zip: me.providerProfile?.zip,
                          country: me.providerProfile?.country,
                          state: me.providerProfile?.state,
                          lga: me.providerProfile?.lga,
                          skills: me.providerProfile?.skills || [],
                          available: nextAvailable,
                          availabilityNote: me.providerProfile?.availabilityNote,
                        });
                        setMe(updated);
                      } catch (err: any) {
                        alert(err?.response?.data?.message || 'Unable to update availability');
                      }
                    }}
                  />
                  <span className="switchSlider" />
                </label>
              </div>
            ) : null}

            <div className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
              {auth.claims?.role === 'customer' ? (
                <Link to="/services" style={{ textDecoration: 'none' }}>
                  <Button>Book a service</Button>
                </Link>
              ) : null}
              <Button variant="danger" onClick={auth.logout}>
                Logout
              </Button>
            </div>

            <div style={{ height: 14 }} />
            <h3 style={{ marginBottom: 10 }}>{isProvider ? 'My jobs' : 'My orders'}</h3>
            {state === 'error' ? <InlineNotice kind="error">Unable to load orders.</InlineNotice> : null}
            {state === 'loading' ? <span className="muted">Loading…</span> : null}
            <div className="col" style={{ gap: 10 }}>
              {orders.map(o => (
                <Link key={o._id} to={`/orders/${o._id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.12)',
                      borderRadius: 12,
                      padding: '10px 12px',
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong>{o.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {o.status}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {o.serviceKey}
                    </div>
                  </div>
                </Link>
              ))}
              {state === 'ready' && orders.length === 0 ? (
                <span className="muted">
                  {isProvider ? 'No assigned jobs yet.' : 'No orders yet. Book a service to get started.'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Transactions
            </div>
            {state === 'loading' ? <span className="muted">Loadingâ€¦</span> : null}
            <div className="col" style={{ gap: 8 }}>
              {tx.map(t => (
                <div
                  key={t._id}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.12)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    gap: 10,
                  }}
                >
                  <div>
                    <strong>{t.type}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>
                      {t.direction === 'in' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
              {state === 'ready' && tx.length === 0 ? <span className="muted">No transactions yet.</span> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              {isProvider ? 'Marketplace' : 'Getting started'}
            </div>

            {isProvider ? (
              <>
                <h3 style={{ marginTop: 0 }}>Available jobs</h3>
                <p className="muted" style={{ marginTop: 0 }}>
                  Accept a job to move it to your assigned list.
                </p>
                {auth.claims?.role === 'provider' ? (
                  <Link to="/provider/settings" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost">Handyman settings</Button>
                  </Link>
                ) : null}
                <div className="col" style={{ gap: 10 }}>
                  {market.map(o => (
                    <Link key={o._id} to={`/orders/${o._id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(0,0,0,0.12)',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <strong>{o.title}</strong>
                          <span className="muted" style={{ fontSize: 13 }}>
                            {o.status}
                          </span>
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {o.serviceKey}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {state === 'ready' && market.length === 0 ? (
                    <span className="muted">No open jobs right now.</span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 0 }}>Next steps</h3>
                <ol className="muted" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  <li>Pick a service category</li>
                  <li>Create an order request</li>
                  <li>Track progress from the timeline</li>
                </ol>
              </>
            )}

            {isAdmin ? (
              <>
                <div style={{ height: 14 }} />
                <InlineNotice kind="info">Admin role detected. Next we’ll add an admin orders console.</InlineNotice>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
