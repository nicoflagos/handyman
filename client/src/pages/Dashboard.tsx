import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';
import { listMarketplaceOrders, listMyOrders, Order } from '../services/orders';
import { getMe, listMyTransactions, Me, topUpWallet, Transaction, updateProviderProfile, uploadAvatar } from '../services/me';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { WalletCard } from '../components/dashboard/WalletCard';
import { WorkSamplesGrid } from '../components/dashboard/WorkSamplesGrid';
import { OrdersList } from '../components/dashboard/OrdersList';
import { MarketplaceList } from '../components/dashboard/MarketplaceList';
import { TransactionsList } from '../components/dashboard/TransactionsList';
import { TopUpModal } from '../components/dashboard/TopUpModal';

function stars(avg?: number) {
  const n = Number(avg);
  if (!Number.isFinite(n) || n <= 0) return '\u2606\u2606\u2606\u2606\u2606';
  const filled = Math.max(0, Math.min(5, Math.round(n)));
  return `${'\u2605'.repeat(filled)}${'\u2606'.repeat(5 - filled)}`;
}

function nameFrom(me: Me | null, claims: any) {
  const first = me?.firstName || claims?.firstName || '';
  const last = me?.lastName || claims?.lastName || '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || claims?.username || claims?.email || 'there';
}

