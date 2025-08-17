// src/components/auth/AuthRedirect.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth';

interface AuthRedirectProps {
    children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authenticated = await authService.isAuthenticated();
                setIsAuthenticated(authenticated);
            } catch {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    // Loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen hero-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    // Render auth form if not authenticated
    return <>{children}</>;
}
