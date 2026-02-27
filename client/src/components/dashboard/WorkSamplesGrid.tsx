import React from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/assetUrl';
import { Button } from '../../ui/Button';

export function WorkSamplesGrid({ urls }: { urls: string[] }) {
  if (!Array.isArray(urls) || urls.length === 0) return null;
  return (
    <div className="card">
      <div className="cardInner">
        <div className="pill" style={{ marginBottom: 10 }}>
          Work samples
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {urls.slice(0, 4).map((u, idx) => (
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
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <Link to="/provider/settings" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Edit work samples</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

