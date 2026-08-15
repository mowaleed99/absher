/**
 * Centralized Media & Image URL Resolver
 *
 * Normalizes relative backend upload paths (e.g. "uploads_staging/img_123.jpg" or "uploads/img_123.jpg")
 * to absolute root paths (e.g. "/uploads_staging/img_123.jpg") so they resolve correctly
 * from any SPA route (e.g. /admin_v2/services, /admin_v2/apartments) without 404s.
 */

export function getMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs (Base64 previews)
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // 2. Blob URLs (Object URLs created in browser)
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 3. Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 4. Strip any leading slashes or ../ prefixes and prepend single root slash
  const clean = trimmed.replace(/^(\.\.\/|\/)+/, '');
  return `/${clean}`;
}

export const resolveImageUrl = getMediaUrl;

export function hasMedia(url: string | null | undefined): boolean {
  return Boolean(url && typeof url === 'string' && url.trim().length > 0);
}
