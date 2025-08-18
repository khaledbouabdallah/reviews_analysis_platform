// src/services/business.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

// **CHANGED: Use your existing Business interface structure**
export interface Business {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  description?: string;
  segments?: string[];
}

// **NEW: Extended interface with stats for display**
export interface BusinessWithStats extends Business {
  locationCount: number;
  sourceCount: number;
  reviewCount: number;
}

// **CHANGED: Simplified create/update interfaces**
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

export class BusinessService {
  // **CHANGED: Use your existing fetchWithAuth pattern**
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

  // **NEW: Get businesses with location/review stats**
  async getBusinessesWithStats(): Promise<BusinessWithStats[]> {
    try {
      const [businesses, locations, sources, reviews] = await Promise.all([
        this.fetchWithAuth('/api/businesses/'),
        this.fetchWithAuth('/api/locations/'),
        this.fetchWithAuth('/api/sources/'),
        this.fetchWithAuth('/api/reviews/'),
      ]);

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

  // **CHANGED: Use your existing update pattern**
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

  // **CHANGED: Use your existing delete pattern**
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
}

export const businessService = new BusinessService();