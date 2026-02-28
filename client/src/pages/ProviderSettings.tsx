import React from 'react';
import { Layout } from '../components/Layout';
import { InlineNotice } from '../ui/Toast';
import { Button } from '../ui/Button';
import { getMe, removeWorkImage, updateProviderProfile, uploadProviderIdImage, uploadProviderPassport, uploadWorkImage } from '../services/me';
import { listServices, ServiceItem } from '../services/catalog';
import { NigeriaLocationSelect, NigeriaLocationValue } from '../components/NigeriaLocationSelect';
import { assetUrl } from '../lib/assetUrl';

export default function ProviderSettings() {
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [location, setLocation] = React.useState<NigeriaLocationValue>({ state: '', lga: '', lc: '', street: '' });
  const [available, setAvailable] = React.useState(true);
  const [availabilityNote, setAvailabilityNote] = React.useState('');
  const [skills, setSkills] = React.useState<Record<string, boolean>>({});
  const [workImageUrls, setWorkImageUrls] = React.useState<string[]>([]);
  const [workBusy, setWorkBusy] = React.useState(false);
  const workFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [profileAddress, setProfileAddress] = React.useState('');
  const [idType, setIdType] = React.useState<'nin' | 'voters_card' | ''>('');
  const [idNumber, setIdNumber] = React.useState('');
  const [passportPhotoUrl, setPassportPhotoUrl] = React.useState('');
  const [idImageUrl, setIdImageUrl] = React.useState('');
  const [profileBusy, setProfileBusy] = React.useState(false);
  const passportInputRef = React.useRef<HTMLInputElement | null>(null);
  const idImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const [profileErr, setProfileErr] = React.useState<string | null>(null);

  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    setState('loading');
    Promise.all([getMe(), listServices()])
      .then(([me, svc]) => {
        setServices(svc);
        setLocation({
          state: me.providerProfile?.state || '',
          lga: me.providerProfile?.lga || '',
          lc: me.providerProfile?.lc || '',
          street: '',
        });
        setAvailable(me.providerProfile?.available ?? true);
        setAvailabilityNote(me.providerProfile?.availabilityNote || '');
        setWorkImageUrls(Array.isArray(me.providerProfile?.workImageUrls) ? me.providerProfile!.workImageUrls! : []);
        setProfileAddress(me.providerProfile?.address || '');
        setIdType((me.providerProfile?.idType as any) || '');
        setIdNumber(me.providerProfile?.idNumber || '');
        setPassportPhotoUrl(me.providerProfile?.passportPhotoUrl || '');
        setIdImageUrl(me.providerProfile?.idImageUrl || '');
        const map: Record<string, boolean> = {};
        for (const s of svc) map[s.key] = (me.providerProfile?.skills || []).includes(s.key);
        setSkills(map);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  async function uploadWork(file: File) {
    setMsg(null);
    setWorkBusy(true);
    try {
      const me = await uploadWorkImage(file);
      setWorkImageUrls(Array.isArray(me.providerProfile?.workImageUrls) ? me.providerProfile!.workImageUrls! : []);
      setMsg({ kind: 'success', text: 'Work image uploaded.' });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err?.response?.data?.message || 'Unable to upload work image' });
    } finally {
      setWorkBusy(false);
    }
  }

  async function removeWork(url: string) {
    setMsg(null);
    setWorkBusy(true);
    try {
      const me = await removeWorkImage(url);
      setWorkImageUrls(Array.isArray(me.providerProfile?.workImageUrls) ? me.providerProfile!.workImageUrls! : []);
      setMsg({ kind: 'success', text: 'Work image removed.' });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err?.response?.data?.message || 'Unable to remove work image' });
    } finally {
      setWorkBusy(false);
    }
  }

  function validateProfile(): string | null {
    if (!profileAddress.trim()) return 'Address is required';
    if (!idType) return 'ID type is required';
    const cleaned = idNumber.trim().replace(/[\s-]/g, '');
    if (!cleaned) return 'ID number is required';
    if (idType === 'nin' && !/^\d{11}$/.test(cleaned)) return 'NIN must be exactly 11 digits';
    if (idType === 'voters_card' && !/^[A-Z0-9]{19}$/i.test(cleaned)) return 'Voters Card must be exactly 19 characters';
    if (!passportPhotoUrl) return 'Passport photo is required';
    if (!idImageUrl) return 'ID image is required';
    return null;
  }

  async function saveProfile() {
    setProfileErr(null);
    const err = validateProfile();
    if (err) return setProfileErr(err);

    setProfileBusy(true);
    setMsg(null);
    try {
      const selected = Object.entries(skills)
        .filter(([, v]) => v)
        .map(([k]) => k);
      await updateProviderProfile({
        country: 'Nigeria',
        state: location.state,
        lga: location.lga,
        lc: location.lc,
        skills: selected,
        available,
        availabilityNote,
        workImageUrls,
        address: profileAddress.trim(),
        idType: idType as any,
        idNumber: idNumber.trim(),
      });
      setMsg({ kind: 'success', text: 'Profile updated.' });
    } catch (err: any) {
      setProfileErr(err?.response?.data?.message || 'Unable to update profile');
    } finally {
      setProfileBusy(false);
    }
  }

  async function save() {
    setMsg(null);
    if (!location.state || !location.lga || !location.lc) {
      setMsg({ kind: 'error', text: 'Please select your State, LGA, and Local Council.' });
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
        lc: location.lc,
        skills: selected,
        available,
        availabilityNote,
        workImageUrls,
        address: profileAddress.trim() || undefined,
        idType: (idType as any) || undefined,
        idNumber: idNumber.trim() || undefined,
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
              Marketplace matching uses your Country + State + LGA + LC + selected skills. Availability is a simple toggle for v1.
            </p>

            {state === 'error' ? <InlineNotice kind="error">Unable to load settings.</InlineNotice> : null}
            {msg ? <InlineNotice kind={msg.kind}>{msg.text}</InlineNotice> : null}
            {state === 'loading' ? <span className="muted">Loading…</span> : null}

            {state === 'ready' ? (
              <div className="col" style={{ marginTop: 12 }}>
                <NigeriaLocationSelect value={location} onChange={setLocation} showStreet={false} />

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>Profile verification</div>
                  {profileErr ? <InlineNotice kind="error">{profileErr}</InlineNotice> : null}

                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Address</span>
                    <input
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      placeholder="Your full address"
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

                  <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    <label style={{ display: 'grid', gap: 6, flex: 1, minWidth: 220 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>ID type</span>
                      <select
                        value={idType}
                        onChange={e => setIdType(e.target.value as any)}
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
                        <option value="">Select</option>
                        <option value="nin">NIN</option>
                        <option value="voters_card">Voters card</option>
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: 6, flex: 1, minWidth: 220 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>ID number</span>
                      <input
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                        placeholder={idType === 'nin' ? '11 digits' : idType === 'voters_card' ? '19 characters' : ''}
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
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <input
                      ref={passportInputRef}
                      type="file"
                      accept="image/*"
                      disabled={profileBusy}
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;
                        setProfileBusy(true);
                        setProfileErr(null);
                        try {
                          const updated = await uploadProviderPassport(file);
                          setPassportPhotoUrl(updated.providerProfile?.passportPhotoUrl || '');
                          setMsg({ kind: 'success', text: 'Passport photo uploaded.' });
                        } catch (err: any) {
                          setProfileErr(err?.response?.data?.message || 'Unable to upload passport photo');
                        } finally {
                          setProfileBusy(false);
                        }
                      }}
                    />

                    <input
                      ref={idImageInputRef}
                      type="file"
                      accept="image/*"
                      disabled={profileBusy}
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;
                        setProfileBusy(true);
                        setProfileErr(null);
                        try {
                          const updated = await uploadProviderIdImage(file);
                          setIdImageUrl(updated.providerProfile?.idImageUrl || '');
                          setMsg({ kind: 'success', text: 'ID image uploaded.' });
                        } catch (err: any) {
                          setProfileErr(err?.response?.data?.message || 'Unable to upload ID image');
                        } finally {
                          setProfileBusy(false);
                        }
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                      <div className="landingCard">
                        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                          Passport photo
                        </div>
                        {passportPhotoUrl ? (
                          <img
                            src={assetUrl(passportPhotoUrl)}
                            alt="Passport"
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }}
                          />
                        ) : (
                          <div
                            className="muted"
                            style={{
                              height: 120,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 12,
                              border: '1px dashed rgba(255,255,255,0.18)',
                            }}
                          >
                            Not uploaded
                          </div>
                        )}
                        <div style={{ marginTop: 10 }}>
                          <Button variant="ghost" loading={profileBusy} onClick={() => passportInputRef.current?.click()}>
                            {passportPhotoUrl ? 'Replace' : 'Upload'}
                          </Button>
                        </div>
                      </div>

                      <div className="landingCard">
                        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                          ID image
                        </div>
                        {idImageUrl ? (
                          <img src={assetUrl(idImageUrl)} alt="ID" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} />
                        ) : (
                          <div
                            className="muted"
                            style={{
                              height: 120,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 12,
                              border: '1px dashed rgba(255,255,255,0.18)',
                            }}
                          >
                            Not uploaded
                          </div>
                        )}
                        <div style={{ marginTop: 10 }}>
                          <Button variant="ghost" loading={profileBusy} onClick={() => idImageInputRef.current?.click()}>
                            {idImageUrl ? 'Replace' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                      <Button loading={profileBusy} onClick={saveProfile}>
                        Update profile
                      </Button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>Work images (up to 4)</div>
                  <input
                    ref={workFileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={workBusy}
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = '';
                      if (!file) return;
                      void uploadWork(file);
                    }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const url = workImageUrls[idx];
                      return (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(0,0,0,0.12)',
                            borderRadius: 12,
                            padding: 10,
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          {url ? (
                            <img
                              src={assetUrl(url)}
                              alt={`Work ${idx + 1}`}
                              style={{ width: '100%', height: 86, objectFit: 'cover', borderRadius: 10 }}
                            />
                          ) : (
                            <div
                              className="muted"
                              style={{
                                width: '100%',
                                height: 86,
                                borderRadius: 10,
                                border: '1px dashed rgba(255,255,255,0.18)',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 13,
                              }}
                            >
                              Empty
                            </div>
                          )}

                          {url ? (
                            <Button variant="ghost" onClick={() => removeWork(url)} loading={workBusy}>
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              loading={workBusy}
                              disabled={workBusy}
                              onClick={() => {
                                workFileInputRef.current?.click();
                              }}
                            >
                              Upload
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                    Customers will see these after you accept an order.
                  </div>
                </div>

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
              <li>Order Country + State + LGA + LC must match your profile</li>
              <li>Order service must be one of your skills</li>
              <li>If you’re unavailable, you’ll see no jobs</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}
