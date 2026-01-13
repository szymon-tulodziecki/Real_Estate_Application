export interface Property {
  id: string;
  title: string;
  price: number;
  promotionalPrice?: number;
  isPromoted?: boolean;
  area: number;
  rooms?: number | null;
  image: string;
  type: 'sale' | 'rent';
  transactionType?: 'sprzedaż' | 'wynajem' | 'sprzedaż_wynajem';
  propertyType: 'mieszkanie' | 'dom' | 'lokal' | 'działka' | 'komercyjne';
  status?: 'aktywne' | 'sprzedane' | 'wynajęte' | 'wycofane' | 'weryfikacja' | 'rezerwacja';
  location: string;
  city?: string;
  address?: string;
  district?: string;
  voivodeship?: string;
  postalCode?: string;
  buildYear?: number;
  floor?: number | null;
  buildingFloors?: number | null;
  features?: string[];
  agent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface RecentlySoldSummary {
  id: string;
  title: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  location: string;
  city?: string;
  district?: string;
  agentName?: string;
  transactionType: 'sprzedaż' | 'wynajem' | 'sprzedaż_wynajem';
  soldAt: string;
}

export interface SearchFilters {
  type?: ('mieszkanie' | 'dom' | 'lokal' | 'działka' | 'komercyjne')[];
  transactionType?: 'sprzedaż' | 'wynajem';
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number[];
  city?: string;
  features?: string[];
  status?: 'aktywne' | 'sprzedane' | 'wynajęte';
}

export type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

export interface NavigateOptions {
  propertyId?: string;
  filters?: SearchFilters;
  replaceState?: boolean;
}

export type OnNavigate = (route: Route, options?: NavigateOptions) => void;
