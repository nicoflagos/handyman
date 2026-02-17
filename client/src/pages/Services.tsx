import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { listServices, ServiceItem } from '../services/catalog';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { InlineNotice } from '../ui/Toast';

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    listServices()
      .then(items => {
        setServices(items);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const cards = useMemo(
    () =>
      services.map(s => (
        <div key={s.key} className="card">
          <div className="cardInner">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>{s.name}</h3>
                <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
                  {s.description}
                </p>
              </div>
              <Link to={`/orders/new?service=${encodeURIComponent(s.key)}`} style={{ textDecoration: 'none' }}>
                <Button>Book</Button>
              </Link>
            </div>
          </div>
        </div>
      )),
    [services],
  );

  return (
    <Layout>
      <div className="col" style={{ gap: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Service catalog</h2>
            <p className="muted" style={{ margin: 0 }}>
              Choose a category to start a request.
            </p>
          </div>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>

        {status === 'error' ? <InlineNotice kind="error">Unable to load services.</InlineNotice> : null}
        {status === 'loading' ? <span className="muted">Loading…</span> : null}

        <div className="col" style={{ gap: 12 }}>
          {cards}
        </div>
      </div>
    </Layout>
  );
}

