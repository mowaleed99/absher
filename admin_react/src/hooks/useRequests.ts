import { useState, useEffect, useCallback } from 'react';
import { ServiceRequest } from '../types/request';
import { apiFetch } from '../lib/apiFetch';
import { parseRequests } from '../lib/validators';
import { useBadges } from '../contexts/BadgesContext';

export function useRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { refetchBadges } = useBadges();

  const fetchRequests = useCallback(async () => {
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

      const parsed = parseRequests(result.data.requests);
      if (parsed) {
        setRequests(parsed);
      } else {
        setError('Failed to parse service requests');
      }
    } catch (err) {
      console.error('[useRequests] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateRequestStatus = async (
    id: number,
    status: string,
    cancellationReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: Record<string, unknown> = { id, status };
      if (status === 'ملغي' && cancellationReason) {
        payload.cancellation_reason = cancellationReason;
      }

      const result = await apiFetch<Record<string, unknown>>('update_request_status', payload);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                ...(status === 'ملغي' ? { cancellation_reason: cancellationReason, refund_status: 'refunded' } : {}),
              }
            : r
        )
      );
      refetchBadges();
      return { success: true };
    } catch (err) {
      console.error('[useRequests] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteRequest = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_request', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
      refetchBadges();
      return { success: true };
    } catch (err) {
      console.error('[useRequests] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
    updateRequestStatus,
    deleteRequest,
  };
}
