// frontend/src/components/analytics/BusinessInsights.tsx
import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BusinessInsightsProps {
  topIssues: string[];
  topHighlights: string[];
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({
  topIssues,
  topHighlights
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Issues */}
      <Card className="feature-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Top Issues Identified
          </CardTitle>
          <CardDescription>Most common problems mentioned in reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {topIssues.length > 0 ? (
            <div className="space-y-3">
              {topIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <Badge variant="destructive" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <p className="text-sm text-foreground flex-1">{issue}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No issues identified in current data set
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Highlights */}
      <Card className="feature-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Positive Highlights
          </CardTitle>
          <CardDescription>Most appreciated aspects mentioned in reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {topHighlights.length > 0 ? (
            <div className="space-y-3">
              {topHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    #{index + 1}
                  </Badge>
                  <p className="text-sm text-foreground flex-1">{highlight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No highlights identified in current data set
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};