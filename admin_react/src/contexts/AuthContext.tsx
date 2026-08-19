import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ADMIN_LOGIN_URL } from '../config/api';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  job_title: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAdminUser: (user: Partial<AdminUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  adminUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  updateAdminUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('adminUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setAdminUser(null);
  }, []);

  const updateAdminUser = useCallback((updated: Partial<AdminUser>) => {
    setAdminUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      localStorage.setItem('adminUser', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    // Initial check
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
    }
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [logout]);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(ADMIN_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });

      const data = await res.json();
      const extractedToken = data.token || data.data?.token;
      const isSuccess = data.success === true || data.status === 'success';

      if (isSuccess && extractedToken) {
        const rawAdmin = data.admin || data.data?.admin;
        const userObj: AdminUser = {
          id: rawAdmin?.id ?? 1,
          username: rawAdmin?.username ?? identifier,
          email: rawAdmin?.email ?? '',
          full_name: rawAdmin?.full_name ?? 'المدير العام',
          job_title: rawAdmin?.job_title ?? 'المدير العام',
          role: rawAdmin?.role ?? 'admin',
        };

        localStorage.setItem('adminToken', extractedToken);
        localStorage.setItem('adminUser', JSON.stringify(userObj));
        setToken(extractedToken);
        setAdminUser(userObj);
        return { success: true };
      }
      return { success: false, error: data.message || 'Invalid username or password.' };
    } catch (err) {
      console.error('[AuthContext] Login request failed:', err);
      return { success: false, error: 'Network error during login.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        adminUser,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateAdminUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
