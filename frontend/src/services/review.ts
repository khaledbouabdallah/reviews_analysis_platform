// src/services/review.ts
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ProcessedData {
  cleaned_text?: string | null;
  translated_text?: string | null;
  detected_language?: string | null;
  sentiment?: {
    label: string; // 'positive', 'negative', 'neutral'
    score: number; // confidence score
  } | null;
  processing_status: string; // 'pending', 'completed', 'failed'
  processed_at?: string | null;
  error_message?: string | null;
  // Future fields
  segment?: string | null;
  topic?: string | null;
  spam_detection?: boolean | null;
  urgency?: 'very_urgent' | 'urgent' | 'moderate' | 'low' | 'not_urgent' | null;
  relevance?: number | null;
}

export interface Review {
  _id: string;
  user_id: string;
  business_id: string;
  location_id?: string | null;
  source_id: string;
  job_id: string;
  data: {
    // Common fields
    username?: string;
    rating?: number;
    date?: string;
    likes?: number;
    
    // Google Maps specific
    translated_text?: string;
    original_text?: string;
    Food?: string;
    Service?: string;
    Atmosphere?: string;
    
    // CSV or other sources might have different fields
    [key: string]: any;
  };
  source_type: string;
  created_at: string;
  analyzed_data?: ProcessedData | null;
}

export interface ReviewFilters {
  job_id?: string;
  source_id?: string;
  location_id?: string;
  business_id?: string;
  sentiment?: string;
  rating?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  has_comment?: string;
  language?: string;
  spam_status?: string;
  urgency?: string;
  topic?: string;
  processing_status?: string;
}

export class ReviewService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async getReviews(filters: ReviewFilters = {}): Promise<Review[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = `/api/reviews/${queryString ? `?${queryString}` : ''}`;
      
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async getReviewsByJob(jobId: string): Promise<Review[]> {
    return this.getReviews({ job_id: jobId });
  }

  async getReviewsByBusiness(businessId: string): Promise<Review[]> {
    return this.getReviews({ business_id: businessId });
  }

  // Utility methods for extracting data consistently
  getDisplayText(review: Review): string {
    // Priority: cleaned_text > translated_text > original_text > fallback
    if (review.analyzed_data?.cleaned_text) {
      return review.analyzed_data.cleaned_text;
    }
    
    if (review.data?.translated_text) {
      return review.data.translated_text;
    }
    
    if (review.data?.original_text) {
      return review.data.original_text;
    }
    
    // Look for other text fields in data
    const textFields = ['comment', 'review', 'text', 'content'];
    for (const field of textFields) {
      if (review.data?.[field]) {
        return review.data[field];
      }
    }
    
    return ''; // No comment available
  }

  getRating(review: Review): number {
    return review.data?.rating || 0;
  }

  getDate(review: Review): string {
    return review.data?.date || review.created_at;
  }

  getUsername(review: Review): string {
    return review.data?.username || review.data?.reviewer || review.data?.name || 'Anonymous';
  }

  getSentiment(review: Review): string {
    return review.analyzed_data?.sentiment?.label || 'unknown';
  }

  getSentimentScore(review: Review): number {
    return review.analyzed_data?.sentiment?.score || 0;
  }

  getSentimentColor(sentiment: string): string {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  }

  getLanguage(review: Review): string {
    return review.analyzed_data?.detected_language || 'unknown';
  }

  hasComment(review: Review): boolean {
    return this.getDisplayText(review).trim() !== '';
  }

  isProcessed(review: Review): boolean {
    return review.analyzed_data?.processing_status === 'completed';
  }

  getProcessingStatus(review: Review): string {
    return review.analyzed_data?.processing_status || 'not_processed';
  }

  // Future AI fields
  getTopic(review: Review): string {
    return review.analyzed_data?.topic || 'uncategorized';
  }

  getUrgency(review: Review): string {
    return review.analyzed_data?.urgency || 'unknown';
  }

  isSpam(review: Review): boolean {
    return review.analyzed_data?.spam_detection || false;
  }

  // Export functionality
  async exportReviews(reviews: Review[]): Promise<void> {
    const csvData = this.convertToCSV(reviews);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reviews_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(reviews: Review[]): string {
    if (reviews.length === 0) return '';

    const headers = [
      'Date',
      'Username',
      'Rating',
      'Comment',
      'Sentiment',
      'Sentiment Score',
      'Language',
      'Source Type',
      'Processing Status',
      'Topic',
      'Urgency',
      'Spam'
    ];

    const rows = reviews.map(review => [
      this.getDate(review),
      this.getUsername(review),
      this.getRating(review),
      this.getDisplayText(review).replace(/"/g, '""'), // Escape quotes
      this.getSentiment(review),
      this.getSentimentScore(review),
      this.getLanguage(review),
      review.source_type,
      this.getProcessingStatus(review),
      this.getTopic(review),
      this.getUrgency(review),
      this.isSpam(review)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Statistics helpers
  getAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + this.getRating(review), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  getSentimentDistribution(reviews: Review[]): { positive: number; negative: number; neutral: number; unknown: number } {
    const distribution = { positive: 0, negative: 0, neutral: 0, unknown: 0 };
    
    reviews.forEach(review => {
      const sentiment = this.getSentiment(review).toLowerCase();
      if (sentiment in distribution) {
        distribution[sentiment as keyof typeof distribution]++;
      } else {
        distribution.unknown++;
      }
    });

    return distribution;
  }

  getRatingDistribution(reviews: Review[]): Record<number, number> {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      const rating = this.getRating(review);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  }
}

export const reviewService = new ReviewService();