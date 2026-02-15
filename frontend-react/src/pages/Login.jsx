/**
 * Login Page — institutional, flat, government-trust style
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Shield } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#F6F7F9]">
      {/* Top band */}
      <div className="bg-[#1E293B] text-white">
        <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield size={13} />
            <span className="font-medium">Government of India | Ministry of Education</span>
          </div>
          <span className="hidden sm:block text-white/60">Secure Portal</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E293B] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#111827] tracking-tight">VidyaVani</h1>
            <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-widest">AI Radiothon Platform</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] overflow-hidden">
            {/* Card header */}
            <div className="bg-[#F0F2F5] px-6 py-5 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-semibold text-[#111827]">Sign in</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">Access the admin dashboard</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-5 flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-4 py-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-sm text-[#6B7280] mb-5">
                Sign in with your Google account to access the VidyaVani admin dashboard.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#F6F7F9] text-[#111827] font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#E5E7EB]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#1E293B] rounded-full animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="mt-5 p-3 bg-[#F6F7F9] rounded-lg border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280]">
                  Access real-time call analytics, AI insights, and content management for VidyaVani.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-[#6B7280] mt-5">
            Protected by Government cybersecurity standards.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#1E293B] text-[#6B7280] text-xs py-3">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} VidyaVani AI</span>
          <div className="flex items-center gap-4 text-white/40">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
