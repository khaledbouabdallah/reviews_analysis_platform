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
}

export interface ReviewUpdate {
  data?: Record<string, any>;
  source_type?: SourceType;
}

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
export const getReviewText = (review: Review): string => {
  // Try to get translated text first, then original text
  if (review.analyzed_data?.translation?.english_translation) {
    return review.analyzed_data.translation.english_translation;
  }
  
  return review.data?.original_text || review.data?.translated_text || 'No text available';
};

// Helper function to check if review needs attention
export const reviewNeedsAttention = (review: Review): boolean => {
  const urgency = review.analyzed_data?.urgency;
  const spam = review.analyzed_data?.spam_detection;
  
  return urgency?.requires_immediate_response || 
         urgency?.escalation_needed || 
         (spam?.is_spam && spam.confidence > 0.8) ||
         false;
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

  // Get all reviews for user
  async getReviews(): Promise<Review[]> {
    try {
      return await this.fetchWithAuth('/api/reviews/');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
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

  // Get reviews by business ID
  async getReviewsByBusiness(businessId: string): Promise<Review[]> {
    try {
      return await this.fetchWithAuth(`/api/reviews/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching reviews by business:', error);
      throw error;
    }
  }

  // Get reviews by job ID
  async getReviewsByJob(jobId: string): Promise<Review[]> {
    try {
      return await this.fetchWithAuth(`/api/reviews/job/${jobId}`);
    } catch (error) {
      console.error('Error fetching reviews by job:', error);
      throw error;
    }
  }

  // Get reviews by source ID
  async getReviewsBySource(sourceId: string): Promise<Review[]> {
    try {
      return await this.fetchWithAuth(`/api/reviews/source/${sourceId}`);
    } catch (error) {
      console.error('Error fetching reviews by source:', error);
      throw error;
    }
  }

  // Get reviews by location ID
  async getReviewsByLocation(locationId: string): Promise<Review[]> {
    try {
      return await this.fetchWithAuth(`/api/reviews/location/${locationId}`);
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

  // Analysis-specific methods
  async getAnalyzedReviews(): Promise<Review[]> {
    try {
      const reviews = await this.getReviews();
      return reviews.filter(review => review.analyzed_data);
    } catch (error) {
      console.error('Error fetching analyzed reviews:', error);
      throw error;
    }
  }

  async getReviewsNeedingAttention(): Promise<Review[]> {
    try {
      const reviews = await this.getReviews();
      return reviews.filter(reviewNeedsAttention);
    } catch (error) {
      console.error('Error fetching reviews needing attention:', error);
      throw error;
    }
  }

  async getReviewsBySentiment(sentiment: SentimentLabel): Promise<Review[]> {
    try {
      const reviews = await this.getReviews();
      return reviews.filter(review => 
        review.analyzed_data?.sentiment?.label === sentiment
      );
    } catch (error) {
      console.error('Error fetching reviews by sentiment:', error);
      throw error;
    }
  }

  async getSpamReviews(): Promise<Review[]> {
    try {
      const reviews = await this.getReviews();
      return reviews.filter(review => 
        review.analyzed_data?.spam_detection?.is_spam
      );
    } catch (error) {
      console.error('Error fetching spam reviews:', error);
      throw error;
    }
  }

  // Utility methods
  getReviewUrl(reviewId: string): string {
    return `/reviews/${reviewId}`;
  }

  // Get reviews with pagination (if backend supports it)
  async getReviewsPaginated(page: number = 1, limit: number = 50): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      return await this.fetchWithAuth(`/api/reviews/?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('Error fetching paginated reviews:', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();