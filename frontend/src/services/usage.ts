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

export interface SubscriptionPlan {
  tier: string;
  name: string;
  description: string;
  limits: {
    businesses: number;
    locations: number;
    sources: number;
    reviews_per_month: number;
    tokens_per_month: number;
  };
  price_monthly: number;
  price_yearly: number;
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

  // Helper methods for formatting
  formatNumber(num: number): string {
    if (num === -1) return '∞';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  }

  getUsageColor(percentage: number): 'green' | 'yellow' | 'red' | 'blue' {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  }

  getTierDisplayName(tier: string): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  getTierColor(tier: string): string {
    switch (tier.toLowerCase()) {
      case 'starter':
        return 'gray';
      case 'growth':
        return 'blue';
      case 'scale':
        return 'purple';
      default:
        return 'gray';
    }
  }
}

export const usageService = new UsageService();