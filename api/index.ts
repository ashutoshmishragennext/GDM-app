// src/api/index.ts
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import { LoginRequest, LoginResponse, User } from './types';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
        console.log('Token initialized from storage');
      }
    } catch (error) {
      console.error('Error initializing token:', error);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.authToken) {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (token) {
          this.authToken = token;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const authHeaders = await this.getAuthHeaders();
      const fullUrl = `${this.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  private async clearAuth() {
    this.authToken = null;
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (!data.user) {
      throw new Error('Invalid login response: missing user data');
    }

    // Store token and user data
    const mockToken = `session_${Date.now()}_${data.user.id}`;
    this.authToken = mockToken;
    
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, mockToken);
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));

    return {
      user: data.user,
      token: mockToken,
      message: data.message
    };
  }

  async logout(): Promise<void> {
    try {
      await this.fetchWithTimeout('/api/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.fetchWithTimeout(`/api/users?id=${id}`, {
      method: 'GET',
    });
    return this.handleResponse<User[]>(response).then(users => users[0]);
  }
}

export const apiService = new ApiService();