// frontend/src/hooks/useUsage.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { usageService, CurrentUsage, SubscriptionPlan, UsageLimits } from '../services/usage';

interface UseUsageOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: Error) => void;
}

interface UseUsageReturn {
  usage: CurrentUsage | null;
  plans: Record<string, SubscriptionPlan> | null;
  limits: UsageLimits | null;
  isLoading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshLimits: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useUsage = (options: UseUsageOptions = {}): UseUsageReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    onError
  } = options;

  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan> | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const handleError = useCallback((err: Error) => {
    const errorMessage = err.message || 'An unexpected error occurred';
    setError(errorMessage);
    if (onError) {
      onError(err);
    }
    console.error('Usage hook error:', err);
  }, [onError]);

  const refreshUsage = useCallback(async () => {
    try {
      setError(null);
      const usageData = await usageService.getCurrentUsage();
      if (mountedRef.current) {
        setUsage(usageData);
      }
    } catch (err) {
      if (mountedRef.current) {
        handleError(err as Error);
      }
    }
  }, [handleError]);

  const refreshPlans = useCallback(async () => {
    try {
      setError(null);
      const plansData = await usageService.getSubscriptionPlans();
      if (mountedRef.current) {
        setPlans(plansData);
      }
    } catch (err) {
      if (mountedRef.current) {
        handleError(err as Error);
      }
    }
  }, [handleError]);

  const refreshLimits = useCallback(async () => {
    try {
      setError(null);
      const limitsData = await usageService.getUserLimits();
      if (mountedRef.current) {
        setLimits(limitsData);
      }
    } catch (err) {
      if (mountedRef.current) {
        handleError(err as Error);
      }
    }
  }, [handleError]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refreshUsage(),
        refreshPlans(),
        refreshLimits()
      ]);
    } catch (err) {
      // Individual errors are handled in each refresh function
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [refreshUsage, refreshPlans, refreshLimits]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshUsage(); // Only refresh usage data automatically, not plans/limits
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, refreshUsage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    usage,
    plans,
    limits,
    isLoading,
    error,
    refreshUsage,
    refreshPlans,
    refreshLimits,
    refreshAll
  };
};

// Specialized hook for just current usage (lighter weight)
export const useCurrentUsage = (refreshInterval: number = 5 * 60 * 1000) => {
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const refreshUsage = useCallback(async () => {
    try {
      setError(null);
      const usageData = await usageService.getCurrentUsage();
      if (mountedRef.current) {
        setUsage(usageData);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError((err as Error).message || 'Failed to fetch usage data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshUsage();
    
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(refreshUsage, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshUsage, refreshInterval]);

  return {
    usage,
    isLoading,
    error,
    refreshUsage
  };
};