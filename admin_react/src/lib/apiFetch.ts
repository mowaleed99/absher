// src/lib/apiFetch.ts
import { ADMIN_API_URL } from '../config/api';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Optional options bag — caller supplies a dedupeKey only when needed
export type ApiFetchOptions = {
  dedupeKey?: string;
  skipCache?: boolean;
};

const inFlightMutations = new Set<string>();
const inFlightGetPromises = new Map<string, Promise<ApiResponse<unknown>>>();
const getCache = new Map<string, { timestamp: number; data: unknown }>();

const GET_CACHE_TTL_MS = 4000; // 4 seconds short-lived memory cache for GET requests

export function clearApiGetCache() {
  getCache.clear();
}

export async function apiFetch<T>(
  action: string,
  body?: Record<string, unknown>,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('adminToken');

  // If no token exists, fail synchronously without triggering 401 logout cascades
  if (!token) {
    return { success: false, error: 'Authentication required.' };
  }

  const method = body ? 'POST' : 'GET';
  const cacheKey = `${action}:${token.slice(-10)}`;

  // 1. Check GET memory cache if not skipped
  if (method === 'GET' && !options?.skipCache) {
    const cached = getCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
      return { success: true, data: cached.data as T };
    }

    // Check if an identical GET request is currently in-flight
    if (inFlightGetPromises.has(cacheKey)) {
      return (await inFlightGetPromises.get(cacheKey)!) as ApiResponse<T>;
    }
  }

  // 2. Double-submit protection for POST mutations
  const { dedupeKey } = options ?? {};
  let acquiredMutation = false;

  if (method !== 'GET') {
    // Invalidate GET cache on mutations to ensure fresh reads
    getCache.clear();

    if (dedupeKey) {
      if (inFlightMutations.has(dedupeKey)) {
        console.warn('[apiFetch] Blocked duplicate in-flight request:', dedupeKey);
        return { success: false, error: 'Request already in progress.' };
      }
      inFlightMutations.add(dedupeKey);
      acquiredMutation = true;
    }
  }

  // Define actual fetch execution
  const executeFetch = async (): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${ADMIN_API_URL}?action=${encodeURIComponent(action)}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      // 401 → wipe token, fire logout event (AuthContext listens and shows overlay)
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.dispatchEvent(new Event('auth:logout'));
        return { success: false, error: 'Session expired. Please log in again.' };
      }

      // Non-2xx (500, 403, etc.) — PHP may return HTML; don't attempt .json()
      if (!res.ok) {
        const text = await res.text();
        console.error(`[apiFetch] HTTP ${res.status}:`, text.slice(0, 200));
        return { success: false, error: `Server error (HTTP ${res.status})` };
      }

      // Read as text first — PHP errors can return 200 with HTML body
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('[apiFetch] Non-JSON response:', text.slice(0, 200));
        return { success: false, error: 'Unexpected server response (not JSON).' };
      }

      if (typeof json !== 'object' || json === null) {
        return { success: false, error: 'Malformed API response.' };
      }

      const payload = json as Record<string, unknown>;
      if (payload.status === 'success' || payload.success === true) {
        if (method === 'GET') {
          getCache.set(cacheKey, { timestamp: Date.now(), data: payload });
        }
        return { success: true, data: payload as unknown as T };
      }

      return { success: false, error: (payload.message as string) || 'Operation failed.' };
    } catch (err) {
      console.error('[apiFetch] Network error:', err);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      if (acquiredMutation && dedupeKey) {
        inFlightMutations.delete(dedupeKey);
      }
      if (method === 'GET') {
        inFlightGetPromises.delete(cacheKey);
      }
    }
  };

  if (method === 'GET') {
    const promise = executeFetch();
    inFlightGetPromises.set(cacheKey, promise as Promise<ApiResponse<unknown>>);
    return promise;
  }

  return executeFetch();
}
