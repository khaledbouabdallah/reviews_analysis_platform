import React, { useState, useEffect } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
  sections: Array<{
    id: string;
    title: string;
    subsections?: Array<{ id: string; title: string }>;
  }>;
  onBack?: () => void;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  children,
  sections,
  onBack,
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Scroll to top when a legal page mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setSidebarOpen(false);
    }
  };

  const goBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-30 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
          <Link 
  to="/" 
  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
>
  <img 
    src="/logo.png" 
    alt="Reviewoly Logo" 
    className="w-8 h-8 object-contain"
  />
  <div>
    <h1 className="text-xl font-bold text-foreground">
      Review<span className="text-accent">oly</span>
    </h1>
    <p className="text-sm text-muted-foreground">{title}</p>
  </div>
</Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            Navigation
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-80 bg-white border-r border-border
            transform transition-transform duration-300 ease-in-out
            lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen lg:block
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="h-full overflow-y-auto p-6 pt-24 lg:pt-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground mb-4">Contents</h3>
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200
                      ${
                        activeSection === section.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    {section.title}
                  </button>

                  {/* Subsections */}
                  {section.subsections && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => scrollToSection(subsection.id)}
                          className="w-full text-left px-3 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {subsection.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-3 text-sm">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => window.print()}
                >
                  Print this page
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Back to top
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-80">
          <div className="px-6 py-8 max-w-5xl">
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <div className="prose prose-slate max-w-none">{children}</div>
              </CardContent>
            </Card>

            {/* Contact section */}
            <Card className="mt-8 bg-muted/30">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  Questions about this policy?
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  We're here to help clarify any concerns you may have.
                </p>
                <Button asChild>
                  <a href="mailto:legal@reviewoly.com">Contact Legal Team</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LegalPageLayout;
