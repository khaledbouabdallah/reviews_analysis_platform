// frontend/src/components/analytics/AttentionQueue.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Review } from '@/services/review';
import { getAnalysisResults, getReviewSentiment, getReviewUrgency } from '@/services/review';

interface AttentionQueueProps {
  reviews: Review[];
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({ reviews }) => {
  return (
    <Card className="feature-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Reviews Requiring Immediate Attention
        </CardTitle>
        <CardDescription>High-priority reviews that need customer service response</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {reviews.map((review, index) => {
            const sentiment = getReviewSentiment(review);
            const urgency = getReviewUrgency(review);
            const analysisResults = getAnalysisResults(review);
            
            return (
              <div key={review.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="text-xs">
                    {urgency?.toUpperCase()}
                  </Badge>
                  {sentiment && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        sentiment === 'positive' ? 'border-green-500 text-green-700' :
                        sentiment === 'negative' ? 'border-red-500 text-red-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {sentiment.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">
                    {review.data?.text || review.data?.original_text || 'No text available'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.location_id && (
                      <>
                        <span>•</span>
                        <span>{review.location_id}</span>
                      </>
                    )}
                  </div>
                  {analysisResults?.urgency_classification?.reasoning && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {analysisResults.urgency_classification.reasoning}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};