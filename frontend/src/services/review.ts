// src/services/review.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export type SourceType = 'google' | 'csv';
export type JobType = 'scraping' | 'analysis' | 'csv_upload';
export type SentimentLabel = 'positive' | 'negative' | 'neutral';
export type EmotionalTone = 'angry' | 'frustrated' | 'happy' | 'disappointed' | 'satisfied' | 'neutral';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface Review {
  id: string;
  user_id: string;
  business_id: string;
  location_id?: string | null;
  source_id?: string | null;
  job_id: string;
  data: Record<string, any>;
  source_type: SourceType;
  job_type: JobType;
  created_at: string;
  analyzed_data?: AnalyzedData | null;
}

export interface LanguageAnalysis {
  detected_language: string;
}

export interface TranslationAnalysis {
  english_translation: string;
}

export interface SentimentAnalysis {
  label: SentimentLabel;
  confidence: number;
  emotional_tone: EmotionalTone;
  reasoning: string;
}

export interface TopicAnalysis {
  topic: string;
  sentiment: SentimentLabel;
  confidence: number;
  mentions: string[];
}

export interface SpamDetection {
  is_spam: boolean;
  confidence: number;
  red_flags: string[];
  reasoning: string;
}

export interface UrgencyClassification {
  level: UrgencyLevel;
  requires_immediate_response: boolean;
  escalation_needed: boolean;
  reasoning: string;
}

export interface BusinessInsights {
  main_issues: string[];
  positive_highlights: string[];
  actionable_recommendations: string[];
  estimated_impact: ImpactLevel;
  follow_up_needed: boolean;
}

export interface AnalyzedData {
  language_detection?: LanguageAnalysis;
  translation?: TranslationAnalysis;
  sentiment?: SentimentAnalysis;
  topics?: TopicAnalysis[];
  spam_detection?: SpamDetection;
  urgency?: UrgencyClassification;
  business_insights?: BusinessInsights;
    analysis_results?: {
        language_analysis?: LanguageAnalysis;
        translation_analysis?: TranslationAnalysis;
        sentiment?: SentimentAnalysis;
        topics?: TopicAnalysis[];
        spam_detection?: SpamDetection;
        urgency_classification?: UrgencyClassification;
        business_insights?: BusinessInsights;
    };
}

export interface ReviewUpdate {
  data?: Record<string, any>;
  source_type?: SourceType;
}

export interface ReviewFilters {
  skip?: number;
  limit?: number;
  has_analysis?: boolean;
  needs_attention?: boolean;
  sentiment?: SentimentLabel;
  is_spam?: boolean;
  job_id?: string;
  source_id?: string;
  location_id?: string;
}

export interface PaginatedReviewResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
}

export const getAnalysisResults = (review: Review) => {
    return review.analyzed_data?.analysis_results;
  };

