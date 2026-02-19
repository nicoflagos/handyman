import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import {
  acceptOrder,
  completeOrder,
  confirmOrderPrice,
  getOrder,
  Order,
  OrderStatus,
  rateOrder,
  setOrderStatus,
  startOrder,
} from '../services/orders';
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
  const [verificationCode, setVerificationCode] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [priceBusy, setPriceBusy] = useState(false);

  const isProvider = auth.claims?.role === 'provider' || auth.claims?.role === 'admin';
  const isCustomer = auth.claims?.role === 'customer';

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

  // Auto-refresh order details so status/timeline updates without a hard refresh.
  useEffect(() => {
    if (!id) return;
    if (state !== 'ready') return;
    const intervalMs = 5000;

    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      if (busy || ratingBusy) return;
      try {
        const latest = await getOrder(id);
        setOrder(latest);
      } catch {
        // ignore transient polling errors
      }
    };

    const handle = setInterval(tick, intervalMs);
    // Also refresh once shortly after mount/ready.
    const timeout = setTimeout(tick, 800);
    return () => {
      stopped = true;
      clearInterval(handle);
      clearTimeout(timeout);
    };
  }, [busy, id, ratingBusy, state]);

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

  async function submitRating() {
    if (!order) return;
    setError(null);
    setRatingBusy(true);
    try {
      const updated = await rateOrder(order._id, { stars: ratingStars, note: ratingNote || undefined });
      setOrder(updated);
      setRatingNote('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to submit rating');
    } finally {
      setRatingBusy(false);
    }
  }

  async function confirmPrice() {
    if (!order) return;
    setError(null);
    setPriceBusy(true);
    try {
      const updated = await confirmOrderPrice(order._id);
      setOrder(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to confirm price');
    } finally {
      setPriceBusy(false);
    }
  }

  async function startWithProof() {
    if (!order) return;
    if (!beforeImage) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await startOrder(order._id, { verificationCode: verificationCode || undefined, file: beforeImage });
      setOrder(updated);
      setBeforeImage(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to start order');
    } finally {
      setBusy(false);
    }
  }

  async function completeWithProof() {
    if (!order) return;
    if (!afterImage) return;
    setError(null);
    setBusy(true);
    try {
      const updated = await completeOrder(order._id, afterImage);
      setOrder(updated);
      setAfterImage(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to complete order');
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
                      <Button loading={busy} onClick={startWithProof} disabled={!order.priceConfirmed || !beforeImage}>
                        Start (with before image)
                      </Button>
                    ) : null}
                    {isProvider && order.status === 'in_progress' ? (
                      <Button loading={busy} onClick={completeWithProof} disabled={!afterImage}>
                        Complete (with after image)
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
                  <span className="pill">Price: ₦{Number(order.price || 0).toLocaleString()}</span>
                  <span className="pill">Price confirmed: {order.priceConfirmed ? 'Yes' : 'No'}</span>
                  {order.address ? <span className="pill">Address: {order.address}</span> : null}
                  {order.scheduledAt ? <span className="pill">When: {formatDate(order.scheduledAt)}</span> : null}
                  {isCustomer && order.verificationCode ? (
                    <span className="pill">Verification code: {order.verificationCode}</span>
                  ) : null}
                </div>

                {isProvider && order.status === 'in_progress' ? (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>After image</span>
                      <input type="file" accept="image/*" onChange={e => setAfterImage(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ) : null}

                {order.status !== 'requested' && order.providerId && (order.customerInfo || order.handymanInfo) ? (
                  <div style={{ marginTop: 14 }}>
                    <div className="pill" style={{ marginBottom: 10 }}>
                      Contact info
                    </div>
                    <div className="col" style={{ gap: 10 }}>
                      {order.customerInfo ? (
                        <div className="row" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          {order.customerInfo.avatarUrl ? (
                            <img
                              src={order.customerInfo.avatarUrl}
                              alt="Customer"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                objectFit: 'cover',
                                border: '1px solid rgba(255,255,255,0.14)',
                              }}
                            />
                          ) : null}
                          <span className="pill">
                            Customer:{' '}
                            {[
                              order.customerInfo.firstName,
                              order.customerInfo.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ') || order.customerInfo.username}
                          </span>
                          {order.customerInfo.gender ? <span className="pill">Gender: {order.customerInfo.gender}</span> : null}
                          {order.customerInfo.phone ? <span className="pill">Phone: {order.customerInfo.phone}</span> : null}
                          {typeof order.customerInfo.ratingAsCustomerAvg === 'number' &&
                          typeof order.customerInfo.ratingAsCustomerCount === 'number' ? (
                            <span className="pill">
                              Rating: {order.customerInfo.ratingAsCustomerAvg.toFixed(1)} ({order.customerInfo.ratingAsCustomerCount})
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {order.handymanInfo ? (
                        <div className="row" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          {order.handymanInfo.avatarUrl ? (
                            <img
                              src={order.handymanInfo.avatarUrl}
                              alt="Handyman"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                objectFit: 'cover',
                                border: '1px solid rgba(255,255,255,0.14)',
                              }}
                            />
                          ) : null}
                          <span className="pill">
                            Handyman:{' '}
                            {[
                              order.handymanInfo.firstName,
                              order.handymanInfo.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ') || order.handymanInfo.username}
                          </span>
                          {order.handymanInfo.gender ? <span className="pill">Gender: {order.handymanInfo.gender}</span> : null}
                          {order.handymanInfo.phone ? <span className="pill">Phone: {order.handymanInfo.phone}</span> : null}
                          {typeof order.handymanInfo.ratingAsHandymanAvg === 'number' &&
                          typeof order.handymanInfo.ratingAsHandymanCount === 'number' ? (
                            <span className="pill">
                              Rating: {order.handymanInfo.ratingAsHandymanAvg.toFixed(1)} ({order.handymanInfo.ratingAsHandymanCount})
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {isProvider && order.status === 'accepted' ? (
                  <div style={{ marginTop: 12 }}>
                    {!order.priceConfirmed ? (
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span className="muted">Confirm the customer’s price before starting.</span>
                        <Button variant="ghost" loading={priceBusy} onClick={confirmPrice}>
                          Confirm price
                        </Button>
                      </div>
                    ) : null}
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Customer verification code</span>
                      <input
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        inputMode="numeric"
                        placeholder="Enter 6-digit code"
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
                    </label>
                    <label style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Before image</span>
                      <input type="file" accept="image/*" onChange={e => setBeforeImage(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ) : null}

                {order.status === 'completed' ? (
                  <div style={{ marginTop: 14 }}>
                    <div className="pill" style={{ marginBottom: 10 }}>
                      Rating
                    </div>

                    {isCustomer ? (
                      order.customerRating ? (
                        <span className="muted">
                          You rated this handyman {order.customerRating.stars}/5
                          {order.customerRating.note ? ` — “${order.customerRating.note}”` : ''}.
                        </span>
                      ) : (
                        <div className="col" style={{ gap: 10 }}>
                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Rate your handyman</span>
                            <select
                              value={ratingStars}
                              onChange={e => setRatingStars(Number(e.target.value))}
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
                              {[5, 4, 3, 2, 1].map(n => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Note (optional)</span>
                            <textarea
                              value={ratingNote}
                              onChange={e => setRatingNote(e.target.value)}
                              rows={3}
                              placeholder="Share feedback (optional)"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: 'rgba(0,0,0,0.18)',
                                color: 'rgba(255,255,255,0.92)',
                                outline: 'none',
                                resize: 'vertical',
                              }}
                            />
                          </label>
                          <div className="row" style={{ justifyContent: 'flex-end' }}>
                            <Button loading={ratingBusy} onClick={submitRating}>
                              Submit rating
                            </Button>
                          </div>
                        </div>
                      )
                    ) : isProvider ? (
                      order.handymanRating ? (
                        <span className="muted">
                          You rated this customer {order.handymanRating.stars}/5
                          {order.handymanRating.note ? ` — “${order.handymanRating.note}”` : ''}.
                        </span>
                      ) : (
                        <div className="col" style={{ gap: 10 }}>
                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Rate the customer</span>
                            <select
                              value={ratingStars}
                              onChange={e => setRatingStars(Number(e.target.value))}
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
                              {[5, 4, 3, 2, 1].map(n => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Note (optional)</span>
                            <textarea
                              value={ratingNote}
                              onChange={e => setRatingNote(e.target.value)}
                              rows={3}
                              placeholder="Share feedback (optional)"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: 'rgba(0,0,0,0.18)',
                                color: 'rgba(255,255,255,0.92)',
                                outline: 'none',
                                resize: 'vertical',
                              }}
                            />
                          </label>
                          <div className="row" style={{ justifyContent: 'flex-end' }}>
                            <Button loading={ratingBusy} onClick={submitRating}>
                              Submit rating
                            </Button>
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>
                ) : null}
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
