// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/AuthHeader';
import Footer from "@/components/common/Footer";
import { authService } from '@/services/auth';

export function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResendVerification = () => {
    navigate('/resend-verification');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResendVerification(false);

    try {
      // Use authService.login instead of direct fetch
      const data = await authService.login({
        username: formData.username,
        password: formData.password,
      });

      // Login successful - redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        // Handle email verification error specifically
        if (error.message.includes('verify your email')) {
          setError(error.message);
          setShowResendVerification(true);
        } else {
          setError(error.message);
          setShowResendVerification(false);
        }
      } else {
        setError('Login failed. Please try again.');
        setShowResendVerification(false);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="min-h-screen relative overflow-hidden hero-bg"
    >
      {/* Animated background elements - matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none ">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header with navigation */}
      <AuthHeader />

      {/* Main content */}

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-2">
              Welcome back
            </h2>
            <p className="text-white/80">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <div className="relative animate-fade-in-up [animation-delay:0.2s]">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Sign In</CardTitle>
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
                      placeholder="Enter your username"
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
                      placeholder="Enter your password"
                      className="transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg animate-fade-in-up space-y-3">
                      <p>{error}</p>
                      {showResendVerification && (
                        <div className="pt-2 border-t border-destructive/20">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            className="text-xs"
                          >
                            Resend Verification Email
                          </Button>
                        </div>
                      )}
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
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      onClick={() => navigate('/signup')}
                      className="text-primary hover:text-primary/80 font-medium p-0 h-auto"
                    >
                      Create one here
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}
