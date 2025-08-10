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
  // **NEW: Cookie utility functions**
  private setCookie(name: string, value: string, days: number = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;secure;samesite=strict`;
  }

  async login(data: LoginData) {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // **NEW: Include cookies in request**
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    // **CHANGED: Store token in cookie instead of localStorage**
    this.setCookie('token', result.access_token);
    return result;
  }

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // **NEW: Include cookies in request**
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
      credentials: 'include', // **NEW: Include cookies in request**
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
    // **CHANGED: Delete cookie instead of localStorage**
    this.deleteCookie('token');
  }

  getToken() {
    if (typeof window !== 'undefined') {
      // **CHANGED: Get token from cookie instead of localStorage**
      return this.getCookie('token');
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