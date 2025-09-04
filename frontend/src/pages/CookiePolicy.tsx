import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { 
    id: 'cookies-we-use', 
    title: '2. Cookies We Use',
    subsections: [
      { id: 'essential-cookies', title: 'Essential Cookies' },
      { id: 'analytics-cookies', title: 'Analytics Cookies' },
      { id: 'functional-cookies', title: 'Functional Cookies' }
    ]
  },
  { id: 'cookies-we-dont-use', title: '3. Cookies We Do NOT Use' },
  { id: 'consent-management', title: '4. Cookie Consent Management' },
  { id: 'browser-controls', title: '5. Browser Controls' },
  { id: 'contact', title: '6. Contact Information' }
];

const CookiePolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Cookie Policy" sections={sections}>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <section id="introduction" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Cookie Policy explains how reviewoly ("we", "us", "our") uses cookies and similar tracking 
            technologies on our website and platform. This policy should be read alongside our{' '}
            <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> and{' '}
            <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">What are cookies?</h3>
            <p className="text-blue-700 text-sm">
              Cookies are small text files stored on your device when you visit a website. They help websites 
              remember your preferences and improve your browsing experience.
            </p>
          </div>
        </section>

        {/* Cookies We Use */}
        <section id="cookies-we-use" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">2. Cookies We Use</h2>
          
          <div id="essential-cookies" className="space-y-4">
            <h3 className="text-xl font-medium text-foreground">2.1 Essential Cookies (Always Active)</h3>
            <p className="text-muted-foreground">
              These cookies are necessary for our website to function properly and cannot be disabled.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Cookie Name</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Purpose</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-sm font-mono bg-muted/30">reviewoly_session</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Maintains your login session</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Session</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">First-party</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-mono bg-muted/30">auth_token</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Authenticates your account access</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">30 days</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">First-party</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-mono bg-muted/30">csrf_protection</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Prevents security attacks</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Session</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">First-party</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-mono bg-muted/30">cookie_consent</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Records your cookie preferences</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">1 year</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">First-party</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-sm text-muted-foreground italic">
              Legal Basis: Necessary for contract performance and legitimate interests (security)
            </p>
          </div>

          <div id="analytics-cookies" className="space-y-4">
            <h3 className="text-xl font-medium text-foreground">2.2 Analytics Cookies (Optional - Requires Consent)</h3>
            <p className="text-muted-foreground">
              These cookies help us understand how users interact with our platform to improve our services.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">What we track:</h4>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  <li>Page views and user journeys</li>
                  <li>Feature usage and engagement</li>
                  <li>Error rates and performance metrics</li>
                  <li>General geographic location (country level)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">What we DO NOT track:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                  <li>Personal conversations or messages</li>
                  <li>Specific review content details</li>
                  <li>Detailed location data</li>
                  <li>Cross-site browsing behavior</li>
                </ul>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground italic">
              Legal Basis: Your explicit consent
            </p>
          </div>

          <div id="functional-cookies" className="space-y-4">
            <h3 className="text-xl font-medium text-foreground">2.3 Functional Cookies (Optional - Requires Consent)</h3>
            <p className="text-muted-foreground">
              These cookies enhance your user experience but are not essential for basic functionality.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <h5 className="font-medium text-foreground text-sm">dashboard_layout</h5>
                <p className="text-muted-foreground text-xs">Saves your dashboard customizations</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <h5 className="font-medium text-foreground text-sm">theme_preference</h5>
                <p className="text-muted-foreground text-xs">Stores dark/light mode choice</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <h5 className="font-medium text-foreground text-sm">notification_prefs</h5>
                <p className="text-muted-foreground text-xs">Remembers notification settings</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <h5 className="font-medium text-foreground text-sm">language_setting</h5>
                <p className="text-muted-foreground text-xs">Remembers language preference</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookies We Don't Use */}
        <section id="cookies-we-dont-use" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">3. Cookies We Do NOT Use</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-4">We explicitly DO NOT use:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li><strong>Advertising cookies</strong> - We don't track you for advertising purposes</li>
                <li><strong>Social media tracking cookies</strong> - No Facebook Pixel, Twitter tracking, etc.</li>
              </ul>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li><strong>Cross-site tracking cookies</strong> - We don't follow your browsing on other sites</li>
                <li><strong>Marketing cookies</strong> - We don't build advertising profiles</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Consent Management */}
        <section id="consent-management" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">4. Cookie Consent Management</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Initial Consent</h3>
              <p className="text-muted-foreground text-sm">
                When you first visit our website, you'll see a cookie banner with options to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-4">
                <li><strong>Accept All</strong> - Consent to all cookie categories</li>
                <li><strong>Essential Only</strong> - Use only necessary cookies</li>
                <li><strong>Customize</strong> - Choose specific cookie categories</li>
                <li><strong>Learn More</strong> - Read this detailed Cookie Policy</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Changing Your Preferences</h3>
              <p className="text-muted-foreground text-sm">
                You can modify your cookie settings at any time:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-4">
                <li><strong>Cookie Settings Link</strong> - Available in website footer</li>
                <li><strong>Account Dashboard</strong> - Under "Privacy Settings"</li>
                <li><strong>Browser Settings</strong> - Direct browser cookie controls</li>
                <li><strong>Email Request</strong> - Contact us at privacy@reviewoly.com</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Granular Control</h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Essential Cookies (Always Required)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Analytics Cookies (Optional)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                Functional Cookies (Optional)
              </span>
            </div>
          </div>
        </section>

        {/* Browser Controls */}
        <section id="browser-controls" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Browser Controls</h2>
          <p className="text-muted-foreground">
            Most browsers allow you to control cookies through settings:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Desktop Browsers</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong>Chrome:</strong> "Settings &gt; Privacy and Security &gt; Cookies"</li>
                <li><strong>Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies</li>
                <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
                <li><strong>Edge:</strong> Settings &gt; Cookies and site permissions</li>
              </ul>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Cookie Settings Options</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong>Allow all cookies</strong> - Full website functionality</li>
                <li><strong>Block third-party cookies</strong> - Limits tracking</li>
                <li><strong>Block all cookies</strong> - May break functionality</li>
                <li><strong>Delete cookies on exit</strong> - Privacy-focused</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Do Not Track</h4>
            <p className="text-blue-700 text-sm">
              We respect "Do Not Track" browser settings and will not use analytics cookies if this setting is enabled.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">6. Contact Information</h2>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Cookie Questions</h4>
                <p className="text-muted-foreground text-sm">privacy@reviewoly.com</p>
                <p className="text-muted-foreground text-sm">Subject: "Cookie Policy Inquiry"</p>
                <p className="text-muted-foreground text-sm">Response: Within 5 business days</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Technical Support</h4>
                <p className="text-muted-foreground text-sm">support@reviewoly.com</p>
                <p className="text-muted-foreground text-sm">Live chat available in dashboard</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Reference Guide</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">✅ What We Use Cookies For:</h4>
              <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                <li>Keep you logged in securely</li>
                <li>Remember your dashboard preferences</li>
                <li>Understand how to improve our platform (with consent)</li>
                <li>Ensure website security and prevent attacks</li>
              </ul>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-3">❌ What We DON'T Use Cookies For:</h4>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>Track you across other websites</li>
                <li>Show you targeted advertisements</li>
                <li>Sell your information to third parties</li>
                <li>Build advertising profiles about you</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm italic">
            This Cookie Policy is effective as of {new Date().toLocaleDateString()} and replaces all previous versions.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default CookiePolicy;