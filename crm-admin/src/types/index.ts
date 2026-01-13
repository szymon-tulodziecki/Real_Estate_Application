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
    postalCode: string;
    district?: string;
    voivodeship?: string;
    coordinates?: {
      x: number;
      y: number;
    };
  };
  type: 'mieszkanie' | 'dom' | 'lokal' | 'działka';
  transactionType: 'sprzedaż' | 'wynajem';
  status: 'aktywne' | 'sprzedane' | 'wynajęte';
  rooms?: number;
  area: number;
  floor?: number;
  buildingFloors?: number;
  buildYear?: number;
  images: Array<{
    filename: string;
    url?: string;
    isMain: boolean;
    alt?: string;
  }>;
  features: string[];
  customFields?: Array<{
    name: string;
    value: string;
    type: 'text' | 'number' | 'boolean' | 'date';
  }>;
  agent?: {
    _id: string;
    employeeId: string;
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

export interface User {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'root' | 'admin' | 'agent';
  phone?: string;
  avatar?: string;
  bio?: string;
  isActive?: boolean;
  isPublic?: boolean;
  lastLogin?: string;
  createdBy?: string; // ID użytkownika który utworzył tego usera (null dla super admina)
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  employeeId: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'root' | 'admin' | 'agent';
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Payload do tworzenia nieruchomości (frontend -> backend)
export interface CreatePropertyInput {
  title: string;
  description: string;
  price: number;
  type: Property['type'];
  transactionType: Property['transactionType'];
  status: Property['status'];
  area: number;
  isPromoted?: boolean;
  promotionalPrice?: number;
  location: { address: string; city: string; postalCode: string };
  rooms?: number;
  features?: string[];
  agent?: string; // ID użytkownika
}

// Sesje użytkowników
export interface ActiveSession {
  _id: string;
  sessionToken: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    role: string; // Allow any string to match API response
    createdBy?: string;
  };
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  isActive: boolean;
  createdAt?: string;
}