"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, User as ApiUser } from '@/lib/api';

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

  // 2. Simplified boot check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await userApi.getMe();
        if (response && response.user) {
          setUser(response.user); // Extract the inner .user object!
        }
      } catch (error) {
        // Silently catch the 401 Unauthorized error when not logged in
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Empty dependency array is perfect here for mount

  // 3. Simplified Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.login(email, password);
      // After successful login cookie is set, fetch the user!
      const response = await userApi.getMe();
      if (response && response.user) {
        setUser(response.user); // Extract the inner .user object!
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Simplified Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null); 
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.register(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserEmail = async (email: string) => {
    if (!user) throw new Error('Not authenticated');
    await userApi.updateEmail(email);
    setUser({ ...user, email }); 
  };

  const refreshUser = async () => {
    try {
      const response = await userApi.getMe();
      if (response && response.user) {
        setUser(response.user);
      }
    } catch {
      setUser(null); // If refresh fails (e.g., cookie expired), clear state
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
