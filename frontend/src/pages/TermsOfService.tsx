import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'service-description', title: '2. Service Description' },
  { 
    id: 'user-responsibilities', 
    title: '3. User Responsibilities',
    subsections: [
      { id: 'data-compliance', title: 'Data Collection Compliance' },
      { id: 'legal-compliance', title: 'Legal Compliance' },
      { id: 'prohibited-uses', title: 'Prohibited Uses' }
    ]
  },
  { id: 'ai-services', title: '4. AI Services & Limitations' },
  { id: 'liability', title: '5. Limitation of Liability' },
  { id: 'termination', title: '6. Termination' },
  { id: 'contact', title: '7. Contact Information' }
];

const TermsOfService: React.FC = () => {
  return (
    <LegalPageLayout title="Terms of Service" sections={sections}>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Acceptance */}
        <section id="acceptance" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using reviewoly ("Platform", "Service", "we", "us"), you ("User", "you") 
            agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
            do not use our Service.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              <strong>Minimum Age:</strong> You must be at least 13 years old to use this Service.
            </p>
          </div>
        </section>

        {/* Service Description */}
        <section id="service-description" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">2. Service Description</h2>
          <p className="text-muted-foreground">
            reviewoly provides AI-powered review analysis services including:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Core Features</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Review aggregation from multiple platforms</li>
                <li>AI sentiment analysis and topic classification</li>
                <li>Urgency scoring and business insights</li>
              </ul>
            </div>
            <div className="bg-accent/5 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Additional Services</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Auto-response generation</li>
                <li>Email invitation campaigns</li>
                <li>CSV/Excel file processing</li>
              </ul>
            </div>
          </div>
        </section>

        {/* User Responsibilities */}
        <section id="user-responsibilities" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">3. User Responsibilities & Warranties</h2>
          
          <div id="data-compliance" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">3.1 Data Collection Compliance</h3>
            <p className="text-muted-foreground">You warrant and represent that:</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                <li>You have all necessary rights and permissions to collect, upload, and analyze review data</li>
                <li>For scraped reviews: You have verified that scraping target platforms is permitted under their terms</li>
                <li>For email invitations: You have obtained proper consent and comply with anti-spam laws</li>
                <li>For uploaded files: You own or have licensed rights to all data provided</li>
              </ul>
            </div>
          </div>

          <div id="legal-compliance" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">3.2 Legal Compliance</h3>
            <p className="text-muted-foreground">You agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Comply with all applicable laws regarding data collection and processing</li>
              <li>Respect third-party platform terms of service when scraping reviews</li>
              <li>Not use our Service for illegal, fraudulent, or harmful purposes</li>
              <li>Not generate fake reviews or manipulate review platforms</li>
            </ul>
          </div>

          <div id="prohibited-uses" className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">3.3 Prohibited Uses</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">You may NOT:</p>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>Scrape data from platforms that explicitly prohibit automated data collection</li>
                <li>Upload personal data without proper consent</li>
                <li>Use the Service to harass, spam, or harm individuals or businesses</li>
                <li>Attempt to reverse engineer or copy our AI algorithms</li>
                <li>Share your account credentials with unauthorized parties</li>
              </ul>
            </div>
          </div>
        </section>

        {/* AI Services */}
        <section id="ai-services" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">4. AI Services & Limitations</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">AI Analysis Disclaimers</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li><strong>Accuracy Not Guaranteed:</strong> AI analysis results are suggestions only</li>
                <li><strong>Human Oversight Required:</strong> Always review AI-generated responses</li>
                <li><strong>Content Responsibility:</strong> You are solely responsible for published content</li>
                <li><strong>Bias Potential:</strong> AI models may reflect biases in training data</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Data Processing</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  <li>We do NOT use your uploaded data to train our AI models</li>
                  <li>Analysis results are based on your specific data</li>
                  <li>We implement reasonable security measures</li>
                  <li>We cannot guarantee absolute data protection</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section id="liability" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Limitation of Liability</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-2 text-sm">
              <li>Our total liability is limited to the amount you paid in the 12 months preceding the claim</li>
              <li>We are not liable for indirect, consequential, or punitive damages</li>
              <li>We disclaim all warranties except those that cannot be legally excluded</li>
              <li>You use the Service at your own risk</li>
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-foreground mb-2">Specific Disclaimers:</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm ml-4">
              <li>We are not responsible for scraped data accuracy or availability</li>
              <li>We are not liable for third-party platform policy violations</li>
              <li>We are not responsible for consequences of AI-generated content</li>
            </ul>
          </div>
        </section>

        {/* Termination */}
        <section id="termination" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">6. Termination</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Termination Rights</h3>
              <p className="text-muted-foreground text-sm">We may terminate your account immediately for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Violation of these Terms or applicable laws</li>
                <li>Fraudulent or abusive behavior</li>
                <li>Non-payment of fees</li>
                <li>At our sole discretion with notice</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Effect of Termination</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Your data will be deleted within 30 days</li>
                <li>You remain liable for all charges incurred</li>
                <li>Liability and dispute resolution clauses survive</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">7. Contact Information</h2>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              For questions about these Terms, contact us at:
            </p>
            <div className="space-y-2">
              <p className="text-foreground"><strong>Email:</strong> legal@reviewoly.com</p>
              <p className="text-foreground"><strong>Support:</strong> support@reviewoly.com</p>
            </div>
          </div>
        </section>

        {/* Important Notices */}
        <section className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Important Legal Notices</h2>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Scraping Risk Warning</h4>
              <p className="text-yellow-700 text-sm">
                Web scraping may violate third-party platform terms. You assume all legal responsibility for compliance.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <h4 className="font-semibold text-blue-800 mb-2">⚠️ AI Accuracy Disclaimer</h4>
              <p className="text-blue-700 text-sm">
                AI analysis is not 100% accurate. Always review results before making business decisions.
              </p>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Email Compliance</h4>
              <p className="text-red-700 text-sm">
                You must comply with anti-spam laws. Violations may result in immediate account termination.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm italic">
            These Terms are effective as of {new Date().toLocaleDateString()} and replace all previous versions.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default TermsOfService;