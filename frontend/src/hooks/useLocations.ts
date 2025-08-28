// src/hooks/useLocations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationService, Location, LocationCreate, LocationUpdate } from '../services/location'

// ✅ Get all locations for user
export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.getLocations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Get single location by ID
export const useLocation = (locationId: string) => {
  return useQuery({
    queryKey: ['locations', locationId],
    queryFn: () => locationService.getLocation(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Get locations by business ID
export const useLocationsByBusiness = (businessId: string) => {
  return useQuery({
    queryKey: ['locations', 'business', businessId],
    queryFn: () => locationService.getLocationsByBusiness(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Create new location
export const useCreateLocation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LocationCreate) => locationService.createLocation(data),
    onSuccess: (newLocation) => {
      // Add to all locations list
      queryClient.setQueryData(['locations'], (old: Location[] = []) =>
        [...old, newLocation]
      )
      
      // Add to business-specific locations list
      queryClient.setQueryData(['locations', 'business', newLocation.business_id], (old: Location[] = []) =>
        [...old, newLocation]
      )
      
      // Invalidate business counts since location count changed
      queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', newLocation.business_id] })
    }
  })
}

// ✅ Update location
export const useUpdateLocation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: LocationUpdate }) =>
      locationService.updateLocation(id, data),
    onSuccess: (updatedLocation) => {
      // Update all locations list
      queryClient.setQueryData(['locations'], (old: Location[] = []) =>
        old.map(location =>
          location.id === updatedLocation.id ? updatedLocation : location
        )
      )
      
      // Update business-specific locations list
      queryClient.setQueryData(['locations', 'business', updatedLocation.business_id], (old: Location[] = []) =>
        old.map(location =>
          location.id === updatedLocation.id ? updatedLocation : location
        )
      )
      
      // Update single location cache
      queryClient.setQueryData(['locations', updatedLocation.id], updatedLocation)
    }
  })
}

// ✅ Delete location
export const useDeleteLocation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (locationId: string) => locationService.deleteLocation(locationId),
    onSuccess: (_, deletedId) => {
      // Get the location before deletion to know which business it belonged to
      const allLocations = queryClient.getQueryData<Location[]>(['locations']) || []
      const deletedLocation = allLocations.find(loc => loc.id === deletedId)
      
      // Remove from all locations list
      queryClient.setQueryData(['locations'], (old: Location[] = []) =>
        old.filter(location => location.id !== deletedId)
      )
      
      // Remove from business-specific locations list if we know the business
      if (deletedLocation) {
        queryClient.setQueryData(['locations', 'business', deletedLocation.business_id], (old: Location[] = []) =>
          old.filter(location => location.id !== deletedId)
        )
        
        // Invalidate business counts since location count changed
        queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', deletedLocation.business_id] })
      }
      
      // Remove single location cache
      queryClient.removeQueries({ queryKey: ['locations', deletedId] })
      
      // Remove location stats cache
      queryClient.removeQueries({ queryKey: ['stats', 'location-stats', deletedId] })
    }
  })
}

// ✅ Get location stats
export const useLocationStats = (locationId: string) => {
  return useQuery({
    queryKey: ['stats', 'location-stats', locationId],
    queryFn: () => locationService.getLocationStats(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}