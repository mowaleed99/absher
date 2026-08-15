import { useState, useEffect, useCallback } from 'react';
import { NewsItem, NewsFormData } from '../types/news';
import { apiFetch } from '../lib/apiFetch';
import { parseNewsList } from '../lib/validators';

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
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

      const parsed = parseNewsList(result.data.news);
      if (parsed) {
        setNews(parsed);
      } else {
        setError('Failed to parse news');
      }
    } catch (err) {
      console.error('[useNews] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const addNews = async (data: NewsFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_news', {
        title_ar: data.title_ar,
        title_en: data.title_en,
        content_ar: data.content_ar,
        content_en: data.content_en,
        image_url: data.image_url,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchNews();
      return { success: true };
    } catch (err) {
      console.error('[useNews] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updateNews = async (id: number, data: NewsFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_news', {
        id,
        title_ar: data.title_ar,
        title_en: data.title_en,
        content_ar: data.content_ar,
        content_en: data.content_en,
        image: data.image_url,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchNews();
      return { success: true };
    } catch (err) {
      console.error('[useNews] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteNews = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_news', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setNews((prev) => prev.filter((n) => n.id !== id));
      return { success: true };
    } catch (err) {
      console.error('[useNews] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    news,
    isLoading,
    error,
    refetch: fetchNews,
    addNews,
    updateNews,
    deleteNews,
  };
}
