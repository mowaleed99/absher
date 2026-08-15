import { useState, useEffect, useCallback } from 'react';
import { BroadcastNotification, NotificationFormData } from '../types/notification';
import { apiFetch } from '../lib/apiFetch';
import { parseNotificationList } from '../lib/validators';

export function useNotifications() {
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
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

      const parsed = parseNotificationList(result.data.notifications);
      if (parsed) {
        setNotifications(parsed);
      } else {
        setError('Failed to parse notifications');
      }
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = async (data: NotificationFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_notification', {
        title: data.title,
        body: data.body,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchNotifications();
      return { success: true };
    } catch (err) {
      console.error('[useNotifications] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteNotification = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_notification', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return { success: true };
    } catch (err) {
      console.error('[useNotifications] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    notifications,
    isLoading,
    error,
    refetch: fetchNotifications,
    addNotification,
    deleteNotification,
  };
}
