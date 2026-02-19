import React from 'react';
import { Layout } from '../components/Layout';
import { InlineNotice } from '../ui/Toast';
import { Button } from '../ui/Button';
import { getMe, updateProviderProfile } from '../services/me';
import { listServices, ServiceItem } from '../services/catalog';
import { NigeriaLocationSelect, NigeriaLocationValue } from '../components/NigeriaLocationSelect';

export default function ProviderSettings() {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [location, setLocation] = React.useState<NigeriaLocationValue>({ state: '', lga: '', street: '' });
  const [available, setAvailable] = React.useState(true);
  const [availabilityNote, setAvailabilityNote] = React.useState('');
  const [skills, setSkills] = React.useState<Record<string, boolean>>({});
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    setState('loading');
    Promise.all([getMe(), listServices()])
      .then(([me, svc]) => {
        setServices(svc);
        setLocation({ state: me.providerProfile?.state || '', lga: me.providerProfile?.lga || '', street: '' });
        setAvailable(me.providerProfile?.available ?? true);
        setAvailabilityNote(me.providerProfile?.availabilityNote || '');
        const map: Record<string, boolean> = {};
        for (const s of svc) map[s.key] = (me.providerProfile?.skills || []).includes(s.key);
        setSkills(map);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  async function save() {
    setMsg(null);
    if (!location.state || !location.lga) {
      setMsg({ kind: 'error', text: 'Please select your State and LGA.' });
      return;
    }
    setSaving(true);
    try {
      const selected = Object.entries(skills)
        .filter(([, v]) => v)
        .map(([k]) => k);
      await updateProviderProfile({
        country: 'Nigeria',
        state: location.state,
        lga: location.lga,
        skills: selected,
        available,
        availabilityNote,
      });
      setMsg({ kind: 'success', text: 'Saved handyman settings.' });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err?.response?.data?.message || 'Unable to save settings' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardInner">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Handyman settings</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Marketplace matching uses your Country + State + LGA + selected skills. Availability is a simple toggle for v1.
            </p>

            {state === 'error' ? <InlineNotice kind="error">Unable to load settings.</InlineNotice> : null}
            {msg ? <InlineNotice kind={msg.kind}>{msg.text}</InlineNotice> : null}
            {state === 'loading' ? <span className="muted">Loading…</span> : null}

            {state === 'ready' ? (
              <div className="col" style={{ marginTop: 12 }}>
                <NigeriaLocationSelect value={location} onChange={setLocation} showStreet={false} />

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Availability note</span>
                  <input
                    value={availabilityNote}
                    onChange={e => setAvailabilityNote(e.target.value)}
                    placeholder="e.g. Weekdays after 5pm"
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

                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>Skills</div>
                  <div className="col" style={{ gap: 8 }}>
                    {services.map(s => (
                      <label
                        key={s.key}
                        className="row"
                        style={{
                          justifyContent: 'space-between',
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(0,0,0,0.12)',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        <div>
                          <strong>{s.name}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {s.description}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!skills[s.key]}
                          onChange={e => setSkills(prev => ({ ...prev, [s.key]: e.target.checked }))}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <Button loading={saving} onClick={save}>
                    Save
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="pill" style={{ marginBottom: 10 }}>
              Matching rules (v1)
            </div>
            <ol className="muted" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
              <li>Order must be unassigned and “requested”</li>
              <li>Order Country + State + LGA must match your profile</li>
              <li>Order service must be one of your skills</li>
              <li>If you’re unavailable, you’ll see no jobs</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}
