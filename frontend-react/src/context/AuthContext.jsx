/**
 * Auth Context
 * Firebase Auth (email/password) — admin-only.
 * Only the whitelisted admin email can sign in.
 * User profile stored in Firestore /admins collection.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

// Only this email is allowed to log in
const ADMIN_EMAIL = 'admin@vidyavani.gov.in';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Only allow the admin email
        if (firebaseUser.email?.toLowerCase() !== ADMIN_EMAIL) {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        // Fetch admin profile from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          const profile = adminDoc.exists() ? adminDoc.data() : {};
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile.name || 'Administrator',
            role: profile.role || 'admin',
          });
        } catch {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: 'Administrator',
            role: 'admin',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    // Block non-admin emails immediately
    if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
      throw { code: 'auth/unauthorized', message: 'Access restricted to administrators only.' };
    }
    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInError) {
        // Auto-create admin account on very first login attempt
        if (
          signInError.code === 'auth/user-not-found' ||
          signInError.code === 'auth/invalid-credential'
        ) {
          try {
            cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          } catch (createError) {
            // If creation also fails, credentials were wrong for existing account
            throw { code: 'auth/invalid-credential', message: 'Invalid credentials.' };
          }
        } else {
          throw signInError;
        }
      }
      // Ensure admin profile exists in Firestore
      const adminRef = doc(db, 'admins', cred.user.uid);
      const adminDoc = await getDoc(adminRef);
      if (!adminDoc.exists()) {
        await setDoc(adminRef, {
          email: cred.user.email,
          name: 'Administrator',
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
      }
      return { user: cred.user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
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
