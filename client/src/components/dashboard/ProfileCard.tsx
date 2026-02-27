import React from 'react';
import { Button } from '../../ui/Button';
import { assetUrl } from '../../lib/assetUrl';

export function ProfileCard({
  fullName,
  roleLabel,
  avatarUrl,
  avatarFailed,
  onAvatarError,
  onUploadAvatar,
  ratingLabel,
  ratingStars,
  children,
}: {
  fullName: string;
  roleLabel: string;
  avatarUrl?: string;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  ratingLabel?: string;
  ratingStars?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="cardInner">
        <div className="row" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{fullName}</div>
            <div className="pill" style={{ marginTop: 8 }}>
              {roleLabel}
            </div>
            {ratingLabel && ratingStars ? (
              <div className="pill" style={{ marginTop: 10 }} title={ratingLabel}>
                Rating: {ratingStars}
              </div>
            ) : null}
          </div>

          {avatarUrl && !avatarFailed ? (
            <img
              src={assetUrl(avatarUrl)}
              alt="Profile"
              style={{
                width: 88,
                height: 88,
                borderRadius: 999,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
              onError={onAvatarError}
            />
          ) : (
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.12)',
              }}
            />
          )}
        </div>

        <div className="col" style={{ marginTop: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>Profile picture</span>
            <input
              type="file"
              accept="image/*"
              onChange={async e => {
                const inputEl = e.currentTarget;
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await onUploadAvatar(file);
                } finally {
                  if (inputEl) inputEl.value = '';
                }
              }}
            />
          </label>

          {children ? <div style={{ marginTop: 10 }}>{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

