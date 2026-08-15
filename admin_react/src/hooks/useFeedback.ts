import { useState, useEffect, useCallback } from 'react';
import { ApplicationFeedback, FeedbackStatus } from '../types/feedback';
import { apiFetch } from '../lib/apiFetch';
import { parseFeedbackList } from '../lib/validators';

export function useFeedback() {
  const [feedback, setFeedback] = useState<ApplicationFeedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (silent = false) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      if (!silent) setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const result = await apiFetch<Record<string, unknown>>('get_all');
      if (!result.success) {
        if (!silent) setError(result.error);
        return;
      }

      const listData = result.data.application_feedback || result.data.feedback;
      const parsed = parseFeedbackList(listData);
      if (parsed) {
        setFeedback(parsed);
      } else {
        if (!silent) setError('Failed to parse feedback');
      }
    } catch (err) {
      console.error('[useFeedback] fetch error:', err);
      if (!silent) setError('Connection error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback(false);
    const timer = setInterval(() => {
      fetchFeedback(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchFeedback]);

  const updateStatus = async (id: number, status: FeedbackStatus): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_feedback_status', { id, status });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      );
      await fetchFeedback();
      return { success: true };
    } catch (err) {
      console.error('[useFeedback] update status error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteFeedback = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_feedback', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setFeedback((prev) => prev.filter((f) => f.id !== id));
      return { success: true };
    } catch (err) {
      console.error('[useFeedback] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    feedback,
    isLoading,
    error,
    refetch: fetchFeedback,
    updateStatus,
    deleteFeedback,
  };
}
