// src/config/api.ts
// VITE_API_ROOT is an absolute origin-relative path:
// - '/api_staging' in development and staging
// - '/api' in production
const API_ROOT = import.meta.env.VITE_API_ROOT;

if (!API_ROOT) {
  throw new Error('[config] VITE_API_ROOT is not defined. Check your .env file.');
}

export const ADMIN_API_URL = `${API_ROOT}/admin_api.php`;
export const ADMIN_LOGIN_URL = `${API_ROOT}/admin/login.php`;
export const ADMIN_CHAT_REPLY_URL = `${API_ROOT}/chat/admin_reply.php`;
export const UPLOAD_IMAGE_URL = `${API_ROOT}/upload/image.php`;

/**
 * Resolves an image URL to an absolute path for display in the browser.
 * In development, Vite proxies /uploads_staging/ to the server.
 * In staging, /uploads_staging/ is served by Apache.
 * In production, /uploads/ is served by Apache.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // Strip any leading slashes or ../ prefixes
  const clean = url.replace(/^(\.\.\/|\/)+/, '');
  return `/${clean}`;
}
