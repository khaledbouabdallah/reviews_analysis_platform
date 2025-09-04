// frontend/src/pages/Analytics.tsx
import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { useReviewsByBusiness } from '@/hooks/useReviews';
import { useLocationsByBusiness } from '@/hooks/useLocations';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsMetrics } from '@/components/analytics/AnalyticsMetrics';
import { SentimentChart } from '@/components/analytics/SentimentChart';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { TopicsChart } from '@/components/analytics/TopicsChart';
import { UrgencyChart } from '@/components/analytics/UrgencyChart';
import { EmotionalToneChart } from '@/components/analytics/EmotionalToneChart';
import { BusinessInsights } from '@/components/analytics/BusinessInsights';
import { AttentionQueue } from '@/components/analytics/AttentionQueue';
import { processAnalyticsData } from '@/utils/analyticsUtils';
import { type AnalyticsFilters as FiltersType } from '@/types/analytics';

const Analytics: React.FC = () => {
  const { selectedBusiness, hasBusinesses, isLoading: businessLoading } = useBusiness();
  const [filters, setFilters] = useState<FiltersType>({
    dateRange: null,
    locationId: null,
    sentiment: 'all',
    includeSpam: true,
    hasAnalysis: 'all',
    compareLocation: null
  });

  // Get all reviews for the selected business
  const { 
    data: reviews = [], 
    isLoading: reviewsLoading, 
    error: reviewsError 
  } = useReviewsByBusiness(selectedBusiness?.id || '', { limit: 10000 });

  // Get locations for filtering
  const { data: locations = [] } = useLocationsByBusiness(selectedBusiness?.id || '');

  // Process and filter data
  const { filteredReviews, comparisonReviews, analyticsData } = useMemo(() => {
    if (!reviews.length) return { filteredReviews: [], comparisonReviews: null, analyticsData: null };

    return processAnalyticsData(reviews, filters, locations);
  }, [reviews, filters, locations]);

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      locationId: null,
      sentiment: 'all',
      includeSpam: true,
      hasAnalysis: 'all',
      compareLocation: null
    });
  };

  // Loading state
  if (businessLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (reviewsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-destructive">Failed to load analytics data</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No business selected
  if (!hasBusinesses || !selectedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">No Business Selected</h2>
              <p className="text-muted-foreground">Please select a business to view analytics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { mainData, comparisonData } = analyticsData || { mainData: null, comparisonData: null };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                {selectedBusiness.name} - {mainData?.totalReviews || 0} reviews
                {mainData?.analyzedCount > 0 && ` (${mainData.analyzedCount} analyzed with AI)`}
              </p>
            </div>
            
            {/* Filters */}
            <AnalyticsFilters
              filters={filters}
              setFilters={setFilters}
              locations={locations}
              onReset={resetFilters}
            />
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <AnalyticsMetrics 
          mainData={mainData} 
          comparisonData={comparisonData} 
        />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart 
            mainData={mainData} 
            comparisonData={comparisonData} 
          />
          <TimeSeriesChart 
            data={mainData?.timeSeriesData || []} 
            grouping={mainData?.grouping || 'day'} 
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicsChart data={mainData?.topicData || []} />
          <UrgencyChart data={mainData?.urgencyData || []} />
        </div>

        {/* Emotional Tone Chart */}
        {mainData?.emotionalToneData && mainData.emotionalToneData.length > 0 && (
          <EmotionalToneChart data={mainData.emotionalToneData} />
        )}

        {/* Business Insights */}
        <BusinessInsights 
          topIssues={mainData?.topIssues || []}
          topHighlights={mainData?.topHighlights || []}
        />

        {/* Reviews Needing Attention */}
        {mainData?.needsAttention && mainData.needsAttention.length > 0 && (
          <AttentionQueue reviews={mainData.needsAttention} />
        )}
      </div>
    </div>
  );
};

export default Analytics;