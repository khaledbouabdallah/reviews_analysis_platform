import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import  Footer from '@/components/common/Footer';

interface LocationState {
  email?: string;
  username?: string;
}

export function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, username } = (location.state as LocationState) || {};
  
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  // If no email provided, redirect to register
  React.useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendMessage('');
    setResendError('');

    try {
      // Note: You'll need to implement reCAPTCHA here if required
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          recaptcha_token: 'dummy_token' // You should implement proper reCAPTCHA
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendError(data.detail || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
              <CardHeader>
                <CardTitle className="text-center text-foreground">
                  Check Your Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Welcome{username ? `, ${username}` : ''}!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      We've sent a verification email to:
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="font-medium text-foreground break-all">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Next steps:</strong>
                    </p>
                    <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                      <li>Check your inbox for an email from Reviewoly</li>
                      <li>Click the verification link in the email</li>
                      <li>Return here to sign in to your account</li>
                    </ol>
                  </div>

                  {/* Resend Verification */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Didn't receive the email?
                    </p>
                    
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      variant="outline"
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>

                    {resendMessage && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                        {resendMessage}
                      </div>
                    )}

                    {resendError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
                        {resendError}
                      </div>
                    )}
                  </div>

                  {/* Continue Button */}
                  <Button 
                    onClick={handleSignIn}
                    className="w-full btn-hero"
                  >
                    I'll Verify Later - Continue to Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Tips */}
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p className="mb-2">
                    <strong>Tips:</strong> Check your spam/junk folder if you don't see the email
                  </p>
                  <p>
                    The verification link expires in 24 hours for security
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