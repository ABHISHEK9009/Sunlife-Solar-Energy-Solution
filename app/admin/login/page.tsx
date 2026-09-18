'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('error');
    if (errorCode) {
      const messages: Record<string, string> = {
        google_cancelled: 'Google sign-in was cancelled.',
        google_unauthorized:
          'This Google account is not authorized for portal access.',
        google_invalid:
          'Google could not verify this sign-in request. Please try again.',
        google_failed: 'Google sign-in failed. Please try again.',
        google_unavailable: 'Google sign-in is not configured yet.',
      };
      setError(messages[errorCode] || 'Unable to sign in with Google.');
      window.history.replaceState({}, '', '/admin/login');
    }

    // Check if already authenticated with active session
    const auth = localStorage.getItem('sunlife_admin_auth');
    if (auth === 'true') {
      fetch('/api/admin/login')
        .then((res) => {
          if (res.ok) {
            router.push('/admin/dashboard');
          } else {
            localStorage.removeItem('sunlife_admin_auth');
            localStorage.removeItem('sunlife_admin_user');
          }
        })
        .catch(() => {});
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter your admin username and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanUser, password: cleanPass }),
      });

      if (!response.ok) {
        setError(
          'Invalid admin credentials. Please check your email and password.',
        );
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('sunlife_admin_auth', 'true');
        localStorage.setItem('sunlife_admin_user', username.trim());
      }
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 400);
    } catch {
      setError('Unable to sign in right now. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/logo.svg"
                alt="Sunlife Solar Energy Solution Logo"
                width={280}
                height={100}
                className="h-12 sm:h-14 w-auto mx-auto object-contain"
                priority
              />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                Admin Management Portal
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access internal leads, inquiries & customer solar estimates
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Admin email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Security Password / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 px-6 bg-solar-deep hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                or continue with
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <a
              href="/api/admin/google"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.9A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.5 13.7a6 6 0 0 1 0-3.4V7.4H3.1a10 10 0 0 0 0 9.2l3.4-2.9Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.2c1.5 0 2.9.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3.1 7.4l3.4 2.9A5.9 5.9 0 0 1 12 6.2Z"
                />
              </svg>
              Sign in with Google
            </a>
          </form>

          {/* Quick Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-solar-emerald shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">Authorized Access:</span> Internal
              database portal for Sunlife Solar leads and customer inquiries.
            </div>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-solar-deep font-semibold transition-colors"
            >
              ← Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
