// frontend/src/components/analytics/AnalyticsMetrics.tsx
import React from 'react';
import { MessageSquare, Brain, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedAnalyticsData } from '@/types/analytics';

interface AnalyticsMetricsProps {
  mainData: ProcessedAnalyticsData | null;
  comparisonData: ProcessedAnalyticsData | null;
}

export const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({
  mainData,
  comparisonData
}) => {
  if (!mainData) return null;

  const metrics = [
    {
      title: 'Total Reviews',
      value: mainData.totalReviews,
      icon: MessageSquare,
      comparison: comparisonData ? `vs ${comparisonData.totalReviews} in comparison` : null
    },
    {
      title: 'AI Analyzed',
      value: mainData.analyzedCount,
      icon: Brain,
      subtitle: mainData.totalReviews > 0 
        ? `${Math.round((mainData.analyzedCount / mainData.totalReviews) * 100)}% analyzed`
        : '0% analyzed'
    },
    {
      title: 'Spam Detected',
      value: mainData.spamCount,
      icon: Shield,
      subtitle: mainData.totalReviews > 0 
        ? `${Math.round((mainData.spamCount / mainData.totalReviews) * 100)}% spam rate`
        : '0% spam rate'
    },
    {
      title: 'Needs Attention',
      value: mainData.needsAttention.length,
      icon: AlertTriangle,
      subtitle: 'Reviews requiring response'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="feature-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <metric.icon className="h-4 w-4 mr-2" />
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            {metric.comparison && (
              <div className="text-sm text-muted-foreground">
                {metric.comparison}
              </div>
            )}
            {metric.subtitle && (
              <div className="text-sm text-muted-foreground">
                {metric.subtitle}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};