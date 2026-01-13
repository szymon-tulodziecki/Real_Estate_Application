import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dl3tmkryv/image/upload';
const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('pl-PL')} m²`;
}

export function formatRooms(rooms: number): string {
  if (rooms === 1) return '1 pokój';
  if (rooms >= 2 && rooms <= 4) return `${rooms} pokoje`;
  return `${rooms} pokoi`;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('48')) {
    const number = cleaned.substring(2);
    return `+48 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  return phone;
}

export function getPropertySlug(property: { id: string; title: string }): string {
  const slug = property.title
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
      };
      return map[match] || match;
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${slug}-${property.id}`;
}

export function extractIdFromSlug(slug: string): string {
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+48\s?)?[4-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function parseNumericInput(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const collapsed = value
    .replace(/\u00A0/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '');

  const cleaned = collapsed.replace(/[^0-9,.-]/g, '');

  if (!cleaned) {
    return null;
  }

  const hasComma = cleaned.includes(',');
  const dotCount = (cleaned.match(/\./g) || []).length;
  const hasSingleDot = dotCount === 1;
  const decimalSeparator = hasComma ? ',' : hasSingleDot ? '.' : null;

  const stripNonDigits = (text: string) => text.replace(/[^0-9]/g, '');

  let normalizedNumber: string;

  if (decimalSeparator) {
    const separatorIndex = cleaned.lastIndexOf(decimalSeparator);
    const integerPart = stripNonDigits(cleaned.slice(0, separatorIndex));
    const fractionalPart = stripNonDigits(cleaned.slice(separatorIndex + 1));
    normalizedNumber = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
  } else {
    normalizedNumber = stripNonDigits(cleaned);
  }

  if (!normalizedNumber) {
    return null;
  }

  const parsed = Number(normalizedNumber);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createSearchParams(filters: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else if (!Array.isArray(value)) {
        params.set(key, String(value));
      }
    }
  });
  
  return params;
}

export function parseSearchParams(searchParams: URLSearchParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  
  for (const [key, value] of searchParams) {
    if (value.includes(',')) {
      filters[key] = value.split(',');
    } else if (key.includes('Min') || key.includes('Max') || key === 'rooms') {
      const num = Number(value);
      if (!isNaN(num)) {
        filters[key] = num;
      }
    } else {
      filters[key] = value;
    }
  }
  
  return filters;
}

type PropertyImageSource = {
  filename?: string;
  url?: string;
} | string | null | undefined;

const buildAbsoluteCloudinaryUrl = (value: string) => {
  const normalized = value.replace(/^\/+/, '');
  return `${CLOUDINARY_BASE_URL}/${normalized}`;
};

export function getPropertyImageUrl(image?: PropertyImageSource): string {
  if (!image) {
    return DEFAULT_PROPERTY_IMAGE;
  }

  if (typeof image === 'string') {
    if (!image.trim()) {
      return DEFAULT_PROPERTY_IMAGE;
    }
    return image.startsWith('http') ? image : buildAbsoluteCloudinaryUrl(image);
  }

  if (image.url) {
    return image.url.startsWith('http') ? image.url : buildAbsoluteCloudinaryUrl(image.url);
  }

  if (image.filename) {
    return image.filename.startsWith('http') ? image.filename : buildAbsoluteCloudinaryUrl(image.filename);
  }

  return DEFAULT_PROPERTY_IMAGE;
}

export function normalizeCoordinates(coordinates: unknown): { lat: number; lng: number } | null {
  if (!coordinates) {
    return null;
  }

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
  }

  if (typeof coordinates === 'object') {
    const coords = coordinates as Record<string, unknown>;

    if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng };
    }

    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return { lat: coords.latitude, lng: coords.longitude };
    }

    if (typeof coords.y === 'number' && typeof coords.x === 'number') {
      return { lat: coords.y, lng: coords.x };
    }
  }

  return null;
}

// Convert API property to our Property interface
export const convertApiProperty = (apiProp: import('../lib/api').Property): import('../types/common').Property => {
  const typeMap: Record<string, import('../types/common').Property['propertyType']> = {
    'mieszkanie': 'mieszkanie',
    'mieszkania': 'mieszkanie',
    'dom': 'dom',
    'domy': 'dom',
    'działka': 'działka',
    'działki': 'działka',
    'komercyjne': 'komercyjne',
    'lokal': 'komercyjne',
    'biuro': 'komercyjne',
    'sklep': 'komercyjne',
    'magazyn': 'komercyjne'
  };

  const propertyType = apiProp.type
    ? typeMap[apiProp.type.toLowerCase()] || 'mieszkanie'
    : 'mieszkanie';

  const images = Array.isArray(apiProp.images) ? apiProp.images : [];
  const mainImage = images.find((img) => img && typeof img === 'object' && 'isMain' in img && img.isMain);
  const fallbackImage = images.find((img) => img) ?? null;
  const coverImage = getPropertyImageUrl(mainImage || fallbackImage);

  const city = apiProp.location?.city?.trim() || '';
  const district = apiProp.location?.district?.trim() || '';
  const address = apiProp.location?.address?.trim() || '';
  const voivodeship = apiProp.location?.voivodeship?.trim() || '';
  const postalCode = apiProp.location?.postalCode?.trim() || '';

  const locationLabel = [city, district, address]
    .filter(Boolean)
    .join(', ') || city || address || 'Lokalizacja w przygotowaniu';

  const agentFullName = apiProp.agent
    ? `${apiProp.agent.firstName ?? ''} ${apiProp.agent.lastName ?? ''}`.trim() || undefined
    : undefined;

  const transactionType = apiProp.transactionType || 'sprzedaż';

  const parsedPrice = parseNumericInput(apiProp.price);
  const parsedPromotionalPrice = parseNumericInput(apiProp.promotionalPrice);

  return {
    id: apiProp._id || (apiProp as { id?: string }).id || `temp-${Math.random().toString(36).slice(2)}`,
    title: apiProp.title || 'Oferta bez tytułu',
    price: parsedPrice ?? 0,
    promotionalPrice: parsedPromotionalPrice ?? undefined,
    isPromoted: Boolean(apiProp.isPromoted),
    area: apiProp.area ?? 0,
    rooms: typeof apiProp.rooms === 'number' ? apiProp.rooms : null,
    image: coverImage,
    type: transactionType === 'wynajem' ? 'rent' : 'sale',
    transactionType,
    propertyType,
    status: apiProp.status,
    location: locationLabel,
    city,
    address,
    district,
    voivodeship,
    postalCode,
    buildYear: apiProp.buildYear ?? undefined,
    floor: typeof apiProp.floor === 'number' ? apiProp.floor : null,
    buildingFloors: typeof apiProp.buildingFloors === 'number' ? apiProp.buildingFloors : null,
    features: Array.isArray(apiProp.features) ? apiProp.features : [],
    agent: apiProp.agent
      ? {
          id: apiProp.agent._id,
          firstName: apiProp.agent.firstName,
          lastName: apiProp.agent.lastName,
          fullName: agentFullName,
          phone: apiProp.agent.phone,
          email: apiProp.agent.email,
          avatar: (apiProp.agent as { avatar?: string }).avatar,
          bio: (apiProp.agent as { bio?: string }).bio,
        }
      : undefined,
  };
};
