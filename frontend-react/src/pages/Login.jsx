/**
 * Login Page — Google OAuth
 * Clean, official-looking login with Google sign-in.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { AlertCircle, Shield, Lock } from 'lucide-react';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Government-style top bar */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span className="font-medium">Government of India | भारत सरकार</span>
          </div>
          <span className="hidden sm:block opacity-80">Secure Portal — VidyaVani AI</span>
        </div>
      </div>

      {/* Header band */}
      <div className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">VidyaVani</h1>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest">AI Radiothon Platform</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-primary to-primary-light px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Lock size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Welcome</h2>
                  <p className="text-indigo-200 text-sm mt-0.5">Sign in to access the dashboard</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sign in with your Google account to access the VidyaVani admin dashboard.
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#f9fafb] text-[#374151] font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
                <p className="text-xs text-primary font-semibold mb-1">VidyaVani Dashboard</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Access real-time call analytics, AI-powered insights, and content management tools for the VidyaVani Radiothon platform.
                </p>
              </div>
            </div>
          </div>

          {/* Footer notice */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            Protected by Government cybersecurity standards.
          </p>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="bg-primary-dark text-primary-light text-xs py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} VidyaVani AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
