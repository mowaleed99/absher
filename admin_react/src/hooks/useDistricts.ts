import { useState, useEffect, useCallback } from 'react';
import { District } from '../types/district';
import { apiFetch } from '../lib/apiFetch';
import { parseDistricts } from '../lib/validators';

export function useDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDistricts = useCallback(async () => {
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

      const parsed = parseDistricts(result.data.districts);
      if (parsed) {
        setDistricts(parsed);
      } else {
        setError('Failed to parse districts');
      }
    } catch (err) {
      console.error('[useDistricts] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const addDistrict = async (data: { name_ar: string; name_en: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_district', {
        name: data.name_ar,
        name_ar: data.name_ar,
        name_en: data.name_en,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchDistricts();
      return { success: true };
    } catch (err) {
      console.error('[useDistricts] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updateDistrict = async (data: { id: number; name_ar: string; name_en: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_district', {
        id: data.id,
        name: data.name_ar,
        name_ar: data.name_ar,
        name_en: data.name_en,
      }, {
        dedupeKey: `update_district:${data.id}`,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchDistricts();
      return { success: true };
    } catch (err) {
      console.error('[useDistricts] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteDistrict = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_district', {
        id,
      }, {
        dedupeKey: `delete_district:${id}`,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchDistricts();
      return { success: true };
    } catch (err) {
      console.error('[useDistricts] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    districts,
    isLoading,
    error,
    refetch: fetchDistricts,
    addDistrict,
    updateDistrict,
    deleteDistrict,
  };
}
