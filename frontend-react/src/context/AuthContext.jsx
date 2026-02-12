/**
 * Auth Context
 * Simple admin-only authentication with hardcoded credentials.
 * No Firebase dependency — admin credentials are checked locally.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// Admin credentials
const ADMIN_CREDENTIALS = [
  { email: 'admin@vidyavani.gov.in', password: 'VidyaVani@2026', name: 'Administrator' },
  { email: 'superadmin@vidyavani.gov.in', password: 'SuperAdmin@2026', name: 'Super Admin' },
];

const AUTH_STORAGE_KEY = 'vidyavani_admin_session';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const admin = ADMIN_CREDENTIALS.find(
      (cred) => cred.email === email.toLowerCase().trim() && cred.password === password
    );

    if (!admin) {
      throw { code: 'auth/invalid-credential', message: 'Invalid admin credentials' };
    }

    const userData = {
      email: admin.email,
      displayName: admin.name,
      role: 'admin',
    };

    const session = {
      user: userData,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(userData);
    return { user: userData };
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
