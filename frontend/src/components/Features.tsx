import { Card } from "@/components/ui/card";
import { Globe, MapPin, Eye, Brain, MessageSquare, TrendingUp } from "lucide-react";
// import multiLocationImage from "@/assets/multi-location.jpg";
// import aiAnalysisImage from "@/assets/ai-analysis.jpg";

const Features = () => {
  const features = [
    {
      icon: Globe,
      title: "Collect Reviews Everywhere",
      description: "Automatically gather reviews from Google, Yelp, Facebook, and 50+ platforms. Or invite customers directly through custom campaigns.",
      image: null,
      color: "text-primary"
    },
    {
      icon: MapPin,
      title: "Multiple Locations",
      description: "Manage reviews across unlimited business locations. Get location-specific insights and compare performance effortlessly.",
      image: null,
      color: "text-accent"
    },
    {
      icon: Eye,
      title: "Competitor Intelligence",
      description: "Access public reviews of your competitors. Understand market trends and identify opportunities to outperform.",
      image: null,
      color: "text-primary"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Get cutting-edge AI insights, auto-generated responses, sentiment analysis, and actionable recommendations.",
      image: null,
      color: "text-accent"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to
            <span className="text-primary"> Master Reviews</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From collection to analysis, Reviewoly provides all the tools you need to turn customer feedback into competitive advantage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 stagger-fade-in">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card p-8 relative overflow-hidden group">
              {/* Background Image */}
              {feature.image && (
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <img
                    src={feature.image}
                    alt={`${feature.title} illustration`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Animated Accent */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="inline-flex p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-2">Smart Responses</h4>
            <p className="text-muted-foreground">AI generates personalized responses that match your brand voice</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300 mb-4">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-2">Trend Analysis</h4>
            <p className="text-muted-foreground">Identify patterns and trends in customer sentiment over time</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-2">Actionable Insights</h4>
            <p className="text-muted-foreground">Get specific recommendations to improve customer satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
