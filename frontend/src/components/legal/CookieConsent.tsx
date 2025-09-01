// frontend/src/components/legal/CookieConsent.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Cookie, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'reviewoly_cookie_consent';

interface CookieConsentProps {
  onOpenSettings?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onOpenSettings }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    functional: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }

    // Listen for cookie settings event from footer
    const handleOpenCookieSettings = () => {
      const existingConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (existingConsent) {
        const parsed = JSON.parse(existingConsent);
        setPreferences(parsed);
      }
      setShowBanner(true);
      setShowSettings(true);
    };

    window.addEventListener('openCookieSettings', handleOpenCookieSettings);
    return () => window.removeEventListener('openCookieSettings', handleOpenCookieSettings);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowSettings(false);
    
    // Initialize analytics based on consent
    if (prefs.analytics) {
      // Initialize Google Analytics or other analytics
      console.log('Analytics enabled');
    }
  };

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, functional: true };
    savePreferences(allAccepted);
  };

  const acceptEssential = () => {
    const essentialOnly = { essential: true, analytics: false, functional: false };
    savePreferences(essentialOnly);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl bg-white shadow-xl border">
        <CardContent className="p-6">
          {!showSettings ? (
            // Initial banner
            <div className="flex items-start gap-4">
              <Cookie className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">We use cookies</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  We use cookies to improve your experience on our website. Essential cookies are required for the site to function, 
                  while analytics and functional cookies help us provide better service. You can customize your preferences or learn more in our{' '}
                  <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={acceptAll} className="bg-primary hover:bg-primary/90">
                    Accept All
                  </Button>
                  <Button onClick={acceptEssential} variant="outline">
                    Essential Only
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // Settings panel
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Cookie Preferences</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBanner(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                {/* Essential Cookies */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Required for website functionality, security, and user authentication. Cannot be disabled.
                    </p>
                  </div>
                  <Switch checked={true} disabled className="ml-4" />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how users interact with our platform to improve our services.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    }
                    className="ml-4"
                  />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Functional Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Remember your preferences and settings for a better user experience.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.functional}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, functional: checked }))
                    }
                    className="ml-4"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={saveCustomPreferences} className="bg-primary hover:bg-primary/90">
                  Save Preferences
                </Button>
                <Button onClick={acceptAll} variant="outline">
                  Accept All
                </Button>
                <Button onClick={() => setShowSettings(false)} variant="ghost">
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};