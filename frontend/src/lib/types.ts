export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  isPromoted: boolean;
  area: number;
  rooms?: number;
  type: 'mieszkanie' | 'dom' | 'lokal' | 'działka' | 'komercyjne';
  transactionType: 'sprzedaż' | 'wynajem';
  status: 'aktywne' | 'sprzedane' | 'wynajęte';
  location: {
    address?: string;
    city: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: string[];
  images: string[];
  agent: {
    id: string;
    name: string;
    phone: string;
    email: string;
    photo?: string;
    bio?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  isActive: boolean;
}

export interface SearchFilters {
  type?: Property['type'][];
  transactionType?: Property['transactionType'];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number[];
  city?: string;
  features?: string[];
  status?: Property['status'];
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string;
  agentId?: string;
  type: 'general' | 'property-inquiry' | 'valuation' | 'viewing';
}

export interface NewsletterSubscription {
  email: string;
  gdprConsent: boolean;
  source?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  alertsEnabled: boolean;
}

export interface CompanyInfo {
  name: string;
  description: string;
  offices: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface PropertyStats {
  totalProperties: number;
  totalCities: number;
  averagePrice: number;
  totalSold: number;
}

export const PROPERTY_TYPES = {
  mieszkanie: 'Mieszkanie',
  dom: 'Dom',
  lokal: 'Lokal',
  działka: 'Działka',
  komercyjne: 'Komercyjne'
} as const;

export const TRANSACTION_TYPES = {
  sprzedaż: 'Sprzedaż',
  wynajem: 'Wynajem'
} as const;

export const PROPERTY_STATUS = {
  aktywne: 'Aktywne',
  sprzedane: 'Sprzedane',
  wynajęte: 'Wynajęte'
} as const;

export const COMMON_FEATURES = [
  'balkon',
  'taras',
  'ogród',
  'garaż',
  'parking',
  'winda',
  'piwnica',
  'komórka lokatorska',
  'klimatyzacja',
  'monitoring',
  'domofon',
  'alarmy',
  'nowe budownictwo',
  'do remontu',
  'umeblowane',
  'dla zwierząt',
  'internet światłowodowy',
  'gaz miejski',
  'centralne ogrzewanie'
] as const;