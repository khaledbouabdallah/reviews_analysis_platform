// src/services/analysis.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface AnalysisRequest {
  target_topics?: string[];
  business_context?: string;
}

export interface AnalysisResult {
  success: boolean;
  status: string;
  total_reviews: number;
  processed_count: number;
  failed_count: number;
  job_id: string;
  error?: string;
}

export class AnalysisService {
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

    return response.json();
  }

  // Analyze all reviews from a specific job
  async analyzeJobReviews(jobId: string, request: AnalysisRequest = {}): Promise<AnalysisResult> {
    try {
      return await this.fetchWithAuth(`/api/review_analyzer/batch/job/${jobId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error analyzing job reviews:', error);
      throw error;
    }
  }

  // Analyze all reviews from a specific source
  async analyzeSourceReviews(sourceId: string, request: AnalysisRequest = {}): Promise<AnalysisResult> {
    try {
      return await this.fetchWithAuth(`/api/review_analyzer/batch/source/${sourceId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error analyzing source reviews:', error);
      throw error;
    }
  }

  // Analyze all reviews from a specific location
  async analyzeLocationReviews(locationId: string, request: AnalysisRequest = {}): Promise<AnalysisResult> {
    try {
      return await this.fetchWithAuth(`/api/review_analyzer/batch/location/${locationId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error analyzing location reviews:', error);
      throw error;
    }
  }

  // Analyze all reviews from a specific business
  async analyzeBusinessReviews(businessId: string, request: AnalysisRequest = {}): Promise<AnalysisResult> {
    try {
      return await this.fetchWithAuth(`/api/review_analyzer/batch/business/${businessId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error analyzing business reviews:', error);
      throw error;
    }
  }

  // Analyze a single review (for completeness, though not used in Jobs page)
  async analyzeSingleReview(reviewId: string, request: AnalysisRequest = {}): Promise<any> {
    try {
      return await this.fetchWithAuth(`/api/review_analyzer/single/${reviewId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error analyzing single review:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();