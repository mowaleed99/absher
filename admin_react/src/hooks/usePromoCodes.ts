import { useState, useEffect, useCallback } from 'react';
import { PromoCode, PromoRedemption, PromoFormInput } from '../types/promo';
import { parsePromoCodes, parsePromoRedemptions } from '../lib/validators';
import { apiFetch } from '../lib/apiFetch';

export function usePromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromoCodes = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await apiFetch<Record<string, unknown>>('get_all');
      if (res.success && res.data && res.data.promo_codes) {
        const validated = parsePromoCodes(res.data.promo_codes);
        setPromoCodes(validated || []);
      } else {
        setPromoCodes([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحميل قائمة أكواد الخصم';
      if (!silent) setError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes(false);
    const timer = setInterval(() => {
      fetchPromoCodes(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchPromoCodes]);

  const addPromoCode = async (data: PromoFormInput) => {
    const res = await apiFetch<Record<string, unknown>>('add_promo_code', data as unknown as Record<string, unknown>);
    if (!res.success) {
      throw new Error(res.error || 'فشل إنشاء كود الخصم');
    }
    await fetchPromoCodes();
    return res.data;
  };

  const updatePromoCode = async (id: number, data: PromoFormInput) => {
    const res = await apiFetch<Record<string, unknown>>('update_promo_code', { id, ...data } as unknown as Record<string, unknown>);
    if (!res.success) {
      throw new Error(res.error || 'فشل تحديث كود الخصم');
    }
    await fetchPromoCodes();
    return res.data;
  };

  const togglePromoStatus = async (id: number) => {
    const res = await apiFetch<Record<string, unknown>>('toggle_promo_code_status', { id });
    if (!res.success) {
      throw new Error(res.error || 'فشل تغيير حالة كود الخصم');
    }
    await fetchPromoCodes();
    return res.data;
  };

  const archivePromoCode = async (id: number) => {
    const res = await apiFetch<Record<string, unknown>>('archive_promo_code', { id });
    if (!res.success) {
      throw new Error(res.error || 'فشل أرشفة كود الخصم');
    }
    await fetchPromoCodes();
    return res.data;
  };

  const fetchRedemptions = useCallback(
    async (
      promoId: number,
      page = 1,
      limit = 20
    ): Promise<{ redemptions: PromoRedemption[]; total: number; totalPages: number }> => {
      const res = await apiFetch<Record<string, unknown>>('get_promo_redemptions', {
        promo_id: promoId,
        page,
        limit,
      });
      if (res.success && res.data) {
        const dataObj = res.data as {
          data?: { redemptions?: unknown[]; pagination?: { total: number; total_pages: number } };
          redemptions?: unknown[];
          pagination?: { total: number; total_pages: number };
        };
        const rawList = dataObj.data?.redemptions || dataObj.redemptions;
        const pagination = dataObj.data?.pagination || dataObj.pagination || { total: 0, total_pages: 1 };
        if (rawList && Array.isArray(rawList)) {
          const redemptions = parsePromoRedemptions(rawList) || [];
          return {
            redemptions,
            total: pagination.total || redemptions.length,
            totalPages: pagination.total_pages || 1,
          };
        }
      }
      return { redemptions: [], total: 0, totalPages: 0 };
    },
    []
  );

  return {
    promoCodes,
    isLoading,
    error,
    refresh: fetchPromoCodes,
    addPromoCode,
    updatePromoCode,
    togglePromoStatus,
    archivePromoCode,
    fetchRedemptions,
  };
}
