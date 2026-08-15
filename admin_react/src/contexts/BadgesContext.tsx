import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { useAuth } from './AuthContext';

interface BadgesContextType {
  pendingReviewsCount: number;
  pendingFeedbackCount: number;
  pendingChatsCount: number;
  refetchBadges: () => Promise<void>;
}

const BadgesContext = createContext<BadgesContextType>({
  pendingReviewsCount: 0,
  pendingFeedbackCount: 0,
  pendingChatsCount: 0,
  refetchBadges: async () => {},
});

export const useBadges = () => useContext(BadgesContext);

export function BadgesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState<number>(0);
  const [pendingChatsCount, setPendingChatsCount] = useState<number>(0);

  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingReviewsCount(0);
      setPendingFeedbackCount(0);
      setPendingChatsCount(0);
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

        // 3. Customer Support Chats requiring admin attention
        if (Array.isArray(result.data.chats)) {
          const pChats = result.data.chats.filter((c: Record<string, unknown>) => {
            const st = String(c.status || '').trim();
            if (st === 'رسالة جديدة' || st === 'قيد الانتظار' || st === 'جديد') {
              return true;
            }
            if (Array.isArray(c.messages) && c.messages.length > 0) {
              const lastMsg = c.messages[c.messages.length - 1];
              return lastMsg && (lastMsg.sender === 'student' || lastMsg.sender === 'user');
            }
            return false;
          });
          setPendingChatsCount(pChats.length);
        } else {
          setPendingChatsCount(0);
        }
      }
    } catch (err) {
      console.error('[BadgesProvider] fetch error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return (
    <BadgesContext.Provider
      value={{
        pendingReviewsCount,
        pendingFeedbackCount,
        pendingChatsCount,
        refetchBadges: fetchBadges,
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
}
