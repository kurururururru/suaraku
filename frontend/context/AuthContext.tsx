'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import api from '../lib/api';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (token: string, userData: User) => {
    // Clear any stale crypto keys before starting a new session
    sessionStorage.removeItem('rsa_private_key');
    Cookies.set('token', token, { expires: 1, path: '/' }); // 1 day
    setUser(userData);
    
    // Redirect based on role
    if (userData.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    // Clear session storage to remove crypto keys
    sessionStorage.removeItem('rsa_private_key');
    
    // Force clear all possible paths where the stuck cookie might have been set
    Cookies.remove('token');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('token', { path: '/admin' });
    Cookies.remove('token', { path: '/admin/login' });
    // Remove the user from state immediately
    setUser(null);

    // Redirect to landing page with a hard reload to completely flush Next.js router cache and cookies
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
