// frontend/src/types/analytics.ts
import { Review, SentimentLabel, UrgencyLevel, EmotionalTone } from '@/services/review';

export interface AnalyticsFilters {
  dateRange: { from: Date; to: Date } | null;
  locationId: string | null;
  sentiment: SentimentLabel | 'all';
  includeSpam: boolean;
  hasAnalysis: boolean | 'all';
  compareLocation: string | null;
}

export interface SentimentData {
  name: string;
  value: number;
  color: string;
}

export interface TopicData {
  topic: string;
  count: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface TimeSeriesData {
  date: string;
  displayDate: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avgRating: number;
  ratingCount: number;
}

export interface UrgencyData {
  level: string;
  count: number;
  color: string;
}

export interface EmotionalToneData {
  tone: string;
  count: number;
  fullMark: number;
}

export interface ProcessedAnalyticsData {
  totalReviews: number;
  analyzedCount: number;
  spamCount: number;
  grouping: 'day' | 'week' | 'month';
  sentimentData: SentimentData[];
  topicData: TopicData[];
  urgencyData: UrgencyData[];
  emotionalToneData: EmotionalToneData[];
  timeSeriesData: TimeSeriesData[];
  topIssues: string[];
  topHighlights: string[];
  needsAttention: Review[];
}