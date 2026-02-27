import React from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/assetUrl';
import { Button } from '../../ui/Button';

export function WorkSamplesGrid({ urls }: { urls: string[] }) {
  const items = Array.isArray(urls) ? urls : [];
  return (
    <div className="card">
      <div className="cardInner">
        <div className="pill" style={{ marginBottom: 10 }}>
          Work samples
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, idx) => {
            const u = items[idx];
            return u ? (
              <a key={`${u}-${idx}`} href={assetUrl(u)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <img
                  src={assetUrl(u)}
                  alt={`Work ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: 86,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                />
              </a>
            ) : (
              <div
                key={`empty-${idx}`}
                className="muted"
                style={{
                  width: '100%',
                  height: 86,
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.10)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
                }}
              >
                Empty
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10 }}>
          <Link to="/provider/settings" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">{items.length ? 'Edit work samples' : 'Add work samples'}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
