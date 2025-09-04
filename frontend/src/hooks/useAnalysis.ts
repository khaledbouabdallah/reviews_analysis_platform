// src/hooks/useAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analysisService, AnalysisRequest, AnalysisResult } from '../services/analysis'

// UPDATED: Add override_analysis support to all analysis hooks
export const useAnalyzeJobReviews = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ jobId, request }: { jobId: string, request?: AnalysisRequest }) =>
      analysisService.analyzeJobReviews(jobId, request),
    onSuccess: (result: AnalysisResult) => {
      // Invalidate job lists to show new analysis job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      
      // If we have the original job info, we could invalidate business-specific queries
      // but since we don't have access to that here, we'll let the jobs page handle refresh
    }
  })
}

export const useAnalyzeSourceReviews = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sourceId, request }: { sourceId: string, request?: AnalysisRequest }) =>
      analysisService.analyzeSourceReviews(sourceId, request),
    onSuccess: (result: AnalysisResult) => {
      // Invalidate job lists to show new analysis job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export const useAnalyzeLocationReviews = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ locationId, request }: { locationId: string, request?: AnalysisRequest }) =>
      analysisService.analyzeLocationReviews(locationId, request),
    onSuccess: (result: AnalysisResult) => {
      // Invalidate job lists to show new analysis job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export const useAnalyzeBusinessReviews = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ businessId, request }: { businessId: string, request?: AnalysisRequest }) =>
      analysisService.analyzeBusinessReviews(businessId, request),
    onSuccess: (result: AnalysisResult) => {
      // Invalidate job lists to show new analysis job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export const useAnalyzeSingleReview = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ reviewId, request }: { reviewId: string, request?: AnalysisRequest }) =>
      analysisService.analyzeSingleReview(reviewId, request),
    onSuccess: () => {
      // Invalidate reviews queries to show updated analysis
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    }
  })
}