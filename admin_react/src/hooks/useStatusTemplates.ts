import { useState, useEffect, useCallback } from 'react';
import { StatusReplyTemplate } from '../types/request';
import { apiFetch } from '../lib/apiFetch';

export function useStatusTemplates() {
  const [templates, setTemplates] = useState<StatusReplyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ templates?: StatusReplyTemplate[] }>('get_status_templates');
      if (result.success && result.data && Array.isArray(result.data.templates)) {
        setTemplates(result.data.templates);
      } else {
        // Fallback to get_all if get_status_templates not separated
        const allResult = await apiFetch<{ status_reply_templates?: StatusReplyTemplate[] }>('get_all');
        if (allResult.success && allResult.data && Array.isArray(allResult.data.status_reply_templates)) {
          setTemplates(allResult.data.status_reply_templates);
        }
      }
    } catch (err) {
      console.error('[useStatusTemplates] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateTemplate = async (
    id: number,
    templateAr: string,
    templateEn: string,
    isEnabled = 1
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_status_template', {
        id,
        template_ar: templateAr,
        template_en: templateEn,
        is_enabled: isEnabled,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, template_ar: templateAr, template_en: templateEn, is_enabled: isEnabled }
            : t
        )
      );
      return { success: true };
    } catch (err) {
      console.error('[useStatusTemplates] update error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates,
    updateTemplate,
  };
}
