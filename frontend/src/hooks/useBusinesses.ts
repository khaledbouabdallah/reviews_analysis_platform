// src/hooks/useBusinesses.ts
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessService, Business, CreateBusinessData, UpdateBusinessData } from '../services/business'

// ✅ Get all businesses
export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessService.getBusinesses(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

// ✅ Get single business by ID
export const useBusiness = (businessId: string) => {
  return useQuery({
    queryKey: ['businesses', businessId],
    queryFn: () => businessService.getBusiness(businessId),
    enabled: !!businessId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

// ✅ Create new business
export const useCreateBusiness = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateBusinessData) => businessService.createBusiness(data), // ✅ Add arrow function wrapper
    onSuccess: (newBusiness) => {
      // Add to businesses list
      queryClient.setQueryData(['businesses'], (old: Business[] = []) => 
        [...old, newBusiness]
      )
    }
  })
}

// ✅ Update business
export const useUpdateBusiness = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateBusinessData }) => 
      businessService.updateBusiness(id, data),
    onSuccess: (updatedBusiness) => {
      // Update businesses list
      queryClient.setQueryData(['businesses'], (old: Business[] = []) =>
        old.map(business => 
          business.id === updatedBusiness.id ? updatedBusiness : business
        )
      )
      // Update single business cache
      queryClient.setQueryData(['businesses', updatedBusiness.id], updatedBusiness)
    }
  })
}

// ✅ Delete business
export const useDeleteBusiness = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: businessService.deleteBusiness,
    onSuccess: (_, deletedId) => {
      // Remove from businesses list
      queryClient.setQueryData(['businesses'], (old: Business[] = []) =>
        old.filter(business => business.id !== deletedId)
      )
      // Remove single business cache
      queryClient.removeQueries({ queryKey: ['businesses', deletedId] })
    }
  })
}

// ✅ Get simple counts for a specific business (SIMPLE)
export const useBusinessCounts = (businessId: string) => {
  return useQuery({
    queryKey: ['stats', 'business-counts', businessId],
    queryFn: () => businessService.getBusinessCounts(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}