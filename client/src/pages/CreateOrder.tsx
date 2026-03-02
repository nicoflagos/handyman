import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { listServices, ServiceItem } from '../services/catalog';
import { createOrder, uploadCustomerJobImage } from '../services/orders';
import { getMe } from '../services/me';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/Toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NigeriaLocationSelect, NigeriaLocationValue } from '../components/NigeriaLocationSelect';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function CreateOrder() {
  const query = useQuery();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [serviceKey, setServiceKey] = useState(query.get('service') || 'handyman');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<NigeriaLocationValue>({ state: '', lga: '', lc: '', street: '' });
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [price, setPrice] = useState('');
  const [jobImages, setJobImages] = useState<File[]>([]);

  const jobImagePreviews = useMemo(() => jobImages.map(f => URL.createObjectURL(f)), [jobImages]);
  useEffect(() => {
    return () => {
      jobImagePreviews.forEach(u => URL.revokeObjectURL(u));
    };
  }, [jobImagePreviews]);

  function onPickJobImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const clean = files.filter(f => f.type.startsWith('image/'));
    if (clean.length === 0) return;
    setJobImages(prev => [...prev, ...clean].slice(0, 2));
  }

  function removeJobImage(idx: number) {
    setJobImages(prev => prev.filter((_, i) => i !== idx));
  }

  const address = useMemo(() => {
    const parts = [
      location.street?.trim(),
      location.lc?.trim(),
      location.lga ? `${location.lga} LGA` : '',
      location.state?.trim(),
      'Nigeria',
    ].filter(Boolean);
    return parts.join(', ');
  }, [location.lc, location.lga, location.state, location.street]);

  useEffect(() => {
    listServices()
      .then(items => setServices(items))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    getMe()
      .then(me => setWalletBalance(typeof me.walletBalance === 'number' ? me.walletBalance : 0))
      .catch(() => setWalletBalance(null));
  }, []);

  const numericPrice = Number(price);
  const platformFee = Number.isFinite(numericPrice) && numericPrice > 0 ? Math.round(numericPrice * 0.1) : 0;
  const totalDue = Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice + platformFee : 0;
  const insufficientFunds = walletBalance !== null && totalDue > 0 && walletBalance < totalDue;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedOrderId(null);
    if (!location.state || !location.lga || !location.lc) {
      setError('Please select your State, LGA, and Local Council.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid service fee.');
      return;
    }
    if (insufficientFunds) {
      setError(`Insufficient wallet balance. Need ₦${totalDue.toLocaleString()} (₦${numericPrice.toLocaleString()} + ₦${platformFee.toLocaleString()} fee).`);
      return;
    }
    setSubmitState('submitting');
    try {
      const scheduledAt =
        scheduledDate && scheduledTime
          ? `${scheduledDate}T${scheduledTime}`
          : scheduledDate
            ? `${scheduledDate}T09:00`
            : undefined;
      let order = await createOrder({
        serviceKey,
        title: title || `Request: ${serviceKey}`,
        description: description || undefined,
        address: address || undefined,
        country: 'Nigeria',
        state: location.state,
        lga: location.lga,
        lc: location.lc,
        price: numericPrice,
        scheduledAt,
      });
      setCreatedOrderId(order._id);

      for (const file of jobImages) {
        order = await uploadCustomerJobImage(order._id, file);
      }
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err: any) {
      setSubmitState('error');
      setError(err?.response?.data?.message || 'Unable to create order');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: 6 }}>Create an order</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Describe the job, then submit. A handyman can accept it from the marketplace.
                </p>
              </div>
              <Link to="/services" style={{ textDecoration: 'none' }}>
                <Button variant="ghost">Catalog</Button>
              </Link>
            </div>

            <form onSubmit={onSubmit} className="col" style={{ marginTop: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Service</span>
                <select
                  value={serviceKey}
                  onChange={e => setServiceKey(e.target.value)}
                  disabled={loadingServices}
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
                  {services.map(s => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fix leaking sink" />
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Description</span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Add details, photos later, access notes, etc."
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
              <NigeriaLocationSelect value={location} onChange={setLocation} />
              <Input
                label="Service fee (NGN)"
                value={price}
                onChange={e => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 5000"
                hint={
                  walletBalance === null
                    ? 'Service fee only (excludes cost of materials).'
                    : `Wallet: ₦${walletBalance.toLocaleString()}. Total (fee+10%): ₦${totalDue.toLocaleString()}.`
                }
                error={insufficientFunds ? 'Insufficient wallet balance for this booking.' : null}
              />
              <Input
                label="Preferred date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                type="date"
                hint="Optional. Choose your preferred date."
              />
              <Input
                label="Preferred time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                type="time"
                hint="Optional. If you leave this empty, we’ll default to 09:00."
              />

              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Job photos (optional)</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {jobImages.length}/2
                  </span>
                </div>
                <input type="file" accept="image/*" multiple onChange={onPickJobImages} />
                {jobImagePreviews.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    {jobImagePreviews.map((u, idx) => (
                      <div key={u} className="landingCard" style={{ padding: 10 }}>
                        <img
                          src={u}
                          alt={`Job photo ${idx + 1}`}
                          style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Button type="button" variant="ghost" onClick={() => removeJobImage(idx)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>
                    Upload up to 2 photos to help the handyman understand the job.
                  </span>
                )}
              </div>

              {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}
              {createdOrderId && submitState === 'error' ? (
                <InlineNotice kind="info">
                  Order may have been created. You can open it here:{' '}
                  <Link to={`/orders/${createdOrderId}`} style={{ color: 'inherit' }}>
                    View order
                  </Link>
                </InlineNotice>
              ) : null}

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Button type="submit" loading={submitState === 'submitting'} disabled={insufficientFunds}>
                  Submit request
                </Button>
                <span className="muted" style={{ fontSize: 13 }}>
                  You can cancel later from the order timeline.
                </span>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Matching
            </div>
            <h3 style={{ marginTop: 0 }}>How handymen find you</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Handyman accounts can browse the marketplace and accept available orders. Next we’ll add distance, pricing,
              and availability filters.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
