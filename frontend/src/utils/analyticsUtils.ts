// frontend/src/utils/analyticsUtils.ts
import { Review } from '@/services/review';
import { 
  getAnalysisResults, 
  getReviewSentiment, 
  getReviewUrgency, 
  isReviewSpam, 
  getReviewTopics, 
  getBusinessInsights 
} from '@/services/review';
import { AnalyticsFilters, ProcessedAnalyticsData } from '@/types/analytics';

export const filterReviews = (reviews: Review[], filters: AnalyticsFilters): Review[] => {
  return reviews.filter(review => {
    // Date range filter
    if (filters.dateRange) {
      const reviewDate = new Date(review.created_at);
      if (reviewDate < filters.dateRange.from || reviewDate > filters.dateRange.to) {
        return false;
      }
    }

    // Location filter
    if (filters.locationId && review.location_id !== filters.locationId) {
      return false;
    }

    // Sentiment filter
    if (filters.sentiment !== 'all') {
      const sentiment = getReviewSentiment(review);
      if (sentiment !== filters.sentiment) {
        return false;
      }
    }

    // Spam filter
    if (!filters.includeSpam && isReviewSpam(review)) {
      return false;
    }

    // Analysis filter
    if (filters.hasAnalysis !== 'all') {
      const hasAnalysis = !!getAnalysisResults(review);
      if (hasAnalysis !== filters.hasAnalysis) {
        return false;
      }
    }

    return true;
  });
};

export const processReviewsData = (reviews: Review[]): ProcessedAnalyticsData => {
  // Sentiment distribution
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  
  // Topic analysis
  const topicMap = new Map<string, { count: number; sentiment: { positive: number; negative: number; neutral: number } }>();
  
  // Urgency distribution
  const urgencyCounts = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
  
  // Emotional tone analysis
  const emotionalToneCounts = new Map<string, number>();
  
  // Time series data
  const timeSeriesMap = new Map<string, { total: number; positive: number; negative: number; neutral: number }>();
  
  // Business insights
  const allIssues: string[] = [];
  const allHighlights: string[] = [];
  const needsAttention: Review[] = [];
  
  let spamCount = 0;
  let analyzedCount = 0;

  reviews.forEach(review => {
    const analysisResults = getAnalysisResults(review);
    const sentiment = getReviewSentiment(review) || 'neutral';
    const urgency = getReviewUrgency(review) || 'none';
    const isSpam = isReviewSpam(review);
    
    // Count analyzed reviews
    if (analysisResults) analyzedCount++;
    
    // Sentiment counts
    sentimentCounts[sentiment]++;
    
    // Spam count
    if (isSpam) spamCount++;
    
    // Urgency counts
    urgencyCounts[urgency]++;
    
    // Emotional tone
    if (analysisResults?.sentiment?.emotional_tone) {
      const tone = analysisResults.sentiment.emotional_tone;
      emotionalToneCounts.set(tone, (emotionalToneCounts.get(tone) || 0) + 1);
    }
    
    // Topic analysis
    const topics = getReviewTopics(review);
    topics.forEach(topic => {
      if (!topicMap.has(topic.topic)) {
        topicMap.set(topic.topic, { count: 0, sentiment: { positive: 0, negative: 0, neutral: 0 } });
      }
      const topicData = topicMap.get(topic.topic)!;
      topicData.count++;
      topicData.sentiment[topic.sentiment]++;
    });
    
    // Time series data - use actual review date from data, fallback to created_at
    const reviewDate = review.data?.date || review.created_at;
    const date = new Date(reviewDate).toISOString().split('T')[0];
    if (!timeSeriesMap.has(date)) {
      timeSeriesMap.set(date, { total: 0, positive: 0, negative: 0, neutral: 0 });
    }
    const dayData = timeSeriesMap.get(date)!;
    dayData.total++;
    dayData[sentiment]++;
    
    // Business insights
    const insights = getBusinessInsights(review);
    if (insights) {
      allIssues.push(...insights.main_issues);
      allHighlights.push(...insights.positive_highlights);
      if (insights.follow_up_needed || urgency === 'critical' || urgency === 'high') {
        needsAttention.push(review);
      }
    }
  });

  return {
    totalReviews: reviews.length,
    analyzedCount,
    spamCount,
    sentimentData: [
      { name: 'Positive', value: sentimentCounts.positive, color: '#22c55e' },
      { name: 'Negative', value: sentimentCounts.negative, color: '#ef4444' },
      { name: 'Neutral', value: sentimentCounts.neutral, color: '#6b7280' }
    ],
    topicData: Array.from(topicMap.entries())
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    urgencyData: [
      { level: 'Critical', count: urgencyCounts.critical, color: '#dc2626' },
      { level: 'High', count: urgencyCounts.high, color: '#ea580c' },
      { level: 'Medium', count: urgencyCounts.medium, color: '#ca8a04' },
      { level: 'Low', count: urgencyCounts.low, color: '#2563eb' },
      { level: 'None', count: urgencyCounts.none, color: '#6b7280' }
    ],
    emotionalToneData: Array.from(emotionalToneCounts.entries())
      .map(([tone, count]) => ({ 
        tone, 
        count, 
        fullMark: Math.max(...Array.from(emotionalToneCounts.values())) 
      }))
      .sort((a, b) => b.count - a.count),
    timeSeriesData: Array.from(timeSeriesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topIssues: Array.from(new Set(allIssues)).slice(0, 5),
    topHighlights: Array.from(new Set(allHighlights)).slice(0, 5),
    needsAttention: needsAttention.slice(0, 10)
  };
};

export const processAnalyticsData = (reviews: Review[], filters: AnalyticsFilters, locations: any[]) => {
  const filteredReviews = filterReviews(reviews, filters);
  
  // Comparison reviews for location comparison
  const comparisonReviews = filters.compareLocation 
    ? filterReviews(reviews, { ...filters, locationId: filters.compareLocation, compareLocation: null })
    : null;

  const mainData = processReviewsData(filteredReviews);
  const comparisonData = comparisonReviews ? processReviewsData(comparisonReviews) : null;

  return {
    filteredReviews,
    comparisonReviews,
    analyticsData: { mainData, comparisonData }
  };
};