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
  
  // Time series data - aggregate by week/month based on date spread
  const timeSeriesMap = new Map<string, { 
    total: number; 
    positive: number; 
    negative: number; 
    neutral: number;
    ratings: number[];
    avgRating: number;
  }>();
  
  // Business insights
  const allIssues: string[] = [];
  const allHighlights: string[] = [];
  const needsAttention: Review[] = [];
  
  let spamCount = 0;
  let analyzedCount = 0;

  // Determine time grouping frequency based on data spread
  const dates = reviews.map(review => {
    const reviewDate = review.data?.date || review.created_at;
    return new Date(reviewDate);
  }).sort((a, b) => a.getTime() - b.getTime());

  const getTimeGrouping = (dates: Date[]): 'day' | 'week' | 'month' => {
    if (dates.length === 0) return 'day';
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 60) return 'day';        // ≤2 months: daily
    if (daysDiff <= 365) return 'week';      // ≤1 year: weekly  
    return 'month';                          // >1 year: monthly
  };

  const grouping = getTimeGrouping(dates);

  const formatDateForGrouping = (date: Date, grouping: 'day' | 'week' | 'month'): string => {
    switch (grouping) {
      case 'day':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'week':
        // Get start of week (Monday)
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        startOfWeek.setDate(diff);
        return `${startOfWeek.getFullYear()}-W${Math.ceil(startOfWeek.getDate() / 7).toString().padStart(2, '0')}`;
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
  };

  reviews.forEach(review => {
    const analysisResults = getAnalysisResults(review);
    const sentiment = getReviewSentiment(review) || 'neutral';
    const urgency = getReviewUrgency(review) || 'none';
    const isSpam = isReviewSpam(review);
    const rating = typeof review.data?.rating === 'number' ? review.data.rating : null;
    
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
    
    // Time series data with dynamic grouping
    const reviewDate = review.data?.date || review.created_at;
    const dateKey = formatDateForGrouping(new Date(reviewDate), grouping);
    
    if (!timeSeriesMap.has(dateKey)) {
      timeSeriesMap.set(dateKey, { 
        total: 0, 
        positive: 0, 
        negative: 0, 
        neutral: 0,
        ratings: [],
        avgRating: 0
      });
    }
    const dayData = timeSeriesMap.get(dateKey)!;
    dayData.total++;
    dayData[sentiment]++;
    
    // Add rating if available
    if (rating !== null) {
      dayData.ratings.push(rating);
    }
    
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

  // Calculate average ratings and format time series data
  const timeSeriesData = Array.from(timeSeriesMap.entries())
    .map(([date, data]) => ({
      date,
      displayDate: formatDisplayDate(date, grouping),
      total: data.total,
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral,
      avgRating: data.ratings.length > 0 
        ? Math.round((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length) * 10) / 10
        : 0,
      ratingCount: data.ratings.length
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalReviews: reviews.length,
    analyzedCount,
    spamCount,
    grouping, // Add grouping info for chart display
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
    timeSeriesData,
    topIssues: Array.from(new Set(allIssues)).slice(0, 5),
    topHighlights: Array.from(new Set(allHighlights)).slice(0, 5),
    needsAttention: needsAttention.slice(0, 10)
  };
};

// Helper function to format display dates
const formatDisplayDate = (dateKey: string, grouping: 'day' | 'week' | 'month'): string => {
  switch (grouping) {
    case 'day':
      return new Date(dateKey).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case 'week':
      // Extract year and week number from format YYYY-W##
      const [year, weekPart] = dateKey.split('-W');
      return `Week ${weekPart}, ${year}`;
    case 'month':
      // Format YYYY-MM to "Jan 2024"
      const [yr, month] = dateKey.split('-');
      return new Date(parseInt(yr), parseInt(month) - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
  }
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