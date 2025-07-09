// src/components/landing/LandingPage.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Brain, 
  Globe, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  Star,
  ArrowRight,
  CheckCircle,
  Bell,
  Bot,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Activity,
  PieChart,
  BarChart
} from 'lucide-react';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

// Floating Analytics Cards Component - Multiple Cards with Random Movement
const FloatingAnalyticsCard = ({ delay = 0, content, direction = 'left', yPosition = 100 }: { delay?: number, content: any, direction?: 'left' | 'right', yPosition?: number }) => {
  const isLeftToRight = direction === 'left';
  
  return (
    <div 
      className={`absolute bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200 whitespace-nowrap ${isLeftToRight ? 'animate-slide-left-right' : 'animate-slide-right-left'}`}
      style={{
        animationDelay: `${delay}s`,
        top: `${yPosition}px`,
        left: isLeftToRight ? '-300px' : 'auto',
        right: isLeftToRight ? 'auto' : '-300px',
        zIndex: -1,
        opacity: 0,
      }}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <content.icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-800">{content.title}</p>
          <p className="text-[10px] text-gray-600">{content.subtitle}</p>
        </div>
      </div>
    </div>
  );
};


/// Multiple Floating Cards Component
const MultipleFloatingCards = () => {
  const [cards, setCards] = useState<Array<{content: any, delay: number, direction: 'left' | 'right', yPosition: number}>>([]);

  const cardContents = [
    { icon: TrendingUp, title: "Rating Improved", subtitle: "+0.8 stars" },
    { icon: Star, title: "5-Star Review", subtitle: "Just received!" },
    { icon: MessageSquare, title: "New Feedback", subtitle: "3 reviews" },
    { icon: BarChart3, title: "92% Positive", subtitle: "Last 24h" },
    { icon: Bell, title: "Alert Resolved", subtitle: "Response sent" },
    { icon: CheckCircle, title: "Goal Achieved", subtitle: "4.5+ rating" },
    { icon: Users, title: "Happy Customer", subtitle: "Loved the food!" },
    { icon: Activity, title: "Engagement Up", subtitle: "+23% replies" },
    { icon: PieChart, title: "AI Analysis", subtitle: "Complete" },
    { icon: Globe, title: "Online Reputation", subtitle: "Boosted" },
    { icon: Shield, title: "Crisis Avoided", subtitle: "Quick response" },
    { icon: Clock, title: "Response Time", subtitle: "Under 2 hours" },
    { icon: Brain, title: "Smart Insights", subtitle: "Ready to view" },
    { icon: Zap, title: "Auto-Reply", subtitle: "Sent successfully" },
    { icon: ArrowRight, title: "Traffic Boost", subtitle: "+15% visits" }
  ];

  // Generate random cards only on client side to avoid hydration mismatch
  useEffect(() => {
    const generateRandomCards = () => {
      return cardContents.map((content, index) => ({
        content,
        delay: index * 2, // Spread them out evenly: 0s, 2s, 4s, 6s...
        direction: Math.random() > 0.5 ? 'left' : 'right' as 'left' | 'right',
        yPosition: Math.random() * 400 + 50
      }));
    };

    setCards(generateRandomCards());
  }, []);

  return (
    <>
      {cards.map((card, index) => (
        <FloatingAnalyticsCard 
          key={`${index}-${card.delay}`}
          delay={card.delay}
          content={card.content}
          direction={card.direction}
          yPosition={card.yPosition}
        />
      ))}
    </>
  );
};

