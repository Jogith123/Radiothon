/**
 * Auth Context
 * Secure admin-only authentication via backend API.
 * Credentials stored in MongoDB, never exposed to frontend.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'vidyavani_admin_session';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get backend URL from environment
  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  };

  // Check for existing session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Validate session hasn't expired (24 hour expiry)
        if (session.expiresAt && Date.now() < session.expiresAt) {
          setUser(session.user);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Session restore error:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          code: 'auth/invalid-credential',
          message: data.message || 'Login failed',
        };
      }

      // Store session
      const session = {
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setUser(data.user);
      return { user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
