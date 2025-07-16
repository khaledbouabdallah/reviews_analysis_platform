// src/services/job.ts
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type JobStatus = 'pending' | 'running' | 'saving' | 'completed' | 'failed' | 'cancelled' | 'partially_completed';
export type SourceType = 'google' | 'csv';

export interface Job {
  id: string;
  name?: string;
  status: JobStatus;
  url: string;
  user_id: string;
  business_id: string;
  location_id?: string | null;
  source_id: string;
  source_type: SourceType;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  total_reviews?: number | null;
  reviews_scraped?: number | null;
  error?: string | null;
  updated_at?: string;
}

export interface JobCreate {
  name?: string;
  url: string;
  business_id: string;
  location_id?: string | null;
  source_id: string;
  source_type: SourceType;
}

export interface JobUpdate {
  name?: string;
  url?: string;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  total_reviews?: number | null;
  reviews_scraped?: number | null;
  created_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  error?: string | null;
}

export interface TaskStatusResponse {
  task_id: string;
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED';
  status?: string;
  result?: any;
  error?: string;
}

export interface JobCreateResponse {
  id: string;
  task_id: string;
  status: string;
  message: string;
}

// Helper function to determine if job is active (needs polling)
export const isJobActive = (status: JobStatus): boolean => {
  return ['pending', 'running', 'saving'].includes(status);
};

// Helper function to get progress percentage
export const getJobProgress = (job: Job): number => {
  if (!job.total_reviews || job.total_reviews === 0) return 0;
  if (!job.reviews_scraped) return 0;
  return Math.min(Math.round((job.reviews_scraped / job.total_reviews) * 100), 100);
};

// Helper function to get status color
export const getJobStatusColor = (status: JobStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'running':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'saving':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'partially_completed':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Helper function to get status label
export const getJobStatusLabel = (status: JobStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'running':
      return 'Running';
    case 'saving':
      return 'Saving';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'partially_completed':
      return 'Partial';
    default:
      return 'Unknown';
  }
};

export class JobService {
  private activePolling = new Set<string>(); // Track which jobs are being polled
  private pollingIntervals = new Map<string, NodeJS.Timeout>(); // Store polling intervals

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

    if (response.status === 204) {
      return null; // For DELETE requests
    }

    return response.json();
  }

  // CRUD Operations
  async createJob(jobData: JobCreate): Promise<JobCreateResponse> {
    try {
      return await this.fetchWithAuth('/api/jobs/', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async getJobsByBusiness(businessId: string): Promise<Job[]> {
    try {
      return await this.fetchWithAuth(`/api/jobs/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async getJobsBySource(sourceId: string): Promise<Job[]> {
    try {
      return await this.fetchWithAuth(`/api/jobs/source/${sourceId}`);
    } catch (error) {
      console.error('Error fetching jobs by source:', error);
      throw error;
    }
  }

  async getAllUserJobs(): Promise<Job[]> {
    try {
      return await this.fetchWithAuth('/api/jobs/');
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<Job> {
    try {
      return await this.fetchWithAuth(`/api/jobs/${jobId}`);
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  async updateJob(jobId: string, jobData: JobUpdate): Promise<Job> {
    try {
      return await this.fetchWithAuth(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  // Job Status & Progress Monitoring
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      return await this.fetchWithAuth(`/api/jobs/${jobId}/status`);
    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      return await this.fetchWithAuth(`/api/jobs/tasks/${taskId}/status`);
    } catch (error) {
      console.error('Error fetching task status:', error);
      throw error;
    }
  }

  // Job Control
  async cancelJob(jobId: string): Promise<{ id: string; message: string; cancelled: boolean }> {
    try {
      return await this.fetchWithAuth(`/api/jobs/${jobId}/cancel`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  async retryJob(originalJob: Job): Promise<JobCreateResponse> {
    try {
      // Create a new job with same parameters
      const retryJobData: JobCreate = {
        name: originalJob.name ? `${originalJob.name} (Retry)` : undefined,
        url: originalJob.url,
        business_id: originalJob.business_id,
        location_id: originalJob.location_id,
        source_id: originalJob.source_id,
        source_type: originalJob.source_type,
      };
      
      return await this.createJob(retryJobData);
    } catch (error) {
      console.error('Error retrying job:', error);
      throw error;
    }
  }

  // Real-time Polling Management
  startPolling(jobId: string, onUpdate: (status: JobStatusResponse) => void, onComplete?: () => void): void {
    // Don't start polling if already active
    if (this.activePolling.has(jobId)) {
      return;
    }

    this.activePolling.add(jobId);

    const poll = async () => {
      try {
        const status = await this.getJobStatus(jobId);
        onUpdate(status);

        // Stop polling if job is no longer active
        if (!isJobActive(status.status)) {
          this.stopPolling(jobId);
          if (onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error(`Polling error for job ${jobId}:`, error);
        // Continue polling on errors, but could implement retry logic here
      }
    };

    // Initial poll
    poll();

    // Set up interval polling every 5 seconds
    const interval = setInterval(poll, 5000);
    this.pollingIntervals.set(jobId, interval);
  }

  stopPolling(jobId: string): void {
    this.activePolling.delete(jobId);
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  stopAllPolling(): void {
    for (const jobId of this.activePolling) {
      this.stopPolling(jobId);
    }
  }

  isPolling(jobId: string): boolean {
    return this.activePolling.has(jobId);
  }

  // Utility Methods
getJobDuration(job: Job): string | null {
  if (!job.started_at) return null;
  
  // Convert UTC timestamps to local time
  const start = new Date(job.started_at + (job.started_at.endsWith('Z') ? '' : 'Z'));
  const end = job.ended_at 
    ? new Date(job.ended_at + (job.ended_at.endsWith('Z') ? '' : 'Z'))
    : new Date();
  const durationMs = end.getTime() - start.getTime();
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

  getReviewsPageUrl(jobId: string): string {
    return `/reviews?job_id=${jobId}`;
  }

  // Cleanup method - call this when component unmounts
  cleanup(): void {
    this.stopAllPolling();
  }
}

export const jobService = new JobService();