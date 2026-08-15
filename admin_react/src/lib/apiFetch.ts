// src/lib/apiFetch.ts
import { ADMIN_API_URL } from '../config/api';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Optional options bag — caller supplies a dedupeKey only when needed
export type ApiFetchOptions = {
  dedupeKey?: string;
};

const inFlight = new Set<string>();

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

  // API-level dedupe: only active when caller passes an explicit dedupeKey.
  // Primary double-submit protection is the form-level isSubmitting flag.
  const { dedupeKey } = options ?? {};
  let acquired = false;

  if (method !== 'GET' && dedupeKey) {
    if (inFlight.has(dedupeKey)) {
      console.warn('[apiFetch] Blocked duplicate in-flight request:', dedupeKey);
      return { success: false, error: 'Request already in progress.' };
    }
    inFlight.add(dedupeKey);
    acquired = true;
  }

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
      // Return the FULL payload as T — no extraction here.
      // Each hook extracts the correct field based on its action's specific envelope.
      return { success: true, data: payload as unknown as T };
    }

    return { success: false, error: (payload.message as string) || 'Operation failed.' };

  } catch (err) {
    // Network failure (offline, DNS, timeout, fetch threw)
    console.error('[apiFetch] Network error:', err);
    return { success: false, error: 'Network error. Please check your connection.' };
  } finally {
    if (acquired && dedupeKey) {
      inFlight.delete(dedupeKey);
    }
  }
}