export function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // CSS-in-JS styles
  useEffect(() => {
    // Check if styles already exist to avoid duplicates
    if (document.getElementById('landing-page-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'landing-page-styles';
    style.textContent = `
      @keyframes float {
        0%, 100% { 
          transform: translateY(0px) rotate(0deg); 
        }
        50% { 
          transform: translateY(-20px) rotate(1deg); 
        }
      }
      
      @keyframes slideLeftRight {
        0% { 
          transform: translateX(-300px);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% { 
          transform: translateX(calc(100vw + 100px));
          opacity: 0;
        }
      }
      
      @keyframes slideRightLeft {
        0% { 
          transform: translateX(300px);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% { 
          transform: translateX(calc(-100vw - 100px));
          opacity: 0;
        }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-slide-left-right {
        animation: slideLeftRight 10s linear infinite;
      }
      
      .animate-slide-right-left {
        animation: slideRightLeft 10s linear infinite;
      }
      
      .animate-fadeInUp {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      
      .animate-pulse-slow {
        animation: pulse 4s ease-in-out infinite;
      }
      
      .gradient-bg {
        background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('landing-page-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative">
                <MessageSquare className="h-8 w-8 text-blue-600 animate-pulse-slow" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">ReviewsAI</span>
              <span className="ml-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">BETA</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Floating Elements */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow" />
          <div className="absolute top-40 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Multiple Floating Analytics Cards - Background only */}
          <MultipleFloatingCards key={pathname} />
          
          <div className="text-center">
            <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Turn Customer Reviews Into
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse-slow">
                  {" "}Business Growth
                </span>
              </h1>
            </div>
            
            <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                AI-powered review analysis for restaurants, hotels, retail stores, and service businesses. 
                Monitor Google Maps reviews, understand customer sentiment, and boost your reputation with actionable insights.
              </p>
            </div>
            </div>
          
          {/* Animated Stats */}
          <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'} bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto mb-8 shadow-lg border border-gray-200`} style={{ animationDelay: '0.4s' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  <AnimatedCounter end={95} suffix="%" />
                </div>
                <p className="text-sm text-gray-600">Sentiment Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  <AnimatedCounter end={12} suffix="x" />
                </div>
                <p className="text-sm text-gray-600">Faster Analysis</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  <AnimatedCounter end={24} suffix="/7" />
                </div>
                <p className="text-sm text-gray-600">Monitoring</p>
              </div>
            </div>
          </div>

          <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'} flex flex-col sm:flex-row gap-4 justify-center`} style={{ animationDelay: '0.6s' }}>
            <button
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center group transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-50 transform hover:scale-105"
            >
              See Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fadeInUp">
              AI-Powered Review Analysis Available Now
            </h2>
            <p className="text-xl text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              Transform your Google Maps reviews into actionable business insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Sentiment Analysis",
                description: "Instantly classify reviews as positive, negative, or neutral. Understand customer emotions at scale.",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                delay: "0s"
              },
              {
                icon: BarChart3,
                title: "Topic Classification",
                description: "Automatically categorize reviews by service, food quality, ambiance, and more. Find patterns quickly.",
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100",
                delay: "0.2s"
              },
              {
                icon: MessageSquare,
                title: "Smart Summaries",
                description: "Get AI-generated summaries of hundreds of reviews in seconds. Spot trends without reading everything.",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100",
                delay: "0.4s"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br ${feature.bgColor} p-8 rounded-2xl hover:shadow-xl transition-all duration-500 border-2 border-transparent hover:border-gray-200 transform hover:-translate-y-2 group cursor-pointer animate-fadeInUp`}
                style={{ animationDelay: feature.delay }}
              >
                <div className="flex items-center mb-4">
                  <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="ml-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">LIVE</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-500 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Features with Animated Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Coming Soon: Advanced Restaurant Intelligence
            </h2>
            <p className="text-xl text-gray-600">
              We're building the future of restaurant review management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Bot, title: "AI Review Chat Assistant", description: "Chat with your reviews data. Ask \"What do customers say about our pizza?\" and get instant insights.", color: "indigo" },
              { icon: Bell, title: "Instant Review Alerts", description: "Get notified within minutes when new Google reviews appear. Never miss important feedback again.", color: "orange" },
              { icon: Zap, title: "AI Response Generator", description: "Generate personalized, professional responses to reviews in your restaurant's voice and tone.", color: "yellow" },
              { icon: Globe, title: "Multi-Platform Reviews", description: "Connect Yelp, TripAdvisor, Facebook reviews and more. Centralize all feedback in one dashboard.", color: "green" },
              { icon: TrendingUp, title: "Competitor Analysis", description: "Compare your reviews against local competitors. See what they're doing right and opportunities to improve.", color: "purple" },
              { icon: Shield, title: "Review Crisis Management", description: "Get immediate alerts for negative reviews with AI-suggested crisis response strategies.", color: "red" }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-500 border border-gray-200 hover:border-gray-300 transform hover:-translate-y-2 group cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className={`bg-${feature.color}-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                  </div>
                  <span className="ml-3 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">COMING SOON</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated CTA Section */}
      <section className="py-20 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 animate-fadeInUp">
            Ready to understand what your customers really think?
          </h2>
          <p className="text-xl text-blue-100 mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Join the early access program and help shape the future of AI-powered review management for all businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => router.push('/register')}
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold">ReviewsAI</span>
            <span className="ml-2 text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">Beta</span>
          </div>
          <p className="text-center text-gray-400">
            © 2025 ReviewsAI. All rights reserved. • Built for businesses that value customer feedback.
          </p>
        </div>
      </footer>
    </div>
  );
}