export default function Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [market, setMarket] = React.useState<Order[]>([]);
  const [me, setMe] = React.useState<Me | null>(null);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const [tx, setTx] = React.useState<Transaction[]>([]);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [topUpOpen, setTopUpOpen] = React.useState(false);
  const [topUpLoading, setTopUpLoading] = React.useState(false);
  const [topUpError, setTopUpError] = React.useState<string | null>(null);

  const role = auth.me?.role || auth.claims?.role || me?.role;
  const isProvider = role === 'provider' || role === 'admin';

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
        setAvatarFailed(false);
        setTx(txRes);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [isProvider]);

  React.useEffect(() => {
    if (state !== 'ready') return;
    if (!me) return;
    try {
      if (localStorage.getItem('postRegisterTopUp') === '1') {
        localStorage.removeItem('postRegisterTopUp');
        setTopUpOpen(true);
      }
    } catch {
      // ignore
    }
  }, [state, me]);

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

  const fullName =
    [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim() || me?.username || me?.email || 'there';
  const roleLabel = me?.role === 'provider' ? 'Handyman' : me?.role === 'customer' ? 'Customer' : me?.role === 'admin' ? 'Admin' : 'User';
  const rating =
    me?.role === 'provider'
      ? { label: `${Number(me?.ratingAsHandymanAvg || 0).toFixed(1)} / 5`, stars: stars(me?.ratingAsHandymanAvg) }
      : { label: `${Number(me?.ratingAsCustomerAvg || 0).toFixed(1)} / 5`, stars: stars(me?.ratingAsCustomerAvg) };

  async function submitTopUp(amount: number) {
    setTopUpError(null);
    setTopUpLoading(true);
    try {
      const updated = await topUpWallet(amount);
      setMe(updated);
      const nextTx = await listMyTransactions().catch(() => [] as Transaction[]);
      setTx(nextTx);
      setTopUpOpen(false);
    } catch (err: any) {
      setTopUpError(err?.response?.data?.message || 'Unable to top up wallet');
    } finally {
      setTopUpLoading(false);
    }
  }

  async function handleUploadAvatar(file: File) {
    try {
      const updated = await uploadAvatar(file);
      setMe(updated);
      setAvatarFailed(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to upload profile picture');
    }
  }

  return (
    <Layout>
      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSubmit={submitTopUp}
        loading={topUpLoading}
        error={topUpError}
      />
      <div style={{ marginBottom: 14 }}>
        <DashboardHeader title="Dashboard" fullName={fullName} />
      </div>

      <div className="dashboardGrid">
        <div className="dashboardStack">
          <ProfileCard
            fullName={fullName}
            roleLabel={roleLabel}
            avatarUrl={me?.avatarUrl}
            avatarFailed={avatarFailed}
            onAvatarError={() => setAvatarFailed(true)}
            onUploadAvatar={handleUploadAvatar}
            ratingLabel={rating.label}
            ratingStars={rating.stars}
            verified={me?.role === 'provider' ? !!me?.providerProfile?.verified : undefined}
          >
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
                          lc: me.providerProfile?.lc,
                          skills: me.providerProfile?.skills || [],
                          available: nextAvailable,
                          availabilityNote: me.providerProfile?.availabilityNote,
                          workImageUrls: me.providerProfile?.workImageUrls,
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

            {isProvider ? (
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const el = document.getElementById('marketplace');
                    if (!el) return;
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  View marketplace ({market.length})
                </Button>
              </div>
            ) : null}

            <div className="row" style={{ flexWrap: 'wrap' }}>
              {me?.role === 'customer' ? (
                <Link to="/services" style={{ textDecoration: 'none' }}>
                  <Button>Book a service</Button>
                </Link>
              ) : null}
              {me?.role === 'customer' ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const last = orders.find(o => o.status === 'completed');
                    if (!last) return alert('No completed orders yet.');
                    navigate('/orders/new', {
                      state: {
                        mode: 'repeat_last_service',
                        serviceKey: last.serviceKey,
                        state: last.state,
                        lga: last.lga,
                        lc: last.lc,
                        price: last.price,
                        materialsIncluded: last.materialsIncluded,
                        materialsAmount: last.materialsAmount,
                      },
                    });
                  }}
                >
                  Repeat last service
                </Button>
              ) : null}
              {me?.role === 'customer' ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const last = orders.find(o => o.status === 'completed' && !!o.providerId);
                    if (!last || !last.providerId) return alert('No completed orders with an assigned handyman yet.');
                    navigate('/orders/new', {
                      state: {
                        mode: 'rebook_handyman',
                        preferredProviderId: last.providerId,
                        serviceKey: last.serviceKey,
                        state: last.state,
                        lga: last.lga,
                        lc: last.lc,
                        price: last.price,
                        materialsIncluded: last.materialsIncluded,
                        materialsAmount: last.materialsAmount,
                      },
                    });
                  }}
                >
                  Rebook same handyman
                </Button>
              ) : null}
              <Button variant="danger" onClick={auth.logout}>
                Logout
              </Button>
            </div>

            {me?.role === 'customer' ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Bundles (shortcuts)
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/orders/new?bundle=cleaning_weekly')}
                    style={{ border: '1px solid rgba(255,255,255,0.14)' }}
                  >
                    Weekly cleaning
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/orders/new?bundle=ac_maintenance')}
                    style={{ border: '1px solid rgba(255,255,255,0.14)' }}
                  >
                    AC maintenance
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/orders/new?bundle=plumbing_checks')}
                    style={{ border: '1px solid rgba(255,255,255,0.14)' }}
                  >
                    Plumbing checks
                  </Button>
                </div>
              </div>
            ) : null}
          </ProfileCard>

          {isProvider ? <WorkSamplesGrid urls={Array.isArray(me?.providerProfile?.workImageUrls) ? me!.providerProfile!.workImageUrls! : []} /> : null}

          <WalletCard balance={Number(me?.walletBalance || 0)} onTopUp={() => setTopUpOpen(true)} />
        </div>

        <div className="dashboardStack">
          <OrdersList
            title={isProvider ? 'My jobs' : 'My orders'}
            state={state}
            errorText="Unable to load orders."
            orders={orders}
            emptyText={isProvider ? 'No assigned jobs yet.' : 'No orders yet. Book a service to get started.'}
          />

          <MarketplaceList isProvider={isProvider} orders={market} state={state} />

          <TransactionsList state={state} items={tx} />
        </div>
      </div>
    </Layout>
  );
}
