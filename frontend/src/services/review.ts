// // src/services/review.ts
// import { authService } from './auth';
// import { BusinessStorageService } from '@/services/businessStorage';

// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// // Analysis schemas matching backend structure
// export interface LanguageAnalysis {
//   detected_language: string; // ISO 639-1 language code
// }

// export interface TranslationAnalysis {
//   english_translation: string;
// }

// export interface SentimentAnalysis {
//   label: 'positive' | 'negative' | 'neutral';
//   confidence: number;
//   emotional_tone: 'angry' | 'frustrated' | 'happy' | 'disappointed' | 'satisfied' | 'neutral';
//   reasoning: string;
// }

// export interface TopicAnalysis {
//   topic: string;
//   sentiment: 'positive' | 'negative' | 'neutral';
//   confidence: number;
//   mentions: string[];
// }

// export interface SpamDetection {
//   is_spam: boolean;
//   confidence: number;
//   red_flags: string[];
//   reasoning: string;
// }

// export interface UrgencyClassification {
//   level: 'critical' | 'high' | 'medium' | 'low' | 'none';
//   requires_immediate_response: boolean;
//   escalation_needed: boolean;
//   reasoning: string;
// }

// export interface BusinessInsights {
//   main_issues: string[];
//   positive_highlights: string[];
//   actionable_recommendations: string[];
//   estimated_impact: 'high' | 'medium' | 'low';
//   follow_up_needed: boolean;
// }

// export interface AnalyzedData {
//   analysis_results?: {
//     // FIXED: Match actual backend field names
//     language_analysis?: LanguageAnalysis;  // Changed from language_detection
//     translation_analysis?: TranslationAnalysis;
//     sentiment?: SentimentAnalysis;
//     topics?: TopicAnalysis[];
//     spam_detection?: SpamDetection;
//     urgency_classification?: UrgencyClassification;  // Changed from urgency
//     business_insights?: BusinessInsights;
//   };
//   processing_status: 'pending' | 'completed' | 'failed';
//   processed_at?: string;
//   error_message?: string;
// }

// export interface Review {
//   _id: string;
//   user_id: string;
//   business_id: string;
//   location_id?: string | null;
//   source_id: string;
//   job_id: string;
//   data: {
//     // Common fields
//     username?: string;
//     rating?: number;
//     date?: string;
//     likes?: number;
    
//     // Google Maps specific
//     translated_text?: string;
//     original_text?: string;
//     Food?: string;
//     Service?: string;
//     Atmosphere?: string;
    
//     // CSV or other sources might have different fields
//     [key: string]: any;
//   };
//   source_type: string;
//   created_at: string;
//   analyzed_data?: AnalyzedData | null;
// }

// export interface ReviewFilters {
//   job_id?: string;
//   source_id?: string;
//   location_id?: string;
//   business_id?: string;
//   sentiment?: string;
//   rating?: string;
//   date_from?: string;
//   date_to?: string;
//   search?: string;
//   has_comment?: string;
//   language?: string;
//   spam_status?: string;
//   urgency?: string;
//   topic?: string;
//   processing_status?: string;
//   // New analysis filters
//   has_analyzed_data?: string; // 'yes' | 'no' | ''
//   sentiment_label?: string; // 'positive' | 'negative' | 'neutral' | ''
//   emotional_tone?: string;
//   spam_detection?: string; // 'spam' | 'not_spam' | ''
//   urgency_level?: string;
//   detected_language?: string;
// }

// export class ReviewService {

//   private entitiesCache: {
//     sources: Array<{id: string, name: string}>;
//     jobs: Array<{id: string, name: string}>;
//     locations: Array<{id: string, name: string}>;
//   } | null = null;

//   private async fetchWithAuth(url: string, options: RequestInit = {}) {
//     const headers = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     };

//     const response = await fetch(`${API_URL}${url}`, {
//       ...options,
//       headers,
//       credentials: 'include', 
//     });

//     if (!response.ok) {
//       if (response.status === 401) {
//         await authService.logout();
//         window.location.href = '/login';
//       }
//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(errorData.detail || `API Error: ${response.status}`);
//     }

//     return response.json();
//   }

