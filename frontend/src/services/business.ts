// src/services/business.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

// **KEEP: Core business interface**
export interface Business {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  description?: string;
  segments?: string[];
}

// **KEEP: Simple create/update interfaces**
export interface CreateBusinessData {
  name: string;
  description?: string;
  segments?: string[];
}

export interface UpdateBusinessData {
  name: string;
  description?: string;
  segments?: string[];
}

export interface BusinessCounts {
  "business_id": string,
  "business_name": string,
  "location_count": number,
  "source_count": number,
  "review_count": number,
  "job_count": number
}

export class BusinessService {
  // **KEEP: Your existing auth pattern**
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
      throw new Error(`API Error: ${response.status}`);
    }

    if (options.method === 'DELETE' || response.status === 204) {
      return response;
    }

    return response.json();
  }

  // **KEEP: Simple CRUD operations only**
  async getBusinesses(): Promise<Business[]> {
    try {
      return await this.fetchWithAuth('/api/businesses/');
    } catch (error) {
      console.error('Error fetching businesses:', error);
      throw error;
    }
  }

  async getBusiness(id: string): Promise<Business> {
    try {
      return await this.fetchWithAuth(`/api/businesses/${id}/`);
    } catch (error) {
      console.error('Error fetching business:', error);
      throw error;
    }
  }

  async createBusiness(data: CreateBusinessData): Promise<Business> {
    try {
      return await this.fetchWithAuth('/api/businesses/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  }

  async updateBusiness(businessId: string, data: UpdateBusinessData): Promise<Business> {
    try {
      return await this.fetchWithAuth(`/api/businesses/${businessId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  }

  async deleteBusiness(businessId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`/api/businesses/${businessId}/`, {
        method: 'DELETE',
      });
      
      if (response.status !== 204) {
        throw new Error('Failed to delete business');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }

  async getBusinessCounts(businessId: string): Promise<BusinessCounts> {
    try {
      return await this.fetchWithAuth(`/api/stats/businesses/${businessId}`);
    } catch (error) {
      console.error('Error fetching business counts:', error);
      throw error;
    }
  }
}

export const businessService = new BusinessService();