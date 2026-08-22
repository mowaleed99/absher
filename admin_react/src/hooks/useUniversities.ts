import { useState, useEffect, useCallback } from 'react';
import { University } from '../types/university';
import { apiFetch } from '../lib/apiFetch';
import { parseUniversities } from '../lib/validators';

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Record<string, unknown>>('get_universities');
      if (result.success && result.data) {
        const nested = result.data.data as Record<string, unknown> | undefined;
        const raw = nested?.universities ?? result.data.universities;
        const parsed = parseUniversities(raw);
        if (parsed) {
          setUniversities(parsed);
          return;
        }
      }

      // Fallback to get_all
      const fallback = await apiFetch<Record<string, unknown>>('get_all');
      if (fallback.success && fallback.data) {
        const parsed = parseUniversities(fallback.data.universities);
        if (parsed) {
          setUniversities(parsed);
          return;
        }
      }

      setError('Failed to parse universities');
    } catch (err) {
      console.error('[useUniversities] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const addUniversity = async (data: { name_ar: string; name_en: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_university', {
        name: data.name_ar,
        name_ar: data.name_ar,
        name_en: data.name_en,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchUniversities();
      return { success: true };
    } catch (err) {
      console.error('[useUniversities] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updateUniversity = async (data: { id: number; name_ar: string; name_en: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_university', {
        id: data.id,
        name: data.name_ar,
        name_ar: data.name_ar,
        name_en: data.name_en,
      }, {
        dedupeKey: `update_university:${data.id}`,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchUniversities();
      return { success: true };
    } catch (err) {
      console.error('[useUniversities] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteUniversity = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_university', {
        id,
      }, {
        dedupeKey: `delete_university:${id}`,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchUniversities();
      return { success: true };
    } catch (err) {
      console.error('[useUniversities] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    universities,
    isLoading,
    error,
    refetch: fetchUniversities,
    addUniversity,
    updateUniversity,
    deleteUniversity,
  };
}