//   async getReviews(filters: ReviewFilters = {}): Promise<Review[]> {
//     try {
//       await this.loadEntitiesCache();
//       // Build query parameters
//       const params = new URLSearchParams();
//       Object.entries(filters).forEach(([key, value]) => {
//         if (value && value.toString().trim()) {
//           params.append(key, value.toString());
//         }
//       });

//       const queryString = params.toString();
//       const url = `/api/reviews/${queryString ? `?${queryString}` : ''}`;
//       const reviews = await this.fetchWithAuth(url);
//       const current_business_id = BusinessStorageService.getCurrentBusiness();
//       return reviews.filter((review: Review) => review.business_id === current_business_id)
//     } catch (error) {
//       console.error('Error fetching reviews:', error);
//       throw error;
//     }
//   }

//   async getReviewsByBusiness(businessId: string): Promise<Review[]> {
//     try {
//       return await this.getReviews({ business_id: businessId });
//     } catch (error) {
//       console.error('Error fetching reviews by business:', error);
//       throw error;
//     }
//   }

//   async getReview(id: string): Promise<Review> {
//     return await this.fetchWithAuth(`/api/reviews/${id}`);
//   }

//   async exportReviews(reviews: Review[]): Promise<void> {
//     // Simple CSV export
//     const headers = ['Date', 'Reviewer', 'Rating', 'Text', 'Source', 'Sentiment', 'Language', 'Translation'];
//     const rows = reviews.map(review => [
//       this.getDate(review),
//       this.getReviewer(review),
//       this.getRating(review)?.toString() || '',
//       this.getDisplayText(review).replace(/,/g, ';'), // Replace commas to avoid CSV issues
//       this.getSource(review),
//       this.getSentiment(review),
//       this.getDetectedLanguage(review),
//       this.getTranslation(review).replace(/,/g, ';') // ADDED: Include translation
//     ]);

//     const csvContent = [headers, ...rows]
//       .map(row => row.map(cell => `"${cell}"`).join(','))
//       .join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }

//   // Helper methods - FIXED to match backend structure
//   getDisplayText(review: Review): string {
//     return review.data?.original_text || 
//            review.data?.translated_text || 
//            review.data?.text || 
//            review.data?.comment || 
//            '';
//   }

//   // ADDED: New method to get translation
//   getTranslation(review: Review): string {
//     return review.analyzed_data?.analysis_results?.translation_analysis?.english_translation || 
//            review.data?.translated_text || 
//            '';
//   }

//   getReviewer(review: Review): string {
//     return review.data?.username || 'Anonymous';
//   }

//   getRating(review: Review): number | null {
//     return review.data?.rating || null;
//   }

//   getDate(review: Review): string {
//     return review.data?.date || review.created_at || '';
//   }

//   getSource(review: Review): string {
//     return review.source_type || 'Unknown';
//   }

//   getSentiment(review: Review): string {
//     return review.analyzed_data?.analysis_results?.sentiment?.label || 'Unknown';
//   }

//   // FIXED: Use correct backend field name
//   getDetectedLanguage(review: Review): string {
//     return review.analyzed_data?.analysis_results?.language_analysis?.detected_language || 'Unknown';
//   }

//   isAnalyzed(review: Review): boolean {
//     return !!(review.analyzed_data?.analysis_results);
//   }

//   getAnalysisStatus(review: Review): string {
//     if (!review.analyzed_data) return 'Not Processed';
//     return review.analyzed_data.processing_status === 'completed' ? 'Analyzed' : 
//            review.analyzed_data.processing_status === 'failed' ? 'Failed' : 'Processing';
//   }

//   getAverageRating(reviews: Review[]): number {
//     const ratingsWithValues = reviews.filter(review => this.getRating(review) !== null);
//     if (ratingsWithValues.length === 0) return 0;
    
//     const sum = ratingsWithValues.reduce((acc, review) => acc + (this.getRating(review) || 0), 0);
//     return Math.round((sum / ratingsWithValues.length) * 10) / 10; // Round to 1 decimal
//   }

//   getSentimentDistribution(reviews: Review[]): { positive: number; negative: number; neutral: number } {
//     const distribution = { positive: 0, negative: 0, neutral: 0 };
    
