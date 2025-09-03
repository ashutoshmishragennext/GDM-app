import { apiService } from '@/api';
import { clearCookies } from '@/utils/cookieUtils';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  otherRoles?: string[];
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialNavigation, setInitialNavigation] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading && !initialNavigation) {
      handleInitialNavigation();
      setInitialNavigation(true);
    }
  }, [isLoading, initialNavigation]);

  useEffect(() => {
    if (!isLoading && initialNavigation) {
      handleRouteProtection();
    }
  }, [user, segments, isLoading, initialNavigation]);

  const AUTH_TOKEN_KEY = 'auth_token';
  const USER_DATA_KEY = 'user_data';

  const loadUserFromStorage = async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('User restored from SecureStore:', parsedUser);
      } else {
        console.log('No valid session found');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialNavigation = () => {
    if (user) {
      redirectToDashboard(user.role);
    } else {
      router.replace('/login');
    }
  };

  const handleRouteProtection = () => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else {
      if (inAuthGroup) {
        redirectToDashboard(user.role);
      }
    }
  };

  // 🔑 Simplified: no group names, just dashboard
  const redirectToDashboard = (role: string) => {
    if (['SUPER_ADMIN', 'ADMIN', 'USER'].includes(role)) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      // navigation handled by useEffect
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      await clearCookies();
      setInitialNavigation(false);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
