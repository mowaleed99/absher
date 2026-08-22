import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { useAuth } from './AuthContext';

interface BadgesContextType {
  pendingReviewsCount: number;
  negativeReviewsCount: number;
  rejectedReviewsCount: number;
  totalReviewsCount: number;
  pendingFeedbackCount: number;
  pendingChatsCount: number;
  pendingRequestsCount: number;
  refetchBadges: () => Promise<void>;
  decrementRequestsCount: () => void;
}

const BadgesContext = createContext<BadgesContextType>({
  pendingReviewsCount: 0,
  negativeReviewsCount: 0,
  rejectedReviewsCount: 0,
  totalReviewsCount: 0,
  pendingFeedbackCount: 0,
  pendingChatsCount: 0,
  pendingRequestsCount: 0,
  refetchBadges: async () => {},
  decrementRequestsCount: () => {},
});

export const useBadges = () => useContext(BadgesContext);

export function BadgesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [negativeReviewsCount, setNegativeReviewsCount] = useState<number>(0);
  const [rejectedReviewsCount, setRejectedReviewsCount] = useState<number>(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState<number>(0);
  const [pendingChatsCount, setPendingChatsCount] = useState<number>(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingReviewsCount(0);
      setNegativeReviewsCount(0);
      setRejectedReviewsCount(0);
      setTotalReviewsCount(0);
      setPendingFeedbackCount(0);
      setPendingChatsCount(0);
      setPendingRequestsCount(0);
      return;
    }

    try {
      const result = await apiFetch<Record<string, unknown>>('get_badge_counts');
      if (result.success && result.data) {
        const payload = (result.data.data as Record<string, unknown>) || result.data;
        if (payload.pending_reviews !== undefined) {
          setTotalReviewsCount(Number(payload.total_reviews || 0));
          setPendingReviewsCount(Number(payload.pending_reviews || 0));
          setNegativeReviewsCount(Number(payload.negative_reviews || 0));
          setRejectedReviewsCount(Number(payload.rejected_reviews || 0));
          setPendingFeedbackCount(Number(payload.pending_feedback || 0));
          setPendingChatsCount(Number(payload.pending_chats || 0));
          setPendingRequestsCount(Number(payload.pending_requests || 0));
          return;
        }
      }

      // Fallback to get_all if get_badge_counts not available
      const fallback = await apiFetch<Record<string, unknown>>('get_all');
      if (fallback.success && fallback.data) {
        if (Array.isArray(fallback.data.reviews)) {
          const total = fallback.data.reviews.length;
          const pCount = fallback.data.reviews.filter(
            (r: Record<string, unknown>) => String(r.status || '').trim().toLowerCase() === 'pending'
          ).length;
          const negCount = fallback.data.reviews.filter(
            (r: Record<string, unknown>) => Number(r.rating || 5) <= 2
          ).length;
          const rejCount = fallback.data.reviews.filter(
            (r: Record<string, unknown>) => String(r.status || '').trim().toLowerCase() === 'rejected'
          ).length;

          setTotalReviewsCount(total);
          setPendingReviewsCount(pCount);
          setNegativeReviewsCount(negCount);
          setRejectedReviewsCount(rejCount);
        }

        const rawFeedback = fallback.data.application_feedback || fallback.data.feedback;
        if (Array.isArray(rawFeedback)) {
          const pFeedback = rawFeedback.filter(
            (f: Record<string, unknown>) => String(f.status || '').trim().toLowerCase() === 'pending'
          );
          setPendingFeedbackCount(pFeedback.length);
        }

        if (Array.isArray(fallback.data.chats)) {
          const pChats = fallback.data.chats.filter((c: Record<string, unknown>) => {
            if (!Array.isArray(c.messages) || c.messages.length === 0) return false;
            const activeMsgs = c.messages.filter(
              (m: Record<string, unknown>) => !m.deleted && !m.is_deleted
            );
            if (activeMsgs.length === 0) return false;
            const lastMsg = activeMsgs[activeMsgs.length - 1];
            return lastMsg && (lastMsg.sender === 'student' || lastMsg.sender === 'user');
          });
          setPendingChatsCount(pChats.length);
        }

        if (Array.isArray(fallback.data.requests)) {
          const pReqs = fallback.data.requests.filter((r: Record<string, unknown>) => {
            const norm = String(r.status || '').trim().toLowerCase().replace(/[\s_-]+/g, '_');
            return ['قيد_المراجعة', 'under_review', 'جديد', 'new', 'pending', 'pending_cash', 'pending_payment'].includes(norm);
          });
          setPendingRequestsCount(pReqs.length);
        }
      }
    } catch (err) {
      console.error('[BadgesProvider] fetch error:', err);
    }
  }, [isAuthenticated]);

  const decrementRequestsCount = useCallback(() => {
    setPendingRequestsCount((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 12000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return (
    <BadgesContext.Provider
      value={{
        pendingReviewsCount,
        negativeReviewsCount,
        rejectedReviewsCount,
        totalReviewsCount,
        pendingFeedbackCount,
        pendingChatsCount,
        pendingRequestsCount,
        refetchBadges: fetchBadges,
        decrementRequestsCount,
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
}
