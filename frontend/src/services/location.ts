// src/services/location.ts
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Location {
  id: string;
  name: string;
  adresse: string; // Backend uses 'adresse'
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface LocationCreate {
  name: string;
  adresse: string;
  business_id: string;
}

export interface LocationUpdate {
  name?: string;
  adresse?: string;
}

export class LocationService {
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

    return response.json();
  }

  async getLocationsByBusiness(businessId: string): Promise<Location[]> {
    try {
      return await this.fetchWithAuth(`/api/locations/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  async createLocation(locationData: LocationCreate): Promise<Location> {
    try {
      return await this.fetchWithAuth('/api/locations/', {
        method: 'POST',
        body: JSON.stringify(locationData),
      });
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async updateLocation(locationId: string, locationData: LocationUpdate): Promise<Location> {
    try {
      return await this.fetchWithAuth(`/api/locations/${locationId}`, {
        method: 'PUT',
        body: JSON.stringify(locationData),
      });
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(locationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
        throw new Error(`Failed to delete location: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();