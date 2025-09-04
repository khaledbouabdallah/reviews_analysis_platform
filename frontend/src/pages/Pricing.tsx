import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usageService, SubscriptionPlan } from '@/services/usage';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import Footer from "@/components/common/Footer";
import Navigation from "@/components/landing/Navigation";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isYearly: boolean;
  isRecommended?: boolean;
  onUpgrade: (tier: string) => void;
  isCurrentPlan?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isYearly,
  isRecommended = false,
  onUpgrade,
  isCurrentPlan = false
}) => {
  const price = isYearly ? plan.price_yearly : plan.price_monthly;
  const formattedPrice = usageService.formatPrice(price);
  const yearlyDiscount = usageService.getYearlyDiscount(plan.price_monthly, plan.price_yearly);
  
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'starter': return <Zap className="w-6 h-6" />;
      case 'growth': return <Star className="w-6 h-6" />;
      case 'scale': return <Crown className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'starter': return 'from-muted to-muted/50';
      case 'growth': return 'from-primary/20 to-primary/5';
      case 'scale': return 'from-accent/20 to-accent/5';
      default: return 'from-muted to-muted/50';
    }
  };

  const getTierBorderColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'border-muted-foreground/20';
      case 'growth': return 'border-primary/30';
      case 'scale': return 'border-accent/30';
      default: return 'border-muted-foreground/20';
    }
  };

  const getButtonVariant = (tier: string) => {
    if (isCurrentPlan) return 'outline';
    switch (tier) {
      case 'starter': return 'outline';
      case 'growth': return 'default';
      case 'scale': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card className={`
      relative p-8 h-full flex flex-col
      ${isRecommended ? 'ring-2 ring-primary shadow-[var(--shadow-primary)]' : ''}
      ${getTierBorderColor(plan.tier)}
      bg-gradient-to-br ${getTierGradient(plan.tier)}
      hover:shadow-lg transition-all duration-300
      group hover:-translate-y-1
    `}>

      {isRecommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`
          p-3 rounded-lg 
          ${plan.tier === 'starter' ? 'bg-muted' : 
            plan.tier === 'growth' ? 'bg-primary/10' : 'bg-accent/10'}
          group-hover:scale-110 transition-transform duration-300
        `}>
          {getTierIcon(plan.tier)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-4xl font-bold text-foreground">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-foreground">€{formattedPrice}</span>
              <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
            </>
          )}
        </div>
        {isYearly && yearlyDiscount > 0 && price > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground line-through">
              €{usageService.formatPrice(plan.price_monthly * 12)}/year
            </span>
            <Badge variant="secondary" className="text-xs">
              Save {yearlyDiscount}%
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onUpgrade(plan.tier)}
        variant={getButtonVariant(plan.tier)}
        size="lg"
        className="w-full group/button"
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? (
          'Current Plan'
        ) : (
          <>
            {plan.tier === 'starter' ? 'Get Started' : 'Upgrade Now'}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </Card>
  );
};

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan> | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const subscriptionPlans = await usageService.getSubscriptionPlans();
        setPlans(subscriptionPlans);
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        toast('Failed to load pricing plans. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgrade = (tier: string) => {
    if (tier === 'starter') {
      // Redirect to signup or login
      navigate('/signup');
    } else {
      // Handle upgrade logic - this would typically integrate with Stripe
      toast(`Upgrading to ${tier} plan... (Integration needed)`);
      // navigate('/billing/upgrade', { state: { tier } });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="h-12 bg-muted animate-pulse rounded-lg w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-muted animate-pulse rounded-lg w-96 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[600px] bg-muted animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Failed to Load Pricing</h2>
          <p className="text-muted-foreground mb-4">Please try refreshing the page.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  const planOrder = ['starter', 'growth', 'scale'];
  const orderedPlans = planOrder
    .filter(tier => plans[tier])
    .map(tier => plans[tier]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <Navigation />
      <div className="container mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Perfect Plan</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include our powerful AI review analysis.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="scale-125"
          />
          <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              Save up to 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {orderedPlans.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              isYearly={isYearly}
              isRecommended={usageService.isRecommended(plan.tier)}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        {/* FAQ or Features section could go here */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Questions about our plans?{' '}
            <button className="text-primary hover:text-primary/80 underline underline-offset-4">
              Contact our team
            </button>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;