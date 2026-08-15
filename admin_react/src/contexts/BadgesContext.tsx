import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { useAuth } from './AuthContext';

interface BadgesContextType {
  pendingReviewsCount: number;
  pendingFeedbackCount: number;
  pendingChatsCount: number;
  pendingRequestsCount: number;
  refetchBadges: () => Promise<void>;
  decrementRequestsCount: () => void;
}

const BadgesContext = createContext<BadgesContextType>({
  pendingReviewsCount: 0,
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
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState<number>(0);
  const [pendingChatsCount, setPendingChatsCount] = useState<number>(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingReviewsCount(0);
      setPendingFeedbackCount(0);
      setPendingChatsCount(0);
      setPendingRequestsCount(0);
      return;
    }

    try {
      const result = await apiFetch<Record<string, unknown>>('get_all');
      if (result.success && result.data) {
        // 1. Reviews: status === 'pending'
        if (Array.isArray(result.data.reviews)) {
          const pReviews = result.data.reviews.filter(
            (r: Record<string, unknown>) => String(r.status || '').trim().toLowerCase() === 'pending'
          );
          setPendingReviewsCount(pReviews.length);
        } else {
          setPendingReviewsCount(0);
        }

        // 2. Feedback: status === 'pending'
        const rawFeedback = result.data.application_feedback || result.data.feedback;
        if (Array.isArray(rawFeedback)) {
          const pFeedback = rawFeedback.filter(
            (f: Record<string, unknown>) => String(f.status || '').trim().toLowerCase() === 'pending'
          );
          setPendingFeedbackCount(pFeedback.length);
        } else {
          setPendingFeedbackCount(0);
        }

        // 3. Customer Support Chats requiring admin attention:
        // SOLE SOURCE OF TRUTH: Latest active non-deleted message sender === 'student'
        if (Array.isArray(result.data.chats)) {
          const pChats = result.data.chats.filter((c: Record<string, unknown>) => {
            if (!Array.isArray(c.messages) || c.messages.length === 0) {
              return false;
            }
            const activeMsgs = c.messages.filter(
              (m: Record<string, unknown>) => !m.deleted && !m.is_deleted
            );
            if (activeMsgs.length === 0) return false;
            const lastMsg = activeMsgs[activeMsgs.length - 1];
            return lastMsg && (lastMsg.sender === 'student' || lastMsg.sender === 'user');
          });
          setPendingChatsCount(pChats.length);
        } else {
          setPendingChatsCount(0);
        }

        // 4. Service Requests requiring attention: status === 'قيد المراجعة'
        if (Array.isArray(result.data.requests)) {
          const pReqs = result.data.requests.filter(
            (r: Record<string, unknown>) => String(r.status || '').trim() === 'قيد المراجعة'
          );
          setPendingRequestsCount(pReqs.length);
        } else {
          setPendingRequestsCount(0);
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
    const interval = setInterval(fetchBadges, 3000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return (
    <BadgesContext.Provider
      value={{
        pendingReviewsCount,
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