// Helper function to get sentiment color
export const getSentimentColor = (sentiment?: SentimentLabel): string => {
    if (!sentiment) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

// Helper function to get urgency color
export const getUrgencyColor = (urgency?: UrgencyLevel): string => {
    if (!urgency) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'none':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

// Helper function to get rating from review data
export const getReviewRating = (review: Review): number | null => {
  if (review.data?.rating && typeof review.data.rating === 'number') {
    return review.data.rating;
  }
  return null;
};

// Helper function to get review text
// **FIXED: Updated review text helper to check translation in nested structure**
export const getReviewText = (review: Review): string => {
    // Get analysis results from nested structure
    const analysisResults = getAnalysisResults(review);
    
    // Try to get translated text first from analysis results
    if (analysisResults?.translation_analysis?.english_translation) {
      return analysisResults.translation_analysis.english_translation;
    }
    
    // Fall back to original review data
    return review.data?.original_text || review.data?.translated_text || 'No text available';
  };
// Helper function to check if review needs attention
export const reviewNeedsAttention = (review: Review): boolean => {
    const analysisResults = getAnalysisResults(review);
    const urgency = analysisResults?.urgency_classification;
    const spam = analysisResults?.spam_detection;
    
    return urgency?.requires_immediate_response || 
           urgency?.escalation_needed || 
           (spam?.is_spam && spam.confidence > 0.8) ||
           false;
  };
  

// **NEW: Helper to get sentiment from nested structure**
export const getReviewSentiment = (review: Review): SentimentLabel | undefined => {
    const analysisResults = getAnalysisResults(review);
    return analysisResults?.sentiment?.label;
  };
  
  // **NEW: Helper to get urgency level from nested structure**
  export const getReviewUrgency = (review: Review): UrgencyLevel | undefined => {
    const analysisResults = getAnalysisResults(review);
    return analysisResults?.urgency_classification?.level;
  };
  
  // **NEW: Helper to check if review is spam from nested structure**
  export const isReviewSpam = (review: Review): boolean => {
    const analysisResults = getAnalysisResults(review);
    const spam = analysisResults?.spam_detection;
    return spam?.is_spam || false;
  };
  
  // **NEW: Helper to get topics from nested structure**
  export const getReviewTopics = (review: Review) => {
    const analysisResults = getAnalysisResults(review);
    return analysisResults?.topics || [];
  };
  
  // **NEW: Helper to get business insights from nested structure**
  export const getBusinessInsights = (review: Review) => {
    const analysisResults = getAnalysisResults(review);
    return analysisResults?.business_insights;
  };

// Helper function to build query string from filters
const buildQueryString = (filters: ReviewFilters = {}): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  return params.toString() ? `?${params.toString()}` : '';
};

export class ReviewService {
  // Match location service error handling pattern
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
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
      }
      
      // Preserve the actual error message from the API
      let errorDetail = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch {
        // If can't parse JSON, keep the generic error
      }
            
      const error = new Error(errorDetail) as any;
      error.response = { data: { detail: errorDetail } };
      throw error;
    }

    if (options.method === 'DELETE' || response.status === 204) {
      return response;
    }

    return response.json();
  }

  // Get single review by ID
  async getReview(id: string): Promise<Review> {
    try {
      return await this.fetchWithAuth(`/api/reviews/${id}`);
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  }

  // Primary method: Get reviews by business with optional filters
  async getReviewsByBusiness(businessId: string, filters: ReviewFilters = {}): Promise<Review[]> {
    try {
      const queryString = buildQueryString(filters);
      return await this.fetchWithAuth(`/api/reviews/business/${businessId}${queryString}`);
    } catch (error) {
      console.error('Error fetching reviews by business:', error);
      throw error;
    }
  }

  // Get paginated reviews by business
  async getReviewsByBusinessPaginated(
    businessId: string, 
    page: number = 1, 
    limit: number = 50,
    filters: Omit<ReviewFilters, 'skip' | 'limit'> = {}
  ): Promise<PaginatedReviewResponse> {
    try {
      const paginationParams = { page, limit };
      const queryString = buildQueryString({ ...filters, ...paginationParams });
      return await this.fetchWithAuth(`/api/reviews/business/${businessId}/paginated${queryString}`);
    } catch (error) {
      console.error('Error fetching paginated reviews by business:', error);
      throw error;
    }
  }

  // Get reviews by job ID
  async getReviewsByJob(jobId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}): Promise<Review[]> {
    try {
      const queryString = buildQueryString(filters);
      return await this.fetchWithAuth(`/api/reviews/job/${jobId}${queryString}`);
    } catch (error) {
      console.error('Error fetching reviews by job:', error);
      throw error;
    }
  }

  // Get reviews by source ID
  async getReviewsBySource(sourceId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}): Promise<Review[]> {
    try {
      const queryString = buildQueryString(filters);
      return await this.fetchWithAuth(`/api/reviews/source/${sourceId}${queryString}`);
    } catch (error) {
      console.error('Error fetching reviews by source:', error);
      throw error;
    }
  }

  // Get reviews by location ID
  async getReviewsByLocation(locationId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}): Promise<Review[]> {
    try {
      const queryString = buildQueryString(filters);
      return await this.fetchWithAuth(`/api/reviews/location/${locationId}${queryString}`);
    } catch (error) {
      console.error('Error fetching reviews by location:', error);
      throw error;
    }
  }

  // Update review
  async updateReview(reviewId: string, reviewData: ReviewUpdate): Promise<Review> {
    try {
      return await this.fetchWithAuth(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete review
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (response.status !== 204) {
        throw new Error('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Convenience methods for common filter combinations
  async getAnalyzedReviewsByBusiness(businessId: string, filters: ReviewFilters = {}): Promise<Review[]> {
    return this.getReviewsByBusiness(businessId, { ...filters, has_analysis: true });
  }

  async getReviewsNeedingAttentionByBusiness(businessId: string, filters: ReviewFilters = {}): Promise<Review[]> {
    return this.getReviewsByBusiness(businessId, { ...filters, needs_attention: true });
  }

  async getReviewsBySentimentByBusiness(businessId: string, sentiment: SentimentLabel, filters: ReviewFilters = {}): Promise<Review[]> {
    return this.getReviewsByBusiness(businessId, { ...filters, sentiment });
  }

  async getSpamReviewsByBusiness(businessId: string, filters: ReviewFilters = {}): Promise<Review[]> {
    return this.getReviewsByBusiness(businessId, { ...filters, is_spam: true });
  }

  // Utility methods
  getReviewUrl(reviewId: string): string {
    return `/reviews/${reviewId}`;
  }
}

export const reviewService = new ReviewService();