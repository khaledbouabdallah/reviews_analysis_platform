// src/services/source.ts
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export type SourceType = 'google' | 'csv';

// **KEEP: Core source interface**
export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  business_id: string;
  user_id: string;
  location_id?: string | null;
  created_at: string;
  updated_at?: string;
}

// **KEEP: Simple create/update interfaces**
export interface SourceCreate {
  name: string;
  type: SourceType;
  url?: string;
  business_id: string;
  location_id?: string | null;
}

export interface SourceUpdate {
  name?: string;
  type?: SourceType;
  url?: string;
  location_id?: string | null;
}

// **NEW: Source stats interface matching backend model**
export interface SourceStats {
  source_id: string;
  review_count: number;
  job_count: number;
  average_rating: number;
}

// **KEEP: URL Validation functions (matching backend logic)**
export const validateGoogleMapsUrl = (url: string): boolean => {
  // Pattern to match Google Maps URLs
  const googleMapsPattern = /^https?:\/\/(www\.)?(google\.[a-z]{2,3}(\/maps)?|maps\.google\.[a-z]{2,3})\/.+$/;
  
  if (!googleMapsPattern.test(url)) {
    return false;
  }
  
  // Method 1: Check for !4m18 or !4m8 parameter
  if (/!4m(18|8)!/.test(url)) {
    return true;
  }
  
  // Method 2: Check for !3m7 parameter
  if (/!3m7!/.test(url)) {
    return true;
  }
  
  // Method 3: Count !9m1!1b1 occurrences
  if ((url.match(/!9m1!1b1/g) || []).length >= 2) {
    return true;
  }
  
  return false;
};

export const validateCsvUrl = (url: string): boolean => {
  return url.toLowerCase().endsWith('.csv');
};

export const validateSourceUrl = (url: string, type: SourceType): { valid: boolean; error?: string } => {
  if (!url.trim()) {
    return { valid: false, error: 'URL is required' };
  }
  
  if (type === 'google') {
    if (!validateGoogleMapsUrl(url)) {
      return { 
        valid: false, 
        error: 'Please provide a valid Google Maps business URL opened to the reviews section' 
      };
    }
  } else if (type === 'csv') {
    if (!validateCsvUrl(url)) {
      return { 
        valid: false, 
        error: 'URL must point to a CSV file (.csv extension required)' 
      };
    }
  }
  
  return { valid: true };
};

export class SourceService {
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

  // **NEW: Get all sources for user (matching business/location service pattern)**
  async getSources(): Promise<Source[]> {
    try {
      return await this.fetchWithAuth('/api/sources/');
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  }

  // **NEW: Get single source by ID (matching business/location service pattern)**
  async getSource(id: string): Promise<Source> {
    try {
      return await this.fetchWithAuth(`/api/sources/${id}/`);
    } catch (error) {
      console.error('Error fetching source:', error);
      throw error;
    }
  }

  // **KEEP: Get sources by business**
  async getSourcesByBusiness(businessId: string): Promise<Source[]> {
    try {
      return await this.fetchWithAuth(`/api/sources/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  }

  // **RENAMED: For consistency (was getAllUserSources)**
  async getAllUserSources(): Promise<Source[]> {
    return this.getSources();
  }

  // **CHANGED: Improved validation and error handling**
  async createSource(sourceData: SourceCreate): Promise<Source> {
    try {

      return await this.fetchWithAuth('/api/sources/', {
        method: 'POST',
        body: JSON.stringify(sourceData),
      });
    } catch (error) {
      console.error('Error creating source:', error);
      throw error;
    }
  }

  // **CHANGED: Improved validation and error handling**
  async updateSource(sourceId: string, sourceData: SourceUpdate): Promise<Source> {
    try {
      // Validate URL if it's being updated
      if (sourceData.url && sourceData.type) {
        const validation = validateSourceUrl(sourceData.url, sourceData.type);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      return await this.fetchWithAuth(`/api/sources/${sourceId}`, {
        method: 'PUT',
        body: JSON.stringify(sourceData),
      });
    } catch (error) {
      console.error('Error updating source:', error);
      throw error;
    }
  }

  // **CHANGED: Use fetchWithAuth for consistency like business/location services**
  async deleteSource(sourceId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (response.status !== 204) {
        throw new Error('Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      throw error;
    }
  }

  // **NEW: Get source stats (matching business/location service pattern)**
  async getSourceStats(sourceId: string): Promise<SourceStats> {
    try {
      return await this.fetchWithAuth(`/api/stats/sources/${sourceId}`);
    } catch (error) {
      console.error('Error fetching source stats:', error);
      throw error;
    }
  }
}

export const sourceService = new SourceService();