import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Star, Zap } from "lucide-react";

const CallToAction = () => {
  const benefits = [
    "Setup in under 10 minutes",
    "No credit card required",
    "Cancel anytime",
    "24/7 customer support"
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 hero-bg"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-accent/90"></div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <Star className="w-12 h-12 text-white float" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-20">
        <Zap className="w-16 h-16 text-accent-glow float-delayed" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
            <div className="text-center">
              {/* Headline */}
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Start Your Free Trial
                <span className="text-primary"> Today</span>
              </h2>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join over 1,000 businesses using Reviewoly to transform their customer reviews into actionable insights and competitive advantage.
              </p>

              {/* Benefits */}
              <div className="grid md:grid-cols-2 gap-4 mb-10 max-w-lg mx-auto">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-left">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button size="lg" className="btn-hero text-lg px-10 py-4 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-4 border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
                >
                  Schedule Demo
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent fill-current" />
                    ))}
                  </div>
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>1000+ happy customers</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
