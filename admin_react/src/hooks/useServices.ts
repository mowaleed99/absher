import { useState, useEffect, useCallback } from 'react';
import { Service, ServiceFormData } from '../types/service';
import { apiFetch } from '../lib/apiFetch';
import { parseServices } from '../lib/validators';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
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

      const parsed = parseServices(result.data.services);
      if (parsed) {
        setServices(parsed);
      } else {
        setError('Failed to parse services');
      }
    } catch (err) {
      console.error('[useServices] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (data: ServiceFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_service', {
        title_ar: data.title_ar,
        title_en: data.title_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
        image_url: data.image_url,
        has_form: data.has_form,
        price_points: data.price_points,
        price_cash: data.price_cash ?? 0,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchServices();
      return { success: true };
    } catch (err) {
      console.error('[useServices] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updateService = async (data: { id: number } & ServiceFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_service', {
        id: data.id,
        title_ar: data.title_ar,
        title_en: data.title_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
        image_url: data.image_url,
        has_form: data.has_form,
        price_points: data.price_points,
        price_cash: data.price_cash ?? 0,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchServices();
      return { success: true };
    } catch (err) {
      console.error('[useServices] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteService = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_service', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      console.error('[useServices] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    services,
    isLoading,
    error,
    refetch: fetchServices,
    addService,
    updateService,
    deleteService,
  };
}
