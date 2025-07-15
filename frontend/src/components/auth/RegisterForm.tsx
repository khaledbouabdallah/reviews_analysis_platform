// src/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { authService } from '@/services/auth';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header with navigation */}
      <div className="relative z-10 p-6">
        <button
          onClick={() => router.push('/')}
          className="group flex items-center text-gray-600 hover:text-gray-900 transition-all duration-300 hover:bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20"
        >
          <div className="relative mr-3">
            <MessageSquare className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-lg">ReviewsAI</span>
        </button>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center animate-in slide-in-from-top duration-700">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent">
              Create account
            </h2>
            <p className="mt-2 text-gray-600">
              Join our platform today
            </p>
          </div>

          {/* Form */}
          <div className="relative animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.2s' }}>
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 rounded-3xl opacity-60" />

            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white/70 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Choose a username"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white/70 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white/70 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Create a password (min 8 characters)"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white/70 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Confirm your password"
                  />
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50/80 backdrop-blur-sm border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    ✅ Account created successfully! Redirecting to login...
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-purple-600 hover:text-purple-500 font-medium transition-colors duration-200 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}