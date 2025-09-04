// src/services/location.ts
import { log } from 'console';
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

// **KEEP: Core location interface**
export interface Location {
  id: string;
  name: string;
  address?: string ; // Backend uses 'address'
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

// **KEEP: Simple create/update interfaces**
export interface LocationCreate {
  name: string;
  address?: string;
  business_id: string;
}

export interface LocationUpdate {
  name?: string;
  address?: string;
}

// **NEW: Location stats interface matching backend model**
export interface LocationStats {
  location_id: string;
  review_count: number;
  job_count: number;
  source_count: number;
  average_rating: number;
}

export class LocationService {
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
      
      // Preserve the actual error message from the API
      let errorDetail = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch {
        // If can't parse JSON, keep the generic error
      }
            
      const error = new Error(errorDetail) as any;
      error.response = { data: { detail: errorDetail } };
      throw error;
    }

    if (options.method === 'DELETE' || response.status === 204) {
      return response;
    }

    return response.json();
  }

  // **NEW: Get all locations for user (matching business service pattern)**
  async getLocations(): Promise<Location[]> {
    try {
      return await this.fetchWithAuth('/api/locations/');
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  // **NEW: Get single location by ID (matching business service pattern)**
  async getLocation(id: string): Promise<Location> {
    try {
      return await this.fetchWithAuth(`/api/locations/${id}/`);
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
}

  // **KEEP: Get locations by business**
  async getLocationsByBusiness(businessId: string): Promise<Location[]> {
    try {
      return await this.fetchWithAuth(`/api/locations/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  // **KEEP: Create location**
  async createLocation(locationData: LocationCreate): Promise<Location> {
    return await this.fetchWithAuth('/api/locations/', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  // **KEEP: Update location**
  async updateLocation(locationId: string, locationData: LocationUpdate): Promise<Location> {
    return await this.fetchWithAuth(`/api/locations/${locationId}/`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  // **CHANGED: Use fetchWithAuth for consistency like business service**
  async deleteLocation(locationId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });
      if (response.status !== 204) {
        throw new Error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  // **NEW: Get location stats (matching business service pattern)**
  async getLocationStats(locationId: string): Promise<LocationStats> {
    try {
      return await this.fetchWithAuth(`/api/stats/locations/${locationId}`);
    } catch (error) {
      console.error('Error fetching location stats:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();