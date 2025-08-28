// src/hooks/useSources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sourceService, Source, SourceCreate, SourceUpdate } from '../services/source'

// ✅ Get all sources for user
export const useSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => sourceService.getSources(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Get single source by ID
export const useSource = (sourceId: string) => {
  return useQuery({
    queryKey: ['sources', sourceId],
    queryFn: () => sourceService.getSource(sourceId),
    enabled: !!sourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Get sources by business ID
export const useSourcesByBusiness = (businessId: string) => {
  return useQuery({
    queryKey: ['sources', 'business', businessId],
    queryFn: () => sourceService.getSourcesByBusiness(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Create new source
export const useCreateSource = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SourceCreate) => sourceService.createSource(data),
    onSuccess: (newSource) => {
      // Add to all sources list
      queryClient.setQueryData(['sources'], (old: Source[] = []) =>
        [...old, newSource]
      )
      
      // Add to business-specific sources list
      queryClient.setQueryData(['sources', 'business', newSource.business_id], (old: Source[] = []) =>
        [...old, newSource]
      )
      
      // Invalidate business counts since source count changed
      queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', newSource.business_id] })
      
      // If source has location_id, invalidate location stats too
      if (newSource.location_id) {
        queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', newSource.location_id] })
      }
    }
  })
}

// ✅ Update source
export const useUpdateSource = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: SourceUpdate }) =>
      sourceService.updateSource(id, data),
    onSuccess: (updatedSource) => {
      // Update all sources list
      queryClient.setQueryData(['sources'], (old: Source[] = []) =>
        old.map(source =>
          source.id === updatedSource.id ? updatedSource : source
        )
      )
      
      // Update business-specific sources list
      queryClient.setQueryData(['sources', 'business', updatedSource.business_id], (old: Source[] = []) =>
        old.map(source =>
          source.id === updatedSource.id ? updatedSource : source
        )
      )
      
      // Update single source cache
      queryClient.setQueryData(['sources', updatedSource.id], updatedSource)
      
      // If source has location_id, invalidate location stats
      if (updatedSource.location_id) {
        queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', updatedSource.location_id] })
      }
    }
  })
}

// ✅ Delete source
export const useDeleteSource = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sourceId: string) => sourceService.deleteSource(sourceId),
    onSuccess: (_, deletedId) => {
      // Get the source before deletion to know which business/location it belonged to
      const allSources = queryClient.getQueryData<Source[]>(['sources']) || []
      const deletedSource = allSources.find(source => source.id === deletedId)
      
      // Remove from all sources list
      queryClient.setQueryData(['sources'], (old: Source[] = []) =>
        old.filter(source => source.id !== deletedId)
      )
      
      // Remove from business-specific sources list if we know the business
      if (deletedSource) {
        queryClient.setQueryData(['sources', 'business', deletedSource.business_id], (old: Source[] = []) =>
          old.filter(source => source.id !== deletedId)
        )
        
        // Invalidate business counts since source count changed
        queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', deletedSource.business_id] })
        
        // If source had location_id, invalidate location stats too
        if (deletedSource.location_id) {
          queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', deletedSource.location_id] })
        }
      }
      
      // Remove single source cache
      queryClient.removeQueries({ queryKey: ['sources', deletedId] })
      
      // Remove source stats cache
      queryClient.removeQueries({ queryKey: ['stats', 'source-stats', deletedId] })
    }
  })
}

// ✅ Get source stats
export const useSourceStats = (sourceId: string) => {
  return useQuery({
    queryKey: ['stats', 'source-stats', sourceId],
    queryFn: () => sourceService.getSourceStats(sourceId),
    enabled: !!sourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}