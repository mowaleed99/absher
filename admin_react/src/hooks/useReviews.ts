import { useState, useEffect, useCallback } from 'react';
import { ServiceReview, ReviewsAnalytics } from '../types/review';
import { apiFetch } from '../lib/apiFetch';
import { parseReviews, parseReviewsAnalytics } from '../lib/validators';

export function useReviews() {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [analytics, setAnalytics] = useState<ReviewsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (silent = false) => {
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

      const parsed = parseReviews(result.data.reviews);
      if (parsed) {
        setReviews(parsed);
      } else {
        setError('Failed to parse reviews');
      }

      const parsedAnalytics = parseReviewsAnalytics(result.data.reviews_analytics);
      if (parsedAnalytics) {
        setAnalytics(parsedAnalytics);
      }
    } catch (err) {
      console.error('[useReviews] fetch error:', err);
      setError('Connection error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(false);
    const timer = setInterval(() => {
      fetchReviews(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchReviews]);

  const moderateReview = async (id: number, status: 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('moderate_service_review', { id, status });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      await fetchReviews();
      return { success: true };
    } catch (err) {
      console.error('[useReviews] moderate error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteReview = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_review', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
      await fetchReviews();
      return { success: true };
    } catch (err) {
      console.error('[useReviews] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    reviews,
    analytics,
    isLoading,
    error,
    refetch: fetchReviews,
    moderateReview,
    deleteReview,
  };
}
