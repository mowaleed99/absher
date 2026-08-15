import { useState, useEffect, useCallback } from 'react';
import { HousingOffer, HousingOfferFormInput } from '../types/offer';
import { parseHousingOffers } from '../lib/validators';
import { apiFetch } from '../lib/apiFetch';

export function useHousingOffers() {
  const [offers, setOffers] = useState<HousingOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Record<string, unknown>>('get_all');
      if (res.success && res.data && res.data.housing_offers) {
        const validated = parseHousingOffers(res.data.housing_offers);
        setOffers(validated || []);
      } else {
        setOffers([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحميل عروض السكن';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const addOffer = async (data: HousingOfferFormInput) => {
    const res = await apiFetch<Record<string, unknown>>('add_housing_offer', data as unknown as Record<string, unknown>);
    if (!res.success) {
      throw new Error(res.error || 'فشل إضافة عرض السكن');
    }
    await fetchOffers();
    return res.data;
  };

  const updateOffer = async (id: number, data: Partial<HousingOfferFormInput>) => {
    const res = await apiFetch<Record<string, unknown>>('update_housing_offer', { id, ...data } as unknown as Record<string, unknown>);
    if (!res.success) {
      throw new Error(res.error || 'فشل تحديث عرض السكن');
    }
    await fetchOffers();
    return res.data;
  };

  const deleteOffer = async (id: number) => {
    const res = await apiFetch<Record<string, unknown>>('delete_housing_offer', { id });
    if (!res.success) {
      throw new Error(res.error || 'فشل حذف عرض السكن');
    }
    await fetchOffers();
    return res.data;
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    const nextActive = currentActive ? 0 : 1;
    const res = await apiFetch<Record<string, unknown>>('update_housing_offer', {
      id,
      is_active: nextActive,
    });
    if (!res.success) {
      throw new Error(res.error || 'فشل تغيير حالة العرض');
    }
    await fetchOffers();
    return res.data;
  };

  const reorderOffers = async (orders: { id: number; display_order: number }[]) => {
    const res = await apiFetch<Record<string, unknown>>('reorder_housing_offers', { orders });
    if (!res.success) {
      throw new Error(res.error || 'فشل حفظ ترتيب العروض');
    }
    await fetchOffers();
    return res.data;
  };

  return {
    offers,
    isLoading,
    error,
    fetchOffers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleActive,
    reorderOffers,
  };
}
