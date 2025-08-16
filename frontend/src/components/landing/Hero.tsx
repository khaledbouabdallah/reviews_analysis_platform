import { Button } from "@/components/ui/button";
import { ArrowRight, Star, BarChart3, Zap } from "lucide-react";
// import heroImage from "@/assets/hero-bg.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <img
          src={null} // Replace with actual image path or import
          alt="Reviewoly Analytics Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-10 opacity-30">
        <Star className="w-8 h-8 text-accent float" />
      </div>
      <div className="absolute top-40 right-20 opacity-30">
        <BarChart3 className="w-10 h-10 text-primary float-delayed" />
      </div>
      <div className="absolute bottom-40 left-20 opacity-30">
        <Zap className="w-6 h-6 text-accent float" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-fade-in-up">
              Review
              <span className="text-accent">oly</span>
            </h1>
            <div className="w-24 h-1 bg-accent mx-auto animate-pulse-glow"></div>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl md:text-4xl font-light text-white/90 mb-8 animate-fade-in-up [animation-delay:0.2s]">
            Transform Reviews into
            <span className="text-accent font-semibold"> Actionable Insights</span>
          </h2>

          {/* Value Proposition */}
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:0.4s]">
            Collect, analyze, and leverage customer reviews with cutting-edge AI.
            Monitor competitors, manage multiple locations, and auto-generate responses
            that boost your reputation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up [animation-delay:0.6s]">
            <Button size="lg" className="btn-hero text-lg px-8 py-4 group" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="btn-accent text-lg px-8 py-4 border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/60 animate-fade-in-up [animation-delay:0.8s]">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent fill-current" />
              <span className="text-sm">Trusted by 1000+ businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm">AI-Powered Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90"></div>
    </section>
  );
};

export default Hero;
