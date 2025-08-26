// src/hooks/useJobs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { 
  jobService, 
  Job, 
  JobCreate, 
  JobUpdate, 
  JobStatusResponse, 
  TaskStatusResponse,
  JobCreateResponse,
  isJobActive 
} from '../services/job'

// ✅ Get all jobs for user
export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.getJobs(),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than other entities)
    refetchOnWindowFocus: false,
  })
}

// ✅ Get single job by ID
export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobService.getJob(jobId),
    enabled: !!jobId,
    staleTime: 30 * 1000, // 30 seconds (jobs change frequently)
    refetchOnWindowFocus: false,
  })
}

// ✅ Get jobs by business ID
export const useJobsByBusiness = (businessId: string) => {
  return useQuery({
    queryKey: ['jobs', 'business', businessId],
    queryFn: () => jobService.getJobsByBusiness(businessId),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Get jobs by source ID
export const useJobsBySource = (sourceId: string) => {
  return useQuery({
    queryKey: ['jobs', 'source', sourceId],
    queryFn: () => jobService.getJobsBySource(sourceId),
    enabled: !!sourceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

// ✅ Create new job
export const useCreateJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobCreate) => jobService.createJob(data),
    onSuccess: (response: JobCreateResponse, variables) => {
      // Job will be created in backend, so we invalidate instead of optimistically updating
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'business', variables.business_id] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'source', variables.source_id] })
      
      // Update business counts since job count changed
      queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', variables.business_id] })
      
      // If job has location_id, invalidate location stats too
      if (variables.location_id) {
        queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', variables.location_id] })
      }
    }
  })
}

// ✅ Update job
export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: JobUpdate }) =>
      jobService.updateJob(id, data),
    onSuccess: (updatedJob) => {
      // Update all jobs list
      queryClient.setQueryData(['jobs'], (old: Job[] = []) =>
        old.map(job =>
          job.id === updatedJob.id ? updatedJob : job
        )
      )
      
      // Update business-specific jobs list
      queryClient.setQueryData(['jobs', 'business', updatedJob.business_id], (old: Job[] = []) =>
        old.map(job =>
          job.id === updatedJob.id ? updatedJob : job
        )
      )
      
      // Update source-specific jobs list
      queryClient.setQueryData(['jobs', 'source', updatedJob.source_id], (old: Job[] = []) =>
        old.map(job =>
          job.id === updatedJob.id ? updatedJob : job
        )
      )
      
      // Update single job cache
      queryClient.setQueryData(['jobs', updatedJob.id], updatedJob)
    }
  })
}

// ✅ Delete job
export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.deleteJob(jobId),
    onSuccess: (_, deletedId) => {
      // Get the job before deletion to know which business/source it belonged to
      const allJobs = queryClient.getQueryData<Job[]>(['jobs']) || []
      const deletedJob = allJobs.find(job => job.id === deletedId)
      
      // Remove from all jobs list
      queryClient.setQueryData(['jobs'], (old: Job[] = []) =>
        old.filter(job => job.id !== deletedId)
      )
      
      // Remove from business-specific jobs list if we know the business
      if (deletedJob) {
        queryClient.setQueryData(['jobs', 'business', deletedJob.business_id], (old: Job[] = []) =>
          old.filter(job => job.id !== deletedId)
        )
        
        queryClient.setQueryData(['jobs', 'source', deletedJob.source_id], (old: Job[] = []) =>
          old.filter(job => job.id !== deletedId)
        )
        
        // Invalidate business counts since job count changed
        queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', deletedJob.business_id] })
        
        // If job had location_id, invalidate location stats too
        if (deletedJob.location_id) {
          queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', deletedJob.location_id] })
        }
      }
      
      // Remove single job cache
      queryClient.removeQueries({ queryKey: ['jobs', deletedId] })
      
      // Remove job status cache
      queryClient.removeQueries({ queryKey: ['job-status', deletedId] })
      
      // Remove task status cache if exists
      queryClient.removeQueries({ queryKey: ['task-status'] })
    }
  })
}

// ✅ Job-specific: Get job status
export const useJobStatus = (jobId: string, enabled = true) => {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => jobService.getJobStatus(jobId),
    enabled: !!jobId && enabled,
    staleTime: 0, // Always fresh for real-time updates
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds if job is active
      return query.state.data && isJobActive(query.state.data.status) ? 5000 : false
    },
    refetchOnWindowFocus: true,
  })
}

// ✅ Job-specific: Get task status
export const useTaskStatus = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: ['task-status', taskId],
    queryFn: () => jobService.getTaskStatus(taskId),
    enabled: !!taskId && enabled,
    staleTime: 0, // Always fresh for real-time updates
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds if task is pending or in progress
      return query.state.data && ['PENDING', 'PROGRESS'].includes(query.state.data.state) ? 5000 : false
    },
    refetchOnWindowFocus: true,
  })
}

// ✅ Job-specific: Cancel job
export const useCancelJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      // Invalidate job status to get updated status
      queryClient.invalidateQueries({ queryKey: ['job-status', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] })
    }
  })
}

// ✅ Job-specific: Retry job
export const useRetryJob = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (originalJob: Job) => jobService.retryJob(originalJob),
    onSuccess: (response, originalJob) => {
      // Invalidate job lists to show new job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'business', originalJob.business_id] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'source', originalJob.source_id] })
      
      // Update business counts
      queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', originalJob.business_id] })
      
      if (originalJob.location_id) {
        queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', originalJob.location_id] })
      }
    }
  })
}

// ✅ Job-specific: Upload CSV
export const useUploadCSV = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file, jobName, businessId, locationId }: {
      file: File
      jobName: string | null
      businessId: string
      locationId: string | null
    }) => jobService.uploadCSV(file, jobName, businessId, locationId),
    onSuccess: (_, variables) => {
      // Invalidate job lists to show new job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'business', variables.businessId] })
      
      // Update business counts
      queryClient.invalidateQueries({ queryKey: ['stats', 'business-counts', variables.businessId] })
      
      if (variables.locationId) {
        queryClient.invalidateQueries({ queryKey: ['stats', 'location-stats', variables.locationId] })
      }
    }
  })
}

// ✅ Job-specific: Real-time job polling hook
export const useJobPolling = (
  jobId: string, 
  onUpdate?: (status: JobStatusResponse) => void,
  onComplete?: () => void
) => {
  const intervalRef = useRef<NodeJS.Timeout>()
  const isActiveRef = useRef(false)
  
  const { data: jobStatus, refetch } = useJobStatus(jobId, false) // Don't auto-refetch
  
  const startPolling = () => {
    if (isActiveRef.current || !jobId) return
    
    isActiveRef.current = true
    
    const poll = async () => {
      try {
        const { data: status } = await refetch()
        if (status) {
          onUpdate?.(status)
          
          if (!isJobActive(status.status)) {
            stopPolling()
            onComplete?.()
          }
        }
      } catch (error) {
        console.error(`Polling error for job ${jobId}:`, error)
      }
    }
    
    // Initial poll
    poll()
    
    // Set up interval
    intervalRef.current = setInterval(poll, 5000)
  }
  
  const stopPolling = () => {
    isActiveRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [])
  
  return {
    jobStatus,
    isPolling: isActiveRef.current,
    startPolling,
    stopPolling
  }
}