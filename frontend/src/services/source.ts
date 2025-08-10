// src/services/source.ts
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type SourceType = 'google' | 'csv';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  business_id: string;
  user_id: string;
  location_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SourceCreate {
  name: string;
  type: SourceType;
  url: string;
  business_id: string;
  location_id?: string | null;
}

export interface SourceUpdate {
  name?: string;
  type?: SourceType;
  url?: string;
  location_id?: string | null;
}

// URL Validation functions (matching backend logic)
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
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include', // **NEW: Required for httpOnly cookies**
    });

    if (!response.ok) {
      if (response.status === 401) {
        await authService.logout();
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async getSourcesByBusiness(businessId: string): Promise<Source[]> {
    try {
      return await this.fetchWithAuth(`/api/sources/business/${businessId}`);
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  }

  async getAllUserSources(): Promise<Source[]> {
    try {
      return await this.fetchWithAuth('/api/sources/');
    } catch (error) {
      console.error('Error fetching user sources:', error);
      throw error;
    }
  }

  async createSource(sourceData: SourceCreate): Promise<Source> {
    try {
      // Validate URL before sending
      const validation = validateSourceUrl(sourceData.url, sourceData.type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return await this.fetchWithAuth('/api/sources/', {
        method: 'POST',
        body: JSON.stringify(sourceData),
      });
    } catch (error) {
      console.error('Error creating source:', error);
      throw error;
    }
  }

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

  async deleteSource(sourceId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/sources/${sourceId}`, {
        method: 'DELETE',
        credentials: 'include', 
      });

      if (!response.ok) {
        if (response.status === 401) {

          await authService.logout();
          window.location.href = '/login';
        }
        throw new Error(`Failed to delete source: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      throw error;
    }
  }
}

export const sourceService = new SourceService();