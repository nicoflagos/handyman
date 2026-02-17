import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { listServices, ServiceItem } from '../services/catalog';
import { createOrder } from '../services/orders';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/Toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

  const [serviceKey, setServiceKey] = useState(query.get('service') || 'handyman');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    listServices()
      .then(items => setServices(items))
      .finally(() => setLoadingServices(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitState('submitting');
    try {
      const order = await createOrder({
        serviceKey,
        title: title || `Request: ${serviceKey}`,
        description: description || undefined,
        address: address || undefined,
        scheduledAt: scheduledAt || undefined,
      });
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
                  Describe the job, then submit. A provider can accept it from the marketplace.
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
              <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City" />
              <Input
                label="Preferred date/time"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                placeholder="Optional (e.g. 2026-02-18 2pm)"
              />

              {error ? <InlineNotice kind="error">{error}</InlineNotice> : null}

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Button type="submit" loading={submitState === 'submitting'}>
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
            <h3 style={{ marginTop: 0 }}>How providers find you</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Provider accounts can browse the marketplace and accept available orders. Next we’ll add distance, pricing,
              and availability filters.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

