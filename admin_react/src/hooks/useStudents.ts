import { useState, useEffect, useCallback } from 'react';
import { Student, StudentFormData, PointsUpdateData, AdminMetaUpdateData, BlockedIdentity } from '../types/student';
import { apiFetch } from '../lib/apiFetch';
import { parseStudents, parseBlockedIdentities } from '../lib/validators';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [blockedIdentities, setBlockedIdentities] = useState<BlockedIdentity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
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

      const parsed = parseStudents(result.data.students);
      if (parsed) {
        setStudents(parsed);
      } else {
        setError('Failed to parse students');
      }

      const parsedBlocked = parseBlockedIdentities(result.data.blocked_identities);
      if (parsedBlocked) {
        setBlockedIdentities(parsedBlocked);
      }
    } catch (err) {
      console.error('[useStudents] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (data: StudentFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('add_student', {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        university: data.university,
        nationality: data.nationality,
        password: data.password || '12345678',
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchStudents();
      return { success: true };
    } catch (err) {
      console.error('[useStudents] add error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const changePassword = async (id: number, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('change_student_password', {
        id,
        password,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      console.error('[useStudents] change password error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updatePoints = async (data: PointsUpdateData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_student_points', {
        student_id: data.student_id,
        amount: data.amount,
        operation: data.operation,
        reason: data.reason,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchStudents();
      return { success: true };
    } catch (err) {
      console.error('[useStudents] update points error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const updateAdminMeta = async (data: AdminMetaUpdateData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('update_student_admin_meta', {
        id: data.id,
        admin_status: data.admin_status,
        admin_note: data.admin_note,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? { ...s, admin_status: data.admin_status || null, admin_note: data.admin_note || null }
            : s
        )
      );
      return { success: true };
    } catch (err) {
      console.error('[useStudents] update admin meta error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const blockStudent = async (id: number, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('block_student', { id, reason });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchStudents();
      return { success: true };
    } catch (err) {
      console.error('[useStudents] block error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const unblockStudent = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('unblock_student', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchStudents();
      return { success: true };
    } catch (err) {
      console.error('[useStudents] unblock error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const unblockIdentity = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('unblock_identity', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      await fetchStudents();
      return { success: true };
    } catch (err) {
      console.error('[useStudents] unblock identity error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const deleteStudent = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiFetch<Record<string, unknown>>('delete_student', { id });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      setStudents((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      console.error('[useStudents] delete error:', err);
      return { success: false, error: 'Connection error' };
    }
  };

  return {
    students,
    blockedIdentities,
    isLoading,
    error,
    refetch: fetchStudents,
    addStudent,
    changePassword,
    updatePoints,
    updateAdminMeta,
    blockStudent,
    unblockStudent,
    unblockIdentity,
    deleteStudent,
  };
}
