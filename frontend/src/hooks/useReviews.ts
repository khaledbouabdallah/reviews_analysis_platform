// frontend/src/hooks/useReviews.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  reviewService, 
  Review, 
  ReviewUpdate,
  ReviewFilters,
  SentimentLabel,
  PaginatedReviewResponse,
  getAnalysisResults,
  getReviewSentiment,
  reviewNeedsAttention,
  isReviewSpam
} from '../services/review'

// Get single review by ID
export const useReview = (reviewId: string) => {
  return useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: () => reviewService.getReview(reviewId),
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// PRIMARY: Get reviews by business ID with optional filters
export const useReviewsByBusiness = (businessId: string, filters: ReviewFilters = {}) => {
  return useQuery({
    queryKey: ['reviews', 'business', businessId, filters],
    queryFn: () => reviewService.getReviewsByBusiness(businessId, filters),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Get paginated reviews by business
export const useReviewsByBusinessPaginated = (
  businessId: string, 
  page: number = 1, 
  limit: number = 50,
  filters: Omit<ReviewFilters, 'skip' | 'limit'> = {}
) => {
  return useQuery({
    queryKey: ['reviews', 'business', businessId, 'paginated', page, limit, filters],
    queryFn: () => reviewService.getReviewsByBusinessPaginated(businessId, page, limit, filters),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous page data while loading
  })
}

// Get reviews by job ID
export const useReviewsByJob = (jobId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}) => {
  return useQuery({
    queryKey: ['reviews', 'job', jobId, filters],
    queryFn: () => reviewService.getReviewsByJob(jobId, filters),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Get reviews by source ID
export const useReviewsBySource = (sourceId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}) => {
  return useQuery({
    queryKey: ['reviews', 'source', sourceId, filters],
    queryFn: () => reviewService.getReviewsBySource(sourceId, filters),
    enabled: !!sourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Get reviews by location ID
export const useReviewsByLocation = (locationId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}) => {
  return useQuery({
    queryKey: ['reviews', 'location', locationId, filters],
    queryFn: () => reviewService.getReviewsByLocation(locationId, filters),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Convenience hooks for common filters
export const useAnalyzedReviewsByBusiness = (businessId: string, filters: ReviewFilters = {}) => {
  return useReviewsByBusiness(businessId, { ...filters, has_analysis: true })
}

export const useReviewsNeedingAttentionByBusiness = (businessId: string, filters: ReviewFilters = {}) => {
  return useReviewsByBusiness(businessId, { ...filters, needs_attention: true })
}

export const useReviewsBySentimentByBusiness = (businessId: string, sentiment: SentimentLabel, filters: ReviewFilters = {}) => {
  return useReviewsByBusiness(businessId, { ...filters, sentiment })
}

export const useSpamReviewsByBusiness = (businessId: string, filters: ReviewFilters = {}) => {
  return useReviewsByBusiness(businessId, { ...filters, is_spam: true })
}

// Update review
export const useUpdateReview = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: ReviewUpdate }) =>
      reviewService.updateReview(id, data),
    onSuccess: (updatedReview) => {
      // Update single review cache
      queryClient.setQueryData(['reviews', updatedReview.id], updatedReview)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['reviews', 'business', updatedReview.business_id], 
        exact: false 
      })
      
      if (updatedReview.job_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['reviews', 'job', updatedReview.job_id], 
          exact: false 
        })
      }
      
      if (updatedReview.source_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['reviews', 'source', updatedReview.source_id], 
          exact: false 
        })
      }
      
      if (updatedReview.location_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['reviews', 'location', updatedReview.location_id], 
          exact: false 
        })
      }
    }
  })
}

// Delete review
export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => reviewService.deleteReview(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['reviews', deletedId] })
      
      // Get the review data before deletion if available
      const deletedReview = queryClient.getQueryData(['reviews', deletedId]) as Review
      
      if (deletedReview) {
        // Invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: ['reviews', 'business', deletedReview.business_id], 
          exact: false 
        })
        
        if (deletedReview.job_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['reviews', 'job', deletedReview.job_id], 
            exact: false 
          })
        }
        
        if (deletedReview.source_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['reviews', 'source', deletedReview.source_id], 
            exact: false 
          })
        }
        
        if (deletedReview.location_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['reviews', 'location', deletedReview.location_id], 
            exact: false 
          })
        }
        
        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', deletedReview.business_id] })
        
        if (deletedReview.location_id) {
          queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', deletedReview.location_id] })
        }
      } else {
        // Fallback: invalidate all review queries
        queryClient.invalidateQueries({ queryKey: ['reviews'], exact: false })
      }
    }
  })
}

// **FIXED: Helper hook for review stats by business**
export const useReviewStatsByBusiness = (businessId: string, filters: ReviewFilters = {}) => {
  const { data: reviews = [], isLoading } = useReviewsByBusiness(businessId, filters)
  
  const stats = {
    total: reviews.length,
    analyzed: reviews.filter(r => getAnalysisResults(r)).length,
    needingAttention: reviews.filter(reviewNeedsAttention).length,
    positive: reviews.filter(r => getReviewSentiment(r) === 'positive').length,
    negative: reviews.filter(r => getReviewSentiment(r) === 'negative').length,
    neutral: reviews.filter(r => getReviewSentiment(r) === 'neutral').length,
    spam: reviews.filter(isReviewSpam).length,
    avgRating: reviews.reduce((acc, r) => {
      const rating = r.data?.rating
      return typeof rating === 'number' ? acc + rating : acc
    }, 0) / reviews.filter(r => typeof r.data?.rating === 'number').length || 0
  }
  
  return { stats, isLoading }
}

// **FIXED: Helper hook for review stats by job**
export const useReviewStatsByJob = (jobId: string, filters: Pick<ReviewFilters, 'skip' | 'limit'> = {}) => {
  const { data: reviews = [], isLoading } = useReviewsByJob(jobId, filters)
  
  const stats = {
    total: reviews.length,
    analyzed: reviews.filter(r => getAnalysisResults(r)).length,
    needingAttention: reviews.filter(reviewNeedsAttention).length,
    positive: reviews.filter(r => getReviewSentiment(r) === 'positive').length,
    negative: reviews.filter(r => getReviewSentiment(r) === 'negative').length,
    neutral: reviews.filter(r => getReviewSentiment(r) === 'neutral').length,
    spam: reviews.filter(isReviewSpam).length,
  }
  
  return { stats, isLoading }
}

// Advanced search across multiple filters
export const useAdvancedReviewSearch = (
  businessId: string,
  searchFilters: {
    sentiment?: SentimentLabel;
    hasAnalysis?: boolean;
    needsAttention?: boolean;
    isSpam?: boolean;
    jobId?: string;
    sourceId?: string;
    locationId?: string;
    dateRange?: { start: string; end: string };
  }
) => {
  const filters: ReviewFilters = {}
  
  if (searchFilters.sentiment) filters.sentiment = searchFilters.sentiment
  if (searchFilters.hasAnalysis !== undefined) filters.has_analysis = searchFilters.hasAnalysis
  if (searchFilters.needsAttention) filters.needs_attention = searchFilters.needsAttention
  if (searchFilters.isSpam !== undefined) filters.is_spam = searchFilters.isSpam
  if (searchFilters.jobId) filters.job_id = searchFilters.jobId
  if (searchFilters.sourceId) filters.source_id = searchFilters.sourceId
  if (searchFilters.locationId) filters.location_id = searchFilters.locationId
  
  return useReviewsByBusiness(businessId, filters)
}