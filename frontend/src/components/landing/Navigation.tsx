import { Button } from "@/components/ui/button";
import { Menu, X, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    // { label: "Resources", href: "#resources" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/#hero" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Reviewoly Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-bold text-foreground">
              Review<span className="text-accent">oly</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button className="btn-hero" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in-up">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button className="btn-hero justify-start" asChild>
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
