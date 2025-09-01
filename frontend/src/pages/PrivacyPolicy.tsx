import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { 
    id: 'information-we-collect', 
    title: '2. Information We Collect',
    subsections: [
      { id: 'account-information', title: 'Account Information' },
      { id: 'review-data', title: 'Review Data' },
      { id: 'usage-analytics', title: 'Usage & Analytics' }
    ]
  },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'your-rights', title: '4. Your Rights' },
  { id: 'data-security', title: '5. Data Security' },
  { id: 'contact', title: '6. Contact Information' }
];

const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" sections={sections}>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Introduction */}
        <section id="introduction" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reviewoly ("we", "us", "our") respects your privacy and is committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, process, and protect your information when you use 
            our AI-powered review analysis platform.
          </p>
          
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Contact Information</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Email: privacy@reviewoly.com</li>
              <li>Data Protection Officer: dpo@reviewoly.com</li>
            </ul>
          </div>
        </section>

        {/* Information We Collect */}
        <section id="information-we-collect" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
          
          <div id="account-information" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">2.1 Account Information</h3>
            <p className="text-muted-foreground">What we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Name and email address</li>
              <li>Company name and business information</li>
              <li>Password (encrypted)</li>
              <li>Billing information (processed by third-party payment providers)</li>
              <li>Account preferences and settings</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">
              Legal basis (GDPR): Contract performance and legitimate business interests
            </p>
          </div>

          <div id="review-data" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">2.2 Review Data You Provide</h3>
            <p className="text-muted-foreground">What we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Uploaded CSV/Excel files containing review data</li>
              <li>Email addresses for review invitations</li>
              <li>Customer contact information you provide</li>
              <li>Review responses and communications</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">
              Legal basis (GDPR): Contract performance and your consent
            </p>
          </div>

          <div id="usage-analytics" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">2.3 Usage and Analytics Data</h3>
            <p className="text-muted-foreground">What we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Login times and IP addresses</li>
              <li>Platform usage patterns and feature interactions</li>
              <li>Error logs and diagnostic information</li>
              <li>Device and browser information</li>
              <li>Cookies and tracking technologies (see <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>)</li>
            </ul>
          </div>
        </section>

        {/* How We Use */}
        <section id="how-we-use" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Service Provision</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Account management and authentication</li>
                <li>AI analysis of reviews and sentiment</li>
                <li>Email services for review invitations</li>
                <li>Customer support and technical assistance</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Business Operations</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Billing and payment processing</li>
                <li>Service improvement and analytics</li>
                <li>Security and fraud prevention</li>
                <li>Legal compliance requirements</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">We do NOT:</h4>
            <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
              <li>Sell your personal data to third parties</li>
              <li>Use your review data to train our AI models</li>
              <li>Share customer data between different client accounts</li>
              <li>Use your data for advertising purposes</li>
            </ul>
          </div>
        </section>

        {/* Your Rights */}
        <section id="your-rights" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">4. Your Rights</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-3">GDPR Rights (EU Users)</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                <li><strong>Right of Access:</strong> Request copies of your data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Delete your data</li>
                <li><strong>Right to Data Portability:</strong> Export your data</li>
                <li><strong>Right to Object:</strong> Opt-out of processing</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-3">CCPA Rights (California)</h3>
              <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                <li><strong>Right to Know:</strong> Information categories collected</li>
                <li><strong>Right to Delete:</strong> Request data deletion</li>
                <li><strong>Right to Opt-Out:</strong> We don't sell data</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section id="data-security" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your data:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Technical Safeguards</h4>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>AES-256 encryption in transit and at rest</li>
                <li>Multi-factor authentication</li>
                <li>Regular security audits</li>
              </ul>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Organizational Measures</h4>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Staff training and access controls</li>
                <li>Data minimization practices</li>
                <li>Incident response procedures</li>
              </ul>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground italic">
            While we implement robust security measures, no system is 100% secure. 
            We cannot guarantee absolute protection against all security threats.
          </p>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">6. Contact Information</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries or to exercise your rights:
          </p>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Privacy Team</h4>
                <p className="text-muted-foreground text-sm">privacy@reviewoly.com</p>
                <p className="text-muted-foreground text-sm">Response time: Within 30 days</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Data Protection Officer</h4>
                <p className="text-muted-foreground text-sm">dpo@reviewoly.com</p>
                <p className="text-muted-foreground text-sm">GDPR requests: Within 72 hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;