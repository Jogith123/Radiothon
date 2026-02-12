/**
 * Login Page — Admin Only
 * Clean, accessible, official-looking login. No Google auth, no signup.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle, Shield, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid admin credentials. Access is restricted to authorized administrators only.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ff]">
      {/* Government-style top bar */}
      <div className="bg-[#4c1d95] text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span className="font-medium">Government of India | भारत सरकार</span>
          </div>
          <span className="hidden sm:block opacity-80">Secure Portal — VidyaVani AI</span>
        </div>
      </div>

      {/* Header band */}
      <div className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1b4b] tracking-tight">VidyaVani</h1>
            <p className="text-xs text-[#6d28d9] font-semibold uppercase tracking-widest">AI Radiothon Platform</p>
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
          <div className="bg-white rounded-2xl shadow-xl border border-[#e5e7eb] overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Lock size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Admin Login</h2>
                  <p className="text-[#c4b5fd] text-sm mt-0.5">Authorized personnel only</p>
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@vidyavani.gov.in"
                    className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-[#f9fafb] text-[#111827] text-sm focus:ring-2 focus:ring-[#6d28d9]/40 focus:border-[#6d28d9] outline-none transition-all placeholder:text-[#9ca3af]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter admin password"
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-[#f9fafb] text-[#111827] text-sm focus:ring-2 focus:ring-[#6d28d9]/40 focus:border-[#6d28d9] outline-none transition-all pr-12 placeholder:text-[#9ca3af]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#6d28d9] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6d28d9]/25"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-[#f5f3ff] rounded-xl border border-[#e9e5ff]">
                <p className="text-xs text-[#6d28d9] font-semibold mb-1">Restricted Access</p>
                <p className="text-xs text-[#6b7280]">
                  This portal is restricted to authorized VidyaVani administrators. 
                  Contact your system administrator if you need access.
                </p>
              </div>
            </div>
          </div>

          {/* Footer notice */}
          <p className="text-center text-xs text-[#9ca3af] mt-6">
            Protected by Government cybersecurity standards. Unauthorized access is prohibited.
          </p>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#1e1b4b] text-[#a78bfa] text-xs py-3">
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
