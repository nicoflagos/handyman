import React, { useEffect, useMemo, useState } from 'react';

type NigeriaLocationValue = {
  state: string;
  lga: string;
  lc: string;
  street: string;
};

type NigeriaLocationSelectProps = {
  value: NigeriaLocationValue;
  onChange: (next: NigeriaLocationValue) => void;
  showStreet?: boolean;
};

const labelStyle: React.CSSProperties = { display: 'grid', gap: 6 };
const labelTextStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(255,255,255,0.78)' };
const controlStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(0,0,0,0.18)',
  color: 'rgba(255,255,255,0.92)',
  outline: 'none',
};

export function NigeriaLocationSelect({ value, onChange, showStreet = true }: NigeriaLocationSelectProps) {
  const [data, setData] = useState<Record<string, Record<string, string[]>> | null>(null);

  useEffect(() => {
    let mounted = true;
    import('../data/ng-state-lga-lc.json')
      .then(m => {
        const next = (m as any)?.default || (m as any);
        if (mounted) setData(next as any);
      })
      .catch(() => {
        if (mounted) setData({});
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stateOptions = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).slice().sort((a, b) => a.localeCompare(b));
  }, [data]);

  const lgaOptions = useMemo(() => {
    if (!data) return [];
    if (!value.state) return [];
    try {
      const byLga = data[value.state] as Record<string, any> | undefined;
      return Object.keys(byLga || {}).slice().sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }, [data, value.state]);

  const lcOptions = useMemo(() => {
    if (!data) return [];
    if (!value.state || !value.lga) return [];
    try {
      const byLga = data[value.state] as Record<string, any> | undefined;
      const lcs = (byLga && Array.isArray((byLga as any)[value.lga]) ? (byLga as any)[value.lga] : []) as string[];
      return lcs.slice().sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }, [data, value.lga, value.state]);

  return (
    <div className="grid2">
      <label style={labelStyle}>
        <span style={labelTextStyle}>Country</span>
        <select value="Nigeria" disabled style={controlStyle} aria-label="Country">
          <option value="Nigeria">Nigeria</option>
        </select>
      </label>

      <label style={labelStyle}>
        <span style={labelTextStyle}>State</span>
        <select
          value={value.state}
          onChange={e => onChange({ state: e.target.value, lga: '', lc: '', street: '' })}
          style={controlStyle}
          aria-label="State"
          disabled={!data}
        >
          <option value="" disabled>
            Select a state…
          </option>
          {stateOptions.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Local Government (LGA)</span>
        <select
          value={value.lga}
          onChange={e => onChange({ ...value, lga: e.target.value, lc: '', street: '' })}
          style={controlStyle}
          aria-label="Local Government"
          disabled={!value.state}
        >
          <option value="" disabled>
            {value.state ? 'Select an LGA…' : 'Select a state first…'}
          </option>
          {lgaOptions.map(lga => (
            <option key={lga} value={lga}>
              {lga}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Local Council (LC)</span>
        <select
          value={value.lc}
          onChange={e => onChange({ ...value, lc: e.target.value, street: '' })}
          style={controlStyle}
          aria-label="Local Council"
          disabled={!value.lga}
        >
          <option value="" disabled>
            {value.lga ? 'Select an LC…' : 'Select an LGA first…'}
          </option>
          {lcOptions.map(lc => (
            <option key={lc} value={lc}>
              {lc}
            </option>
          ))}
        </select>
      </label>

      {showStreet ? (
        <label style={labelStyle}>
          <span style={labelTextStyle}>Street</span>
          <input
            value={value.street}
            onChange={e => onChange({ ...value, street: e.target.value })}
            style={controlStyle}
            placeholder={value.lc ? 'Type street address…' : 'Select an LC first…'}
            disabled={!value.lc}
            aria-label="Street"
          />
        </label>
      ) : null}
    </div>
  );
}

export type { NigeriaLocationValue };
