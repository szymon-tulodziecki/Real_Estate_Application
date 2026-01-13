import type { Property as CrmProperty, User as CrmUser } from '@/types'
import type { MarketingProperty, MarketingUser } from '@/types/marketing'
import { getPropertyImageUrl } from '@/utils/images'

export function mapCrmPropertyToMarketing(p: CrmProperty): MarketingProperty {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    price: p.promotionalPrice ?? p.price,
    type: mapType(p.type),
    status: mapStatus(p.status),
    bedrooms: p.rooms,
    bathrooms: undefined,
    area: p.area,
    address: `${p.location.address}, ${p.location.city}`,
    location: { lat: 0, lng: 0 },
    images: (p.images || []).map(img => getPropertyImageUrl(p._id, img.filename, img.url)),
    assignedAgentId: p.agent?._id,
    features: p.features || [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export function mapCrmUserToMarketing(u: CrmUser): MarketingUser {
  return {
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    role: (u.role === 'admin' ? 'admin' : 'agent'),
    isVisible: true,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

function mapType(t: CrmProperty['type']): MarketingProperty['type'] {
  switch (t) {
    case 'mieszkanie': return 'apartment'
    case 'dom': return 'house'
    case 'lokal': return 'commercial'
    case 'działka': return 'land'
  }
}

function mapStatus(s: CrmProperty['status']): MarketingProperty['status'] {
  switch (s) {
    case 'aktywne': return 'available'
    case 'sprzedane': return 'sold'
    case 'wynajęte': return 'rented'
    default: return 'available'
  }
}
