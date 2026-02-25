const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function assetUrl(input?: string | null) {
  const url = String(input || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