//     reviews.forEach(review => {
//       const sentiment = review.analyzed_data?.analysis_results?.sentiment?.label;
//       if (sentiment === 'positive') distribution.positive++;
//       else if (sentiment === 'negative') distribution.negative++;
//       else if (sentiment === 'neutral') distribution.neutral++;
//     });
    
//     return distribution;
//   }

//   getRatingDistribution(reviews: Review[]): Record<number, number> {
//     const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
//     reviews.forEach(review => {
//       const rating = this.getRating(review);
//       if (rating && rating >= 1 && rating <= 5) {
//         distribution[rating]++;
//       }
//     });
    
//     return distribution;
//   }

//   hasComment(review: Review): boolean {
//     return this.getDisplayText(review).trim() !== '';
//   }

//   isProcessed(review: Review): boolean {
//     return this.isAnalyzed(review);
//   }

//   // ADDED: Helper methods for specific analysis results
//   getEmotionalTone(review: Review): string {
//     return review.analyzed_data?.analysis_results?.sentiment?.emotional_tone || 'Unknown';
//   }

//   getUrgencyLevel(review: Review): string {
//     return review.analyzed_data?.analysis_results?.urgency_classification?.level || 'Unknown';
//   }

//   isSpam(review: Review): boolean | null {
//     const spamData = review.analyzed_data?.analysis_results?.spam_detection;
//     return spamData ? spamData.is_spam : null;
//   }

//   getTopics(review: Review): TopicAnalysis[] {
//     return review.analyzed_data?.analysis_results?.topics || [];
//   }

//   getBusinessInsights(review: Review): BusinessInsights | null {
//     return review.analyzed_data?.analysis_results?.business_insights || null;
//   }

//   // Add these methods to fetch entities
// async getSources(): Promise<Array<{id: string, name: string}>> {
//   try {
//     const sources = await this.fetchWithAuth('/api/sources');

//     return sources.map((source: any) => ({
//       id: source.id,
//       name: source.name || source.business_name || 'Unknown Source'
//     }));
//   } catch (error) {
//     console.error('Error fetching sources:', error);
//     return [];
//   }
// }

// async getJobs(): Promise<Array<{id: string, name: string}>> {
//   try {
//     const jobs = await this.fetchWithAuth('/api/jobs');
//     return jobs.map((job: any) => ({
//       id: job.id,
//       name: job.name || `Job ${job._id.slice(-8)}` || 'Unknown Job'
//     }));
//   } catch (error) {
//     console.error('Error fetching jobs:', error);
//     return [];
//   }
// }

// async getLocations(): Promise<Array<{id: string, name: string}>> {
//   try {
//     const locations = await this.fetchWithAuth('/api/locations');
//     return locations.map((location: any) => ({
//       id: location.id,
//       name: location.name || location.address || 'Unknown Location'
//     }));
//   } catch (error) {
//     console.error('Error fetching locations:', error);
//     return [];
//   }
// }

// private async loadEntitiesCache() {
//   if (!this.entitiesCache) {
//     const [sources, jobs, locations] = await Promise.all([
//       this.getSources(),
//       this.getJobs(),
//       this.getLocations()
//     ]);
//     this.entitiesCache = { sources, jobs, locations };
//   }
// }

// getSourceName(review: Review): string {
//   if (!this.entitiesCache) return review.source_type || 'Unknown Source';
//   const source = this.entitiesCache.sources.find(s => s.id === review.source_id);
//   console.error('Source not found in cache:', review.source_id, this.entitiesCache.sources);
//   return source?.name || review.source_type || 'Unknown Source';
// }

// getJobName(review: Review): string {
//   if (!this.entitiesCache) return `Job ${review.job_id.slice(-8)}`;
//   const job = this.entitiesCache.jobs.find(j => j.id === review.job_id);
//   return job?.name || `Job ${review.job_id.slice(-8)}`;
// }

// getLocationName(review: Review): string {
//   if (!review.location_id) return 'No Location';
//   if (!this.entitiesCache) return `Location ${review.location_id.slice(-8)}`;
//   const location = this.entitiesCache.locations.find(l => l.id === review.location_id);
//   return location?.name || `Location ${review.location_id.slice(-8)}`;
// }

// }

// export const reviewService = new ReviewService();