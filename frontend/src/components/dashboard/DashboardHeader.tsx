import { Bell, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authService } from '@/services/auth';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCurrentUsage } from "@/hooks/useUsage";
import { usageService } from "@/services/usage";
import { useState } from 'react';

// Usage indicator component
const UsageIndicator = ({ 
  label, 
  used, 
  limit, 
  percentage, 
  isUnlimited = false, 
  compact = false 
}) => {
  const color = usageService.getUsageColor(percentage);
  
  const colorClasses = {
    green: { bg: 'bg-green-500', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    red: { bg: 'bg-red-500', text: 'text-red-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' }
  };

  const classes = colorClasses[color];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${classes.text}`}>
          {label}
        </span>
        {isUnlimited ? (
          <span className="text-xs text-blue-600 font-bold">∞</span>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${classes.bg}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-max">
              {usageService.formatNumber(used)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${classes.text}`}>
        {label}
      </span>
      {isUnlimited ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">Unlimited</span>
          <span className="text-xs text-blue-600 font-bold text-lg">∞</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${classes.bg}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-sm text-foreground min-w-max font-medium">
            {usageService.formatNumber(used)} / {usageService.formatNumber(limit)}
          </span>
        </div>
      )}
    </div>
  );
};

// Tier badge component
const TierBadge = ({ tier }) => {
  const color = usageService.getTierColor(tier);
  
  const colorClasses = {
    gray: 'bg-muted text-muted-foreground border-border',
    blue: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300'
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${colorClasses[color] || colorClasses.gray}`}>
      {usageService.getTierDisplayName(tier)}
    </span>
  );
};

// Loading skeleton
const UsageLoadingSkeleton = () => (
  <div className="flex items-center gap-4 animate-pulse">
    <div className="h-4 bg-muted rounded w-16"></div>
    <div className="h-4 bg-muted rounded w-16"></div>
    <div className="h-6 bg-muted rounded w-20"></div>
  </div>
);

export function DashboardHeader() {
  const navigate = useNavigate();
  const { selectedBusiness, businesses, setSelectedBusiness, isLoading: businessLoading } = useBusiness();
  const { usage, isLoading: usageLoading, error, refreshUsage } = useCurrentUsage();
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  const handleRefreshUsage = () => {
    refreshUsage();
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-full gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />

          {/* Business Selector */}
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedBusiness?.id || ""}
              onValueChange={(value) => {
                const business = businesses.find(b => b.id === value);
                setSelectedBusiness(business || null);
              }}
              disabled={businessLoading || businesses.length === 0}
            >
              <SelectTrigger className="w-64">
                <SelectValue
                  placeholder={businessLoading ? "Loading businesses..." : "Select business"}
                />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Center - Usage Indicators */}
        <div className="flex items-center gap-6">
          {usageLoading && <UsageLoadingSkeleton />}
          
          {error && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Usage unavailable</span>
              <Button
                variant="link"
                size="sm"
                onClick={handleRefreshUsage}
                className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
              >
                Retry
              </Button>
            </div>
          )}

          {!usageLoading && !error && usage && (
            <>
              {/* Quick usage indicators */}
              <div className="flex items-center gap-4">
                <UsageIndicator
                  label="Reviews"
                  used={usage.reviews_used}
                  limit={usage.reviews_limit}
                  percentage={usage.reviews_percentage}
                  compact
                />
                <UsageIndicator
                  label="Tokens"
                  used={usage.tokens_used}
                  limit={usage.tokens_limit}
                  percentage={usage.tokens_percentage}
                  compact
                />
              </div>

              {/* Subscription tier */}
              <TierBadge tier={usage.subscription_tier} />

              {/* Days remaining warning (if less than 7 days) */}
              {usage.days_remaining <= 7 && (
                <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded-md dark:bg-orange-900 dark:text-orange-300">
                  {usage.days_remaining} days left
                </span>
              )}

              {/* Warning indicator with dropdown */}
              {usage.is_approaching_limit && (
                <DropdownMenu open={showUsageDetails} onOpenChange={setShowUsageDetails}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 p-0" align="end">
                    <div className="p-5">
                      <DropdownMenuLabel className="text-lg font-semibold px-0">
                        Usage Details
                      </DropdownMenuLabel>
                      
                      <div className="space-y-4 mt-4">
                        <UsageIndicator
                          label="Reviews Scraped"
                          used={usage.reviews_used}
                          limit={usage.reviews_limit}
                          percentage={usage.reviews_percentage}
                        />
                        <UsageIndicator
                          label="AI Analysis Tokens"
                          used={usage.tokens_used}
                          limit={usage.tokens_limit}
                          percentage={usage.tokens_percentage}
                        />
                        <UsageIndicator
                          label="Businesses"
                          used={usage.businesses_count}
                          limit={usage.businesses_limit}
                          percentage={(usage.businesses_count / Math.max(usage.businesses_limit, 1)) * 100}
                          isUnlimited={usage.businesses_limit === -1}
                        />
                        <UsageIndicator
                          label="Locations"
                          used={usage.locations_count}
                          limit={usage.locations_limit}
                          percentage={(usage.locations_count / Math.max(usage.locations_limit, 1)) * 100}
                          isUnlimited={usage.locations_limit === -1}
                        />
                        <UsageIndicator
                          label="Sources"
                          used={usage.sources_count}
                          limit={usage.sources_limit}
                          percentage={(usage.sources_count / Math.max(usage.sources_limit, 1)) * 100}
                          isUnlimited={usage.sources_limit === -1}
                        />
                      </div>

                      {usage.limit_warnings.length > 0 && (
                        <div className="mt-5 p-4 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
                          <div className="flex">
                            <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Usage Alerts</h4>
                              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                                {usage.limit_warnings.map((warning, index) => (
                                  <li key={index}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 pt-4 border-t border-border">
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Billing cycle ends:</span>
                            <div className="text-foreground">
                              {new Date(usage.billing_cycle_end).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Days remaining:</span>
                            <div className="text-foreground">
                              {usage.days_remaining} days
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <Button
                          onClick={handleUpgradeClick}
                          className="w-full"
                        >
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-xs text-destructive-foreground font-medium">3</span>
            </div>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john@reviewoly.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await authService.logout();
                    localStorage.removeItem('selectedBusinessId');
                    navigate('/');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    navigate('/');
                  }
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}