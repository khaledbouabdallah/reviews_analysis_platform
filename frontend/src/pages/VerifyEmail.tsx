import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Footer from '@/components/common/Footer'
import { authService } from '@/services/auth';

interface VerificationResult {
  success: boolean;
  message: string;
  alreadyVerified?: boolean;
}

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setResult({ success: false, message: 'Invalid verification link' });
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
  try {
    const data = await authService.verifyEmail(verificationToken);
    
    setStatus('success');
    setResult({
      success: true,
      message: data.message,
      alreadyVerified: data.message.includes('already verified')
    });
    
  } catch (error) {
    setStatus('error');
    setResult({
      success: false,
      message: error instanceof Error ? error.message : 'Email verification failed'
    });
  }
};

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleResendVerification = () => {
    // Navigate to a resend verification page or show modal
    navigate('/resend-verification');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
              <CardHeader>
                <CardTitle className="text-center text-foreground">
                  Email Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {status === 'loading' && (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Verifying your email...</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {result?.alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {result?.alreadyVerified 
                          ? 'Your email was already verified. You can sign in to your account.'
                          : 'Your email has been successfully verified. You can now sign in to your account.'
                        }
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleSignIn}
                      className="w-full btn-hero"
                    >
                      Continue to Sign In
                    </Button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="text-center space-y-4">
                    <XCircle className="h-12 w-12 text-destructive mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Verification Failed
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {result?.message}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {result?.message.includes('expired') && (
                        <Button 
                          onClick={handleResendVerification}
                          variant="outline"
                          className="w-full"
                        >
                          Resend Verification Email
                        </Button>
                      )}
                      
                      <Button 
                        onClick={handleSignIn}
                        variant="outline"
                        className="w-full"
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </div>
                )}

                {/* Footer Links */}
                <div className="text-center text-sm text-muted-foreground border-t pt-4">
                  <p>
                    Need help?{' '}
                    <Link to="/support" className="text-primary hover:underline">
                      Contact Support
                    </Link>
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