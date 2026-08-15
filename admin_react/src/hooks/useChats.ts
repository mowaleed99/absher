import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatConversation, AdminReplyPayload } from '../types/chat';
import { apiFetch } from '../lib/apiFetch';
import { ADMIN_CHAT_REPLY_URL } from '../config/api';
import { parseChatList } from '../lib/validators';

export function useChats() {
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchChats = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    const token = localStorage.getItem('adminToken');
    if (!token) {
      if (!silent) setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    isFetchingRef.current = true;
    try {
      const result = await apiFetch<Record<string, unknown>>('get_all');
      if (!result.success) {
        if (!silent) setError(result.error);
        return;
      }

      const parsed = parseChatList(result.data.chats);
      if (parsed) {
        setChats(parsed);
      } else if (!silent) {
        setError('Failed to parse chats');
      }
    } catch (err) {
      console.error('[useChats] fetch error:', err);
      if (!silent) setError('Connection error');
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Polling every 3 seconds ONLY while mounted
  useEffect(() => {
    fetchChats(false);

    const timer = setInterval(() => {
      fetchChats(true);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [fetchChats]);

  const sendReply = async (payload: AdminReplyPayload): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const res = await fetch(ADMIN_CHAT_REPLY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false || data.status === 'error') {
        return { success: false, error: data.message || 'Failed to send message' };
      }

      await fetchChats(true);
      return { success: true };
    } catch (err) {
      console.error('[useChats] sendReply error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const editMessage = async (messageId: number, text: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('edit_chat_message', {
        message_id: messageId,
        text,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchChats(true);
      return { success: true };
    } catch (err) {
      console.error('[useChats] editMessage error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteMessage = async (messageId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_chat_message', {
        message_id: messageId,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchChats(true);
      return { success: true };
    } catch (err) {
      console.error('[useChats] deleteMessage error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteConversation = async (chatId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_chat', {
        chat_id: chatId,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setChats((prev) => prev.filter((c) => c.id !== chatId));
      return { success: true };
    } catch (err) {
      console.error('[useChats] deleteConversation error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    chats,
    isLoading,
    error,
    refetch: fetchChats,
    sendReply,
    editMessage,
    deleteMessage,
    deleteConversation,
  };
}
