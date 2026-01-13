// API Client for Real Estate CRM

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  isPromoted?: boolean;
  location: {
    address: string;
    city: string;
    district?: string;
    voivodeship?: string;
    postalCode?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
      x?: number;
      y?: number;
    } | [number, number];
  };
  area: number;
  rooms?: number;
  floor?: number;
  buildingFloors?: number;
  buildYear?: number;
  type: string; // mieszkanie, dom, działka, komercyjne
  transactionType: 'sprzedaż' | 'wynajem' | 'sprzedaż_wynajem';
  status: 'aktywne' | 'sprzedane' | 'wynajęte' | 'wycofane' | 'weryfikacja' | 'rezerwacja';
  images: Array<{
    filename?: string;
    url?: string;
    isMain?: boolean;
    alt?: string;
  }>;
  features?: string[];
  agent?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecentlySoldProperty {
  _id: string;
  propertyId?: string;
  title: string;
  description?: string;
  price: number;
  promotionalPrice?: number;
  transactionType: 'sprzedaż' | 'wynajem' | 'sprzedaż_wynajem';
  area?: number;
  rooms?: number;
  location?: {
    address?: string;
    city?: string;
    district?: string;
    voivodeship?: string;
    postalCode?: string;
  };
  coordinates?: {
    x?: number;
    y?: number;
  };
  image?: {
    filename?: string;
    url?: string;
  };
  agent?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  soldAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyStats {
  uniqueCities: number;
  minSalePrice: number;
  minRentPrice: number;
  satisfactionRate: number;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'client' | 'agent' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    console.log('ApiClient constructor - VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('ApiClient constructor - baseURL:', this.baseURL);
    console.log('ApiClient constructor - all env vars:', import.meta.env);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${sanitizedEndpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { ...restOptions } = options;

    const config: RequestInit = {
      method: 'GET',
      credentials: 'include',
      ...restOptions,
      headers,
    };
    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    // Clear local storage on successful logout
    if (response.success) {
      localStorage.removeItem('auth_token');
    }
    
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async getUsers(): Promise<User[]> {
    const response = await this.request<User[]>('/users');
    return response.data || [];
  }

  // Properties endpoints
  async getProperties(params?: {
    page?: number;
    limit?: number;
    type?: string;
    transactionType?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    rooms?: number;
    status?: string;
    sortBy?: string;
  }): Promise<ApiResponse<{ properties: Property[]; total: number; page: number; totalPages: number }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const response = await this.request<unknown>(
      `/properties${query ? `?${query}` : ''}`
    );

    // Backend returns plain array, wrap it
    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: {
          properties: response.data,
          total: response.data.length,
          page: 1,
          totalPages: 1
        }
      };
    }

    return response as ApiResponse<{ properties: Property[]; total: number; page: number; totalPages: number }>;
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/properties/${id}`);
  }

  async getFeaturedProperties(limit = 6): Promise<ApiResponse<Property[]>> {
    return this.request<Property[]>(`/properties/featured?limit=${limit}`);
  }

  async getRecentlySoldProperties(limit = 4): Promise<ApiResponse<RecentlySoldProperty[]>> {
    return this.request<RecentlySoldProperty[]>(`/properties/recently-sold?limit=${limit}`);
  }

  async getPropertyStats(): Promise<ApiResponse<PropertyStats>> {
    return this.request<PropertyStats>('/properties/stats');
  }

  // Contact/inquiry endpoints
  async submitInquiry(data: {
    propertyId?: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    inquiryType: 'property' | 'general' | 'valuation';
  }): Promise<ApiResponse> {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async subscribeNewsletter(email: string): Promise<ApiResponse> {
    return this.request('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Utility methods
  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  clearAuthToken() {
    localStorage.removeItem('auth_token');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper function for handling API responses with error handling
export async function handleApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): Promise<T | null> {
  try {
    const response = await apiCall();
    
    if (response.success && response.data) {
      onSuccess?.(response.data);
      return response.data;
    } else {
      const error = response.message || 'An error occurred';
      onError?.(error);
      console.error('API call failed:', error);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    onError?.(errorMessage);
    console.error('API call exception:', error);
    return null;
  }
}
