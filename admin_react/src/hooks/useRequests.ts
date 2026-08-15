import { useState, useEffect, useCallback } from 'react';
import { ServiceRequest, UpdateStatusPayload } from '../types/request';
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
    const interval = setInterval(() => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      apiFetch<Record<string, unknown>>('get_all').then((result) => {
        if (result.success && result.data) {
          const parsed = parseRequests(result.data.requests);
          if (parsed) {
            setRequests(parsed);
          }
        }
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const updateRequestStatus = async (
    idOrPayload: number | UpdateStatusPayload,
    statusParam?: string,
    cancellationReasonParam?: string,
    customMessageParam?: string,
    sendChatParam?: boolean,
    msgLangParam?: 'ar' | 'en' | 'both'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let id: number;
      let status: string;
      let cancellationReason: string | undefined;
      let customMessage: string | undefined;
      let sendChat: boolean | undefined;
      let msgLang: 'ar' | 'en' | 'both' | undefined;

      if (typeof idOrPayload === 'object') {
        id = idOrPayload.id;
        status = idOrPayload.status;
        cancellationReason = idOrPayload.cancellationReason;
        customMessage = idOrPayload.customMessage;
        sendChat = idOrPayload.sendChat;
        msgLang = idOrPayload.msgLang;
      } else {
        id = idOrPayload;
        status = statusParam || 'مكتمل';
        cancellationReason = cancellationReasonParam;
        customMessage = customMessageParam;
        sendChat = sendChatParam;
        msgLang = msgLangParam;
      }

      const payload: Record<string, unknown> = { id, status };
      if (status === 'ملغي' && cancellationReason) {
        payload.cancellation_reason = cancellationReason;
      }
      if (customMessage !== undefined) {
        payload.custom_message = customMessage;
      }
      if (sendChat !== undefined) {
        payload.send_chat = sendChat;
      }
      if (msgLang !== undefined) {
        payload.msg_lang = msgLang;
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
