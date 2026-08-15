import { useState, useEffect, useCallback } from 'react';
import { Apartment } from '../types/apartment';
import { apiFetch } from '../lib/apiFetch';
import { parseApartments } from '../lib/validators';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all apartments (initial load using get_all)
  const fetchApartments = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Record<string, unknown>>('get_all');
      if (!result.success) {
        setError(result.error);
        return;
      }

      // get_all returns apartments as top-level key
      const parsed = parseApartments(result.data.apartments);
      if (parsed) {
        setApartments(parsed);
      } else {
        setError('Unexpected apartments format from server.');
      }
    } catch (err) {
      console.error('[useApartments] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Post-mutation refresh (using get_apartments or get_all)
  const refreshApartments = useCallback(async () => {
    try {
      const result = await apiFetch<Record<string, unknown>>('get_apartments');
      if (result.success) {
        const nested = result.data.data as Record<string, unknown> | undefined;
        const raw = nested?.apartments ?? result.data.apartments;
        const parsed = parseApartments(raw);
        if (parsed) {
          setApartments(parsed);
          return;
        }
      }
      // Fallback to get_all if get_apartments format differs
      await fetchApartments();
    } catch {
      await fetchApartments();
    }
  }, [fetchApartments]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  // Add apartment mutation
  const addApartment = async (payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
    const result = await apiFetch<Record<string, unknown>>('add_apartment', payload);
    if (result.success) {
      await refreshApartments();
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Update apartment mutation
  const updateApartment = async (payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
    const aptId = payload.id;
    const result = await apiFetch<Record<string, unknown>>('update_apartment', payload, {
      dedupeKey: `update_apartment:${aptId}`,
    });
    if (result.success) {
      await refreshApartments();
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Delete apartment mutation
  const deleteApartment = async (id: number, confirmDeleteOffers = false): Promise<{ success: boolean; requiresConfirmation?: boolean; message?: string; error?: string }> => {
    const body: Record<string, unknown> = { id };
    if (confirmDeleteOffers) {
      body.confirm_delete_offers = true;
    }

    const result = await apiFetch<Record<string, unknown>>('delete_apartment', body, {
      dedupeKey: `delete_apartment:${id}`,
    });

    if (result.success) {
      await refreshApartments();
      return { success: true };
    }

    // Check if server returned warning requiring confirmation
    const rawData = result as unknown as { data?: { status?: string; requires_confirmation?: boolean; message?: string } };
    if (rawData.data?.status === 'warning' && rawData.data.requires_confirmation) {
      return {
        success: false,
        requiresConfirmation: true,
        message: rawData.data.message,
      };
    }

    return { success: false, error: result.error };
  };

  return {
    apartments,
    isLoading,
    error,
    refetch: fetchApartments,
    refresh: refreshApartments,
    addApartment,
    updateApartment,
    deleteApartment,
  };
}
