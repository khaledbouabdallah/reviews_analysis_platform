// src/services/dashboard.ts
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardStats {
  totalBusinesses: number;
  totalLocations: number;
  totalReviews: number;
}

export interface Business {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export interface BusinessWithStats extends Business {
  locationCount: number;
  sourceCount: number;
  reviewCount: number;
}

export interface Activity {
  id: string;
  type: 'business_created' | 'job_completed' | 'source_added' | 'scraping_started';
  message: string;
  timestamp: string;
  businessName?: string;
}

export interface SystemStatus {
  lastScrapingJob?: string;
  status: 'operational' | 'maintenance' | 'issues';
  jobsCompletedToday: number;
}

export class DashboardService {
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
      throw new Error(`API Error: ${response.status}`);
    }

    if (options.method === 'DELETE' || response.status === 204) {
    return response; // Return response object, not parsed JSON
  }

    return response.json();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch real data
      const [businesses, locations, reviews] = await Promise.all([
        this.fetchWithAuth('/api/businesses/'),
        this.fetchWithAuth('/api/locations/'),
        this.fetchWithAuth('/api/reviews/'),
      ]);

      return {
        totalBusinesses: businesses.length,
        totalLocations: locations.length,
        totalReviews: reviews.length,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data on error
      return {
        totalBusinesses: 2,
        totalLocations: 4,
        totalReviews: 147,
      };
    }
  }

  async getBusinesses(): Promise<Business[]> {
    try {
      return await this.fetchWithAuth('/api/businesses/');
    } catch (error) {
      console.error('Error fetching businesses:', error);
      return [];
    }
  }

  async deleteBusiness(businessId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`/api/businesses/${businessId}/`, {
        method: 'DELETE',
      });
      //console.log('Business deleted successfully');
      console.log('Response:', response.status);
      if (response.status !== 204) {
        throw new Error('Failed to delete business');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }


  async updateBusiness(businessId: string, data: { name: string }): Promise<Business> {
  try {
    const response = await this.fetchWithAuth(`/api/businesses/${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response;
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
}



  async getBusinessesWithStats(): Promise<BusinessWithStats[]> {
    try {
      const [businesses, locations, sources, reviews] = await Promise.all([
        this.fetchWithAuth('/api/businesses/'),
        this.fetchWithAuth('/api/locations/'),
        this.fetchWithAuth('/api/sources/'),
        this.fetchWithAuth('/api/reviews/'),
      ]);

      // Group data by business
      return businesses.map((business: Business) => {
        const businessLocations = locations.filter((loc: any) => loc.business_id === business.id);
        const businessSources = sources.filter((src: any) => src.business_id === business.id);
        const businessReviews = reviews.filter((rev: any) => rev.business_id === business.id);

        return {
          ...business,
          locationCount: businessLocations.length,
          sourceCount: businessSources.length,
          reviewCount: businessReviews.length,
        };
      });
    } catch (error) {
      console.error('Error fetching businesses with stats:', error);
      return [];
    }
  }

  async getRecentActivity(): Promise<Activity[]> {
    // Mock data for now - in real implementation, this would come from backend
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'job_completed',
        message: 'Scraping job completed: 23 new reviews collected',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        businessName: 'Pizza Palace',
      },
      {
        id: '2',
        type: 'source_added',
        message: 'Google Maps source added',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        businessName: 'Coffee Corner',
      },
      {
        id: '3',
        type: 'business_created',
        message: 'New business created',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        businessName: 'Burger Joint',
      },
      {
        id: '4',
        type: 'scraping_started',
        message: 'Started scraping reviews from competitor',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        businessName: 'Italian Bistro',
      },
      {
        id: '5',
        type: 'job_completed',
        message: 'Analysis completed: 89% positive sentiment',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        businessName: 'Sushi Express',
      },
    ];

    return mockActivities;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const jobs = await this.fetchWithAuth('/api/jobs/');
      
      // Find latest completed job
      const completedJobs = jobs.filter((job: any) => job.status === 'completed');
      const latestJob = completedJobs.sort((a: any, b: any) => 
        new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
      )[0];

      // Count jobs completed today
      const today = new Date().toDateString();
      const jobsToday = completedJobs.filter((job: any) => 
        new Date(job.ended_at).toDateString() === today
      ).length;

      return {
        lastScrapingJob: latestJob?.ended_at || undefined,
        status: 'operational',
        jobsCompletedToday: jobsToday,
      };
    } catch (error) {
      console.error('Error fetching system status:', error);
      return {
        lastScrapingJob: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'operational',
        jobsCompletedToday: 3,
      };
    }
  }
}

export const dashboardService = new DashboardService();