// frontend/src/services/usage.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface CurrentUsage {
  billing_cycle_start: string;
  billing_cycle_end: string;
  days_remaining: number;
  reviews_used: number;
  reviews_limit: number;
  tokens_used: number;
  tokens_limit: number;
  businesses_count: number;
  businesses_limit: number;
  locations_count: number;
  locations_limit: number;
  sources_count: number;
  sources_limit: number;
  reviews_percentage: number;
  tokens_percentage: number;
  subscription_tier: string;
  subscription_status: string;
  is_approaching_limit: boolean;
  limit_warnings: string[];
}

// Updated to match backend model exactly
export interface SubscriptionPlan {
  tier: 'starter' | 'growth' | 'scale';
  name: string;
  description: string;
  limits: {
    businesses: number;
    locations: number;
    sources: number;
    reviews_per_month: number;
    tokens_per_month: number;
  };
  price_monthly: number; // in cents
  price_yearly: number;   // in cents
  features: string[];
}

export interface UsageLimits {
  subscription_tier: string;
  subscription_status: string;
  limits: {
    businesses: number;
    locations: number;
    sources: number;
    reviews_per_month: number;
    tokens_per_month: number;
  };
  billing_cycle: string;
  current_period_end: string;
}

class UsageService {
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        await authService.logout();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUsage(): Promise<CurrentUsage> {
    try {
      return await this.fetchWithAuth('/api/usage/current');
    } catch (error) {
      console.error('Error fetching current usage:', error);
      throw error;
    }
  }

  async getSubscriptionPlans(): Promise<Record<string, SubscriptionPlan>> {
    try {
      return await this.fetchWithAuth('/api/usage/plans');
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  async getUserLimits(): Promise<UsageLimits> {
    try {
      return await this.fetchWithAuth('/api/usage/limits');
    } catch (error) {
      console.error('Error fetching user limits:', error);
      throw error;
    }
  }

  // Utility methods for pricing display
  formatPrice(priceInCents: number): string {
    return (priceInCents / 1).toFixed(2);
  }

  formatPriceWithCurrency(priceInCents: number, currency: string = '€'): string {
    return `${currency}${this.formatPrice(priceInCents)}`;
  }

  // Calculate yearly discount percentage
  getYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
    if (monthlyPrice === 0 && yearlyPrice === 0) return 0;
    const annualMonthlyPrice = monthlyPrice * 12;
    return Math.round(((annualMonthlyPrice - yearlyPrice) / annualMonthlyPrice) * 100);
  }

  // Format numbers for display (e.g., 1000 -> 1K, 1000000 -> 1M)
  formatNumber(num: number): string {
    if (num === -1) return 'Unlimited';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  }

  // Get color for usage percentage
  getUsageColor(percentage: number): 'green' | 'yellow' | 'red' | 'blue' {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  }

  // Get color for tier
  getTierColor(tier: string): 'gray' | 'blue' | 'purple' {
    switch (tier) {
      case 'starter': return 'gray';
      case 'growth': return 'blue';
      case 'scale': return 'purple';
      default: return 'gray';
    }
  }

  getTierDisplayName(tier: string): string {
    switch (tier) {
      case 'starter': return 'Starter';
      case 'growth': return 'Growth';
      case 'scale': return 'Scale';
      default: return tier;
    }
  }

  // Check if plan is recommended
  isRecommended(tier: string): boolean {
    return tier === 'growth';
  }

  // Get plan features with proper formatting
  getFormattedFeatures(plan: SubscriptionPlan): string[] {
    return plan.features.map(feature => {
      // Replace token counts with properly formatted numbers
      return feature
        .replace(/(\d+)K/g, (match, num) => this.formatNumber(parseInt(num) * 1000))
        .replace(/(\d+)M/g, (match, num) => this.formatNumber(parseInt(num) * 1000000));
    });
  }
}

export const usageService = new UsageService();