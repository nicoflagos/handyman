import React, { useMemo } from 'react';
import NaijaStates from 'naija-state-local-government';

type NigeriaLocationValue = {
  state: string;
  lga: string;
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
  const stateOptions = useMemo(() => NaijaStates.states().map(s => s.state).sort((a, b) => a.localeCompare(b)), []);

  const lgaOptions = useMemo(() => {
    if (!value.state) return [];
    return NaijaStates.lgas(value.state).slice().sort((a, b) => a.localeCompare(b));
  }, [value.state]);

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
          onChange={e => onChange({ state: e.target.value, lga: '', street: '' })}
          style={controlStyle}
          aria-label="State"
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
          onChange={e => onChange({ ...value, lga: e.target.value, street: '' })}
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

      {showStreet ? (
        <label style={labelStyle}>
          <span style={labelTextStyle}>Street</span>
          <input
            value={value.street}
            onChange={e => onChange({ ...value, street: e.target.value })}
            style={controlStyle}
            placeholder={value.lga ? 'Type street address…' : 'Select an LGA first…'}
            disabled={!value.lga}
            aria-label="Street"
          />
        </label>
      ) : null}
    </div>
  );
}

export type { NigeriaLocationValue };
