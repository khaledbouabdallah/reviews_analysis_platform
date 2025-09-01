// frontend/src/components/common/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  showCookieSettings?: boolean;
}

const Footer: React.FC<FooterProps> = ({ showCookieSettings = true }) => {
  const currentYear = new Date().getFullYear();

  const handleCookieSettings = () => {
    const event = new CustomEvent('openCookieSettings');
    window.dispatchEvent(event);
  };

  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Reviewoly Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">
                Review<span className="text-accent">oly</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              AI-powered review analysis platform helping businesses transform reviews into actionable insights.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-muted-foreground hover:text-primary text-sm transition-colors">Features</a></li>
              <li><a href="/#how-it-works" className="text-muted-foreground hover:text-primary text-sm transition-colors">How it Works</a></li>
              <li><a href="/#pricing" className="text-muted-foreground hover:text-primary text-sm transition-colors">Pricing</a></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary text-sm transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Press</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-6">
              <Link 
                to="/privacy-policy" 
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Cookie Policy
              </Link>
            </div>

            {/* Cookie Settings Button */}
            {showCookieSettings && (
              <button 
                onClick={handleCookieSettings}
                className="text-muted-foreground hover:text-primary text-sm transition-colors underline"
              >
                Cookie Settings
              </button>
            )}

            {/* Copyright */}
            <div className="text-muted-foreground text-sm">
              © {currentYear} Reviewoly. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;