// src/components/auth/RegisterForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/AuthHeader';
import Footer from "@/components/common/Footer";
import { authService } from '@/services/auth';

// ADD: reCAPTCHA type declaration
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false, // ✅ ADD: Terms acceptance field
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ADD: reCAPTCHA execution function
  const executeRecaptcha = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute('6LcbALcrAAAAAO1nEcagBHCTxpjucAtwf7xgVOQN', { action: 'signup' })
            .then(resolve)
            .catch(reject);
        });
      } else {
        reject(new Error('reCAPTCHA not loaded'));
      }
    });
  };

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

    // ✅ ADD: Terms acceptance validation
    if (!formData.acceptTerms) {
      setError('You must accept the Terms of Service to continue');
      return;
    }

    setLoading(true);

    try {
      // ADD: Execute reCAPTCHA before registration
      const recaptchaToken = await executeRecaptcha();

      // MODIFY: Add recaptcha_token to registration data
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        recaptcha_token: recaptchaToken, // ADD this line
      });

      setSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ ADD: Handle checkbox changes
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <div className="min-h-screen hero-bg relative overflow-hidden">
      {/* Animated background elements - matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header with navigation */}
      <AuthHeader />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-white/80">
              Join thousands of businesses using Reviewoly
            </p>
          </div>

          {/* Form */}
          <div className="relative animate-fade-in-up [animation-delay:0.2s]">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-foreground">
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className="transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password (min 8 characters)"
                      className="transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  {/* ✅ ADD: Terms of Service Checkbox */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <input
                        id="acceptTerms"
                        name="acceptTerms"
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 transition-all duration-200"
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-foreground leading-relaxed">
                        I agree to the{' '}
                        <a
                          href="/terms-of-service"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-200"
                        >
                          Terms of Service
                        </a>
                      </label>
                    </div>
                  </div>

                  {/* Success Message - MODIFY: Update message to mention email verification */}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-fade-in-up">
                      ✅ Account created successfully! Please check your email to verify your account, then sign in.
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg animate-fade-in-up">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-hero"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>

                {/* ADD: reCAPTCHA notice */}
                <div className="mt-4 text-xs text-center text-muted-foreground">
                  This site is protected by reCAPTCHA and the Google{' '}
                  <a href="https://policies.google.com/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="https://policies.google.com/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  apply.
                </div>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      onClick={() => navigate('/signin')}
                      className="text-primary hover:text-primary/80 font-medium p-0 h-auto"
                    >
                      Sign in here
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}