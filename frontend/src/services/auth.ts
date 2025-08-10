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

interface LoginResponse {
  message: string;
  username: string;
}

export class AuthService {
  async login(data: LoginData): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // **REQUIRED: Include cookies**
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    // **CHANGED: Return response data, no token storage needed**
    return response.json();
  }

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // **REQUIRED: Include cookies**
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include', // **REQUIRED: Cookies automatically sent**
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid/expired, but we can't manually clear httpOnly cookies
        // The server should have already expired the cookie
      }
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  async logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // **REQUIRED: Include cookies**
      });
    } catch (error) {
      // Even if logout request fails, the user should be logged out on frontend
      console.error('Logout request failed:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }


}

export const authService = new AuthService();