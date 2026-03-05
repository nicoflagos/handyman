import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../ui/Button';
import { InlineNotice } from '../ui/Toast';
import { assetUrl } from '../lib/assetUrl';
import { Order } from '../services/orders';
import {
  adminGetProviderIdImageUrl,
  adminGetProviderPassportPhotoUrl,
  adminListOrders,
  adminListTransactions,
  adminListUsers,
  AdminUser,
} from '../services/admin';

export default function Admin() {
  const [tab, setTab] = React.useState<'orders' | 'users' | 'transactions'>('orders');

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersState, setOrdersState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [orderStatus, setOrderStatus] = React.useState('');

  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [usersState, setUsersState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [userQuery, setUserQuery] = React.useState('');
  const [userRole, setUserRole] = React.useState('');
  const [expandedUserId, setExpandedUserId] = React.useState<string | null>(null);

  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [txState, setTxState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [txUserId, setTxUserId] = React.useState('');

  React.useEffect(() => {
    if (tab !== 'orders') return;
    setOrdersState('loading');
    adminListOrders({ status: orderStatus || undefined, limit: 100 })
      .then(items => setOrders(items as any))
      .then(() => setOrdersState('ready'))
      .catch(() => setOrdersState('error'));
  }, [orderStatus, tab]);

  React.useEffect(() => {
    if (tab !== 'users') return;
    setUsersState('loading');
    adminListUsers({ q: userQuery || undefined, role: userRole || undefined, limit: 100 })
      .then(setUsers)
      .then(() => setUsersState('ready'))
      .catch(() => setUsersState('error'));
  }, [tab, userQuery, userRole]);

  React.useEffect(() => {
    if (tab !== 'transactions') return;
    setTxState('loading');
    adminListTransactions({ userId: txUserId || undefined, limit: 200 })
      .then(items => setTransactions(items as any))
      .then(() => setTxState('ready'))
      .catch(() => setTxState('error'));
  }, [tab, txUserId]);

  function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
    if (!rows.length) return;
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      const needs = /[",\n]/.test(s);
      const clean = s.replace(/"/g, '""');
      return needs ? `"${clean}"` : clean;
    };
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Admin</h2>
            <p className="muted" style={{ margin: 0 }}>
              Reporting and compliance tools. Admin-only.
            </p>
          </div>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>

        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <Button variant={tab === 'orders' ? 'primary' : 'ghost'} onClick={() => setTab('orders')}>
            Orders
          </Button>
          <Button variant={tab === 'users' ? 'primary' : 'ghost'} onClick={() => setTab('users')}>
            Users
          </Button>
          <Button variant={tab === 'transactions' ? 'primary' : 'ghost'} onClick={() => setTab('transactions')}>
            Transactions
          </Button>
        </div>

        {tab === 'orders' ? (
          <div className="card">
            <div className="cardInner">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'grid', gap: 6, minWidth: 220 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Status filter</span>
                  <select
                    value={orderStatus}
                    onChange={e => setOrderStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.18)',
                      color: 'rgba(255,255,255,0.92)',
                      outline: 'none',
                    }}
                  >
                    <option value="">All</option>
                    <option value="requested">requested</option>
                    <option value="accepted">accepted</option>
                    <option value="arrived">arrived</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="canceled">canceled</option>
                  </select>
                </div>
                <Button variant="ghost" onClick={() => downloadCsv('orders.csv', orders as any)}>
                  Export CSV
                </Button>
              </div>

              {ordersState === 'error' ? <InlineNotice kind="error">Unable to load orders.</InlineNotice> : null}
              {ordersState === 'loading' ? <span className="muted">Loading...</span> : null}

              <div className="col" style={{ gap: 10, marginTop: 12 }}>
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
                        <span className="pill">{o.status}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {o.serviceKey} • {o._id}
                      </div>
                      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                        <span className="pill" title="Location">
                          {[o.lc, o.lga, o.state].filter(Boolean).join(', ')}
                        </span>
                        <span className="pill" title="Service fee">
                          ₦{Number(o.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {ordersState === 'ready' && orders.length === 0 ? <span className="muted">No orders.</span> : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'users' ? (
          <div className="card">
            <div className="cardInner">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
                <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6, minWidth: 240 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Search</span>
                    <input
                      value={userQuery}
                      onChange={e => setUserQuery(e.target.value)}
                      placeholder="email, username, phone, name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(0,0,0,0.18)',
                        color: 'rgba(255,255,255,0.92)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: 6, minWidth: 200 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Role</span>
                    <select
                      value={userRole}
                      onChange={e => setUserRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'rgba(0,0,0,0.18)',
                        color: 'rgba(255,255,255,0.92)',
                        outline: 'none',
                      }}
                    >
                      <option value="">All</option>
                      <option value="customer">customer</option>
                      <option value="provider">handyman</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => downloadCsv('users.csv', users as any)}>
                  Export CSV
                </Button>
              </div>

              {usersState === 'error' ? <InlineNotice kind="error">Unable to load users.</InlineNotice> : null}
              {usersState === 'loading' ? <span className="muted">Loading...</span> : null}

              <div className="col" style={{ gap: 10, marginTop: 12 }}>
                {users.map(u => {
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u._id;
                  const isHandyman = u.role === 'provider';
                  const verified = !!u.providerProfile?.verified;
                  const workCount = Array.isArray(u.providerProfile?.workImageUrls) ? u.providerProfile!.workImageUrls!.length : 0;
                  const hasIdImage = !!String(u.providerProfile?.idImageUrl || '').trim();
                  const hasPassport = !!String(u.providerProfile?.passportPhotoUrl || '').trim();
                  const expanded = expandedUserId === u._id;
                  const skills = Array.isArray(u.providerProfile?.skills) ? (u.providerProfile?.skills as string[]) : [];

                  async function openIdImage() {
                    const url = await adminGetProviderIdImageUrl(u._id);
                    if (url) window.open(assetUrl(url), '_blank', 'noreferrer');
                  }
                  async function openPassportPhoto() {
                    const url = await adminGetProviderPassportPhotoUrl(u._id);
                    if (url) window.open(assetUrl(url), '_blank', 'noreferrer');
                  }

                  return (
                    <div
                      key={u._id}
                      style={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(0,0,0,0.12)',
                        borderRadius: 12,
                        padding: '10px 12px',
                      }}
                    >
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div className="row" style={{ alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {u.avatarUrl ? (
                            <img
                              src={assetUrl(u.avatarUrl)}
                              alt="avatar"
                              style={{ width: 34, height: 34, borderRadius: 999, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.14)' }}
                            />
                          ) : null}
                          <strong>{fullName}</strong>
                          <span className="pill">{u.role}</span>
                          {isHandyman ? <span className="pill">Work samples: {workCount}</span> : null}
                          {isHandyman && verified ? <span className="pill">Verified</span> : null}
                        </div>
                        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                          <Button variant="ghost" onClick={() => setExpandedUserId(expanded ? null : u._id)}>
                            {expanded ? 'Hide' : 'View'}
                          </Button>
                          {isHandyman && hasIdImage ? (
                            <Button variant="ghost" onClick={openIdImage}>
                              View ID image
                            </Button>
                          ) : null}
                          {isHandyman && hasPassport ? (
                            <Button variant="ghost" onClick={openPassportPhoto}>
                              View passport
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                        {u.email || '—'} {u.phone ? `• ${u.phone}` : ''}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        {u._id}
                      </div>

                      {expanded ? (
                        <div style={{ marginTop: 10 }}>
                          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                            <span className="pill" title="Wallet balance">
                              Wallet: ₦{Number(u.walletBalance || 0).toLocaleString()}
                            </span>
                            {u.gender ? <span className="pill">Gender: {u.gender}</span> : null}
                          </div>

                          {isHandyman ? (
                            <div style={{ marginTop: 10 }} className="col">
                              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                {u.providerProfile?.state ? <span className="pill">State: {u.providerProfile.state}</span> : null}
                                {u.providerProfile?.lga ? <span className="pill">LGA: {u.providerProfile.lga}</span> : null}
                                {u.providerProfile?.lc ? <span className="pill">LC: {u.providerProfile.lc}</span> : null}
                              </div>
                              {u.providerProfile?.address ? (
                                <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                                  Address: {u.providerProfile.address}
                                </div>
                              ) : null}

                              <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                                <span className="pill">Availability: {u.providerProfile?.available ? 'On' : 'Off'}</span>
                                {u.providerProfile?.availabilityNote ? (
                                  <span className="pill">Note: {u.providerProfile.availabilityNote}</span>
                                ) : null}
                              </div>

                              <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                                {u.providerProfile?.idType ? <span className="pill">ID type: {u.providerProfile.idType}</span> : null}
                                {u.providerProfile?.idNumber ? <span className="pill">ID number: {u.providerProfile.idNumber}</span> : null}
                              </div>

                              {skills.length ? (
                                <div style={{ marginTop: 10 }}>
                                  <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                                    Skills
                                  </div>
                                  <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                                    {skills.map(s => (
                                      <span key={s} className="pill">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                                  Skills: —
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {usersState === 'ready' && users.length === 0 ? <span className="muted">No users.</span> : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'transactions' ? (
          <div className="card">
            <div className="cardInner">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'grid', gap: 6, minWidth: 320 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Filter by userId (optional)</span>
                  <input
                    value={txUserId}
                    onChange={e => setTxUserId(e.target.value)}
                    placeholder="Mongo userId"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.18)',
                      color: 'rgba(255,255,255,0.92)',
                      outline: 'none',
                    }}
                  />
                </div>
                <Button variant="ghost" onClick={() => downloadCsv('transactions.csv', transactions as any)}>
                  Export CSV
                </Button>
              </div>

              {txState === 'error' ? <InlineNotice kind="error">Unable to load transactions.</InlineNotice> : null}
              {txState === 'loading' ? <span className="muted">Loading...</span> : null}

              <div className="col" style={{ gap: 10, marginTop: 12 }}>
                {transactions.map((t: any) => (
                  <div
                    key={String(t._id)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.12)',
                      borderRadius: 12,
                      padding: '10px 12px',
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong>{t.type}</strong>
                      <span className="pill">
                        {t.direction} ₦{Number(t.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                      userId: {String(t.userId)} • {t.currency} • {String(t.createdAt || '')}
                    </div>
                    {t.ref ? (
                      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        ref: {String(t.ref)}
                      </div>
                    ) : null}
                  </div>
                ))}
                {txState === 'ready' && transactions.length === 0 ? <span className="muted">No transactions.</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
