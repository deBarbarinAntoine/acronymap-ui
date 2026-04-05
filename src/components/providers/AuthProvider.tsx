"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, authApi, userApi, User as ApiUser } from '@/lib/api';

export type UserProfile = ApiUser;

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api<{ users: UserProfile[] }>('/users/me');
      if (response.users && response.users.length > 0) {
        return response.user;
      }
    } catch {
      // Not admin or not authenticated
    }
    return null;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const users = await fetchCurrentUser();
        if (users) {
          // User is admin, try to find their info or use first user
          const storedEmail = sessionStorage.getItem('acronymap_email');
          const currentUser = storedEmail
            ? users.find(u => u.email === storedEmail)
            : users[0];
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.login(email, password);
      sessionStorage.setItem('acronymap_email', email);

      // Try to fetch user data (works if admin)
      const users = await fetchCurrentUser();
      if (users) {
        const currentUser = users.find(u => u.email === email) || users[0];
        setUser(currentUser);
      } else {
        // Non-admin user - store minimal profile
        setUser({
          id: '',
          email,
          profile: 'standard',
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      sessionStorage.removeItem('acronymap_email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      sessionStorage.removeItem('acronymap_email');
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.register(email, password);
      // User created as inactive - they need admin approval
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserEmail = async (email: string) => {
    if (!user) throw new Error('Not authenticated');

    await userApi.updateEmail(email);
    sessionStorage.setItem('acronymap_email', email);
    setUser({ ...user, email });
  };

  const refreshUser = async () => {
    if (!user) return;

    const users = await fetchCurrentUser();
    if (users) {
      const currentUser = users.find(u => u.email === user.email);
      if (currentUser) {
        setUser(currentUser);
      }
    }
  };

  const value = {
    user,
    isLoading,
    isAdmin: user?.profile === 'admin',
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUserEmail,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
