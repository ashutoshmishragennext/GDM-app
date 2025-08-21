// src/api/index.ts
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import { LoginRequest, LoginResponse, User, ApiResponse } from './types';
import { getCookies, setCookies, clearCookies } from '@/utils/cookieUtils';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    // Don't await in constructor, handle initialization separately
    this.initializeToken().catch(console.error);
  }

  private async initializeToken() {
    try {
      const cookies = await getCookies();
      if (cookies?.token) {
        this.authToken = cookies.token;
        console.log('Token initialized from storage');
      }
    } catch (error) {
      console.error('Error initializing token:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeToken();
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    await this.ensureInitialized();

    if (!this.authToken) {
      try {
        const cookies = await getCookies();
        if (cookies?.token) {
          this.authToken = cookies.token;
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
      console.log('Added auth header with token');
    } else {
      console.log('No auth token available');
    }

    return headers;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const authHeaders = await this.getAuthHeaders();
      const fullUrl = `${this.baseURL}${url}`;
      
      console.log(`Making request to: ${fullUrl}`);
      console.log('Request headers:', authHeaders);
      
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      });
      
      console.log(`Response status: ${response.status}`);
      clearTimeout(timeoutId);
      return response;
    } catch (error :any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      console.error('Fetch error:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`Handling response with status: ${response.status}`);
    
    if (!response.ok) {
      // Get response text for better error messages
      const responseText = await response.text();
      console.error('Response error text:', responseText);
      
      if (response.status === 401) {
        await this.clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
    }

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('JSON parse error:', error);
      throw new Error('Invalid JSON response from server');
    }

    // Handle different response structures
    if (data.success !== undefined) {
      // Standard ApiResponse format
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      return data.data;
    } else if (data.data !== undefined) {
      // Direct data response
      return data.data;
    } else {
      // Direct response (no wrapper)
      return data;
    }
  }

  private async clearAuth() {
    console.log('Clearing authentication');
    this.authToken = null;
    await clearCookies();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('Attempting login...');
    
    // Use the API route instead of the page route
    const fullUrl = `${this.baseURL}/api/auth/login`;
    console.log(`Login URL: ${fullUrl}`);
    console.log('Login credentials:', { email: credentials.email, password: '***' });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log(`Login response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Login error response:', responseText);
      throw new Error(`Login failed! status: ${response.status}, message: ${responseText}`);
    }

    const responseText = await response.text();
    console.log('Login response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Login JSON parse error:', error);
      throw new Error('Invalid JSON response from login endpoint');
    }

    console.log('Parsed login response:', data);

    // Handle the actual API response structure
    if (!data.user) {
      console.error('Missing user in response:', data);
      throw new Error('Invalid login response: missing user data');
    }

    // Your API doesn't return a token, so we'll need to handle authentication differently
    // For now, we'll create a mock token or use a session-based approach
    const mockToken = `session_${Date.now()}_${data.user.id}`;
    
    console.log('Creating session token:', mockToken);

    // Store the user data and mock token
    this.authToken = mockToken;
    
    // Store in cookies/storage
    await setCookies({
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      token: mockToken, // Using mock token since API doesn't provide one
      userId: data.user.id // Store user ID for future reference
    });

    // Return in expected format
    const loginResponse: LoginResponse = {
      user: data.user,
      token: mockToken,
      message: data.message
    };

    console.log('Login successful');
    return loginResponse;
  }

  async logout(): Promise<void> {
    try {
      console.log('Attempting logout...');
      const response = await this.fetchWithTimeout('/api/logout', {
        method: 'POST',
      });
      await this.handleResponse<void>(response);
      console.log('Server logout successful');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      await this.clearAuth();
      console.log('Local logout completed');
    }
  }

  async getProfile(): Promise<User> {
    console.log('Fetching user profile...');
    const response = await this.fetchWithTimeout('/api/profile', {
      method: 'GET',
    });

    return this.handleResponse<User>(response);
  }

  async refreshToken(): Promise<void> {
    try {
      console.log('Refreshing token...');
      const response = await this.fetchWithTimeout('/auth/refresh', {
        method: 'POST',
      });
      
      const data: ApiResponse<{token: string}> = await response.json();
      if (data.success && data.data.token) {
        this.authToken = data.data.token;
        const cookies = await getCookies();
        if (cookies) {
          await setCookies({...cookies, token: data.data.token});
        }
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuth();
      throw error;
    }
  }
}

export const apiService = new ApiService();