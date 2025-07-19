// src/services/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔍 API_URL in auth service:', API_URL);

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  disabled: boolean;
}

export class AuthService {
  async login(data: LoginData) {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    
    // TODO Store token in localStorage to cookie
    localStorage.setItem('token', result.access_token);
    
    return result;
  }

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();