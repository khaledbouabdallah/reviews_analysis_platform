import { Card } from "@/components/ui/card";
import { ArrowRight, Download, Settings, BarChart, Lightbulb } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Download,
      title: "Connect Your Sources",
      description: "Link your existing review platforms or set up invitation campaigns. Reviewoly automatically syncs all your reviews in real-time.",
      step: "01"
    },
    {
      icon: Settings,
      title: "Configure Locations",
      description: "Add all your business locations and customize settings for each. Our AI learns your brand voice and preferences.",
      step: "02"
    },
    {
      icon: BarChart,
      title: "Monitor & Analyze",
      description: "Watch as AI analyzes sentiment, identifies trends, and compares your performance against competitors automatically.",
      step: "03"
    },
    {
      icon: Lightbulb,
      title: "Get Insights & Act",
      description: "Receive actionable recommendations, auto-generated responses, and strategic insights to improve your reputation.",
      step: "04"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get Started in
            <span className="text-accent"> Minutes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined setup process gets you from zero to insights in under 10 minutes.
            No technical expertise required.
          </p>
        </div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-20 -translate-y-1/2"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <Card key={index} className="feature-card p-6 text-center relative group">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.step}
                </div>

                <div className="mt-4">
                  {/* Icon */}
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-primary/30">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to Transform Your Reviews?
              </h3>
              <p className="text-muted-foreground">
                Join thousands of businesses already using Reviewoly
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
