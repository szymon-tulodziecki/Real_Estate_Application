import axios from 'axios';
import type { Property, User, LoginCredentials, RegisterData, AuthResponse, CreatePropertyInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174/api';

// Axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Włącza obsługę cookies dla sesji Redis
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token cache
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

// Function to get CSRF token
const getCsrfToken = async (): Promise<string | null> => {
  // Return cached token if still valid (5 minutes)
  if (csrfToken && csrfTokenExpiry && Date.now() < csrfTokenExpiry) {
    return csrfToken;
  }

  try {
    const response = await axios.get('/csrf-token', {
      baseURL: API_BASE_URL,
      withCredentials: true,
    });
    console.debug('[api] /csrf-token response', response.data);
    csrfToken = response.data.csrfToken;
    csrfTokenExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

// Retry logic with exponential backoff
const retryRequest = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const axiosError = error as { 
        response?: { 
          status?: number, 
          data?: { message?: string, errors?: Record<string, string> } 
        } 
      };
      
      // Don't retry for 4xx errors (except 429 - rate limit)
      if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500 && axiosError.response.status !== 429) {
        throw error;
      }
      
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('All retries failed');
};

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    const stateChangingMethods = ['post', 'put', 'patch', 'delete'];
    if (stateChangingMethods.includes(config.method?.toLowerCase() || '')) {
      const csrf = await getCsrfToken();
      if (csrf) {
        // Always add as header for consistency
        config.headers['X-CSRF-Token'] = csrf;
        // For FormData, also add as a field (in case header doesn't work)
        if (config.data instanceof FormData) {
          config.data.append('_csrf', csrf);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases with helpful console messages
    if (error.response) {
      const { status, data } = error.response;
      
      // Unified error format based on our new backend error handling
      console.error(`API Error (${status}):`, {
        endpoint: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status,
        message: data?.error || data?.message || 'Unknown error',
        errors: data?.errors || {},
        stack: data?.stack, // Tylko w trybie development
        details: data
      });
      
      // Handle authentication errors
      if (status === 401) {
        const errorCode = data?.code;
        
        // Specjalna obsługa terminacji sesji
        if (errorCode === 'SESSION_TERMINATED') {
          // Token expired or session invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Pokaż alert użytkownikowi
          alert('Twoja sesja została zakończona przez administratora. Zaloguj się ponownie.');
          
          // Przekieruj na login
          const isAdminRoute = window.location.pathname.startsWith('/admin');
          if (isAdminRoute) {
            window.location.href = '/admin/login';
          }
          return Promise.reject(error);
        }
        
        // Token expired or session invalid (standardowe wygaśnięcie)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to admin login ONLY when user is on an admin route
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        if (isAdminRoute && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
      }
      
      // Handle validation errors
      if (status === 400 && data?.errors) {
        // Format: Make sure validation errors are properly structured for form display
        if (typeof data.errors === 'object') {
          // Transform any nested paths like location.address into flat structure if needed
          const formattedErrors: Record<string, string> = {};
          Object.entries(data.errors).forEach(([key, value]) => {
            formattedErrors[key] = value as string;
          });
          
          // Add formatted errors to the error object for easy access in components
          error.validationErrors = formattedErrors;
        }
      }
    } else {
      console.error('API Error (network/timeout):', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await retryRequest(() => api.post('/auth/login', credentials));
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await retryRequest(() => api.post('/auth/logout'));
    // Wyczyść lokalne dane po wylogowaniu
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  logoutAllDevices: async (): Promise<void> => {
    await retryRequest(() => api.post('/auth/logout-all'));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getActiveSessions: async (): Promise<Array<{ id: string; lastActivity: string; userAgent?: string }>> => {
    const response = await retryRequest(() => api.get('/auth/sessions'));
    return response.data.sessions || [];
  },
  
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await retryRequest(() => api.post('/auth/register', userData));
    return response.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await retryRequest(() => api.get('/auth/profile'));
    // Obsługa zarówno starego formatu { user: {...} } jak i nowego formatu { user: {...}, success: true }
    return response.data.user || response.data; 
  },
};

// Properties API
export const propertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const response = await retryRequest(() => api.get('/properties'));
    // Backend zwraca { success: true, data: properties[] } lub { success: true, data: { properties: [], pagination: {} } }
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : (data.properties || []); 
  },

  getById: async (id: string): Promise<Property> => {
    const response = await retryRequest(() => api.get(`/properties/${id}`));
    // Obsługa odpowiedzi { property: {...} }
    return response.data.property || response.data; 
  },

  create: async (property: CreatePropertyInput): Promise<Property> => {
    const response = await retryRequest(() => api.post('/properties', property));
    // Obsługa odpowiedzi { property: {...}, message: '...' }
    return response.data.property || response.data;
  },

  createWithFormData: async (formData: FormData): Promise<Property> => {
    const response = await retryRequest(() => 
      api.post('/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
    // Obsługa odpowiedzi { property: {...}, message: '...' }
    return response.data.property || response.data;
  },

  update: async (id: string, property: Partial<Property>): Promise<Property> => {
    const response = await retryRequest(() => api.put(`/properties/${id}`, property));
    // Obsługa odpowiedzi { property: {...}, message: '...' }
    return response.data.property || response.data;
  },

  updateWithFormData: async (id: string, formData: FormData): Promise<Property> => {
    const response = await retryRequest(() => 
      api.put(`/properties/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
    // Obsługa odpowiedzi { property: {...}, message: '...' }
    return response.data.property || response.data;
  },

  delete: async (id: string, options?: { markAsRecentlySold?: boolean }): Promise<void> => {
    const params = options?.markAsRecentlySold ? { markAsRecentlySold: options.markAsRecentlySold } : undefined;
    await retryRequest(() => api.delete(`/properties/${id}`, { params }));
  },

  uploadImages: async (id: string, files: File[]): Promise<Property> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await retryRequest(() => 
      api.post(`/properties/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
    // Obsługa odpowiedzi { property: {...}, message: '...' }
    return response.data.property || response.data;
  },

  uploadImagesDirect: async (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    const response = await retryRequest(() => api.post(`/properties/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
    return response.data.property || response.data;
  },

  setMainImage: async (id: string, filename: string) => {
    const response = await retryRequest(() => api.patch(`/properties/${id}/images/main/${encodeURIComponent(filename)}`));
    return response.data.property || response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await retryRequest(() => api.get('/users'));
    // Backend zwraca { success: true, data: users[] }
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : (data.users || []);
  },

  getPublicAgents: async (): Promise<User[]> => {
    const response = await retryRequest(() => api.get('/public/agents'));
    return response.data.agents || response.data;
  },

  getAgents: async (): Promise<User[]> => {
    const response = await retryRequest(() => api.get('/users/agents'));
    return response.data.agents || response.data; // Handle both structures
  },

  getById: async (id: string): Promise<User> => {
    const response = await retryRequest(() => api.get(`/users/${id}`));
    return response.data.user || response.data; // Obsługa odpowiedzi { user: {...} }
  },

  create: async (user: Partial<User> & { password: string }): Promise<User> => {
    const response = await retryRequest(() => api.post('/users', user));
    return response.data.user || response.data; // Obsługa odpowiedzi { user: {...}, message: '...' }
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await retryRequest(() => api.put(`/users/${id}`, user));
    return response.data.user || response.data; // Obsługa odpowiedzi { user: {...}, message: '...' }
  },

  uploadAvatar: async (id: string, file: File): Promise<User> => {
    const form = new FormData();
    form.append('avatar', file);
    const response = await retryRequest(() => api.post(`/users/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
    return response.data.user || response.data;
  },
  getAvatarUrl: (avatar?: string) => avatar,
  delete: async (id: string): Promise<void> => {
    await retryRequest(() => api.delete(`/users/${id}`));
  },

  // User locking API
  acquireLock: async (id: string): Promise<{ acquired: boolean; owner?: string; since?: number }> => {
    const response = await retryRequest(() => api.post(`/users/${id}/lock`));
    return response.data;
  },

  getLock: async (id: string): Promise<{ lock: { userId: string; since: number; ttl: number } | null }> => {
    const response = await retryRequest(() => api.get(`/users/${id}/lock`));
    return response.data;
  },

  releaseLock: async (id: string): Promise<{ released: boolean }> => {
    const response = await retryRequest(() => api.delete(`/users/${id}/lock`));
    return response.data;
  },
};

// Sessions API - for admin session management
export const sessionsAPI = {
  getActiveSessions: async (): Promise<Array<{
    _id: string;
    sessionToken: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      employeeId: string;
      role: string;
      createdBy?: string;
    };
    ipAddress: string;
    userAgent: string;
    lastActivity: string;
    isActive: boolean;
  }>> => {
    const response = await retryRequest(() => api.get('/sessions'));
    return response.data.sessions || [];
  },
  
  terminateSession: async (sessionId: string): Promise<{ 
    message: string; 
    terminatedSession: {
      id: string;
      user: {
        name: string;
        email: string;
        employeeId: string;
        role: string;
      };
    };
  }> => {
    console.debug('[sessionsAPI] terminateSession request', sessionId);
    const response = await retryRequest(() => api.delete(`/sessions/${sessionId}`));
    console.debug('[sessionsAPI] terminateSession response', response?.data);
    return response.data;
  },
  
  getSessionStats: async (): Promise<{
    stats: {
      activeNow: number;
      activeToday: number;
      lastUpdate: string;
    };
  }> => {
    const response = await retryRequest(() => api.get('/sessions/stats'));
    return response.data;
  },
};

export default api;
