export interface MarketingUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  bio?: string
  specializations?: string[]
  experienceYears?: number
  socialMedia?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }
  role: 'agent' | 'admin'
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface MarketingProperty {
  id: string
  title: string
  description: string
  price: number
  type: 'apartment' | 'house' | 'commercial' | 'land'
  status: 'available' | 'sold' | 'rented' | 'pending'
  bedrooms?: number
  bathrooms?: number
  area: number
  address: string
  location: {
    lat: number
    lng: number
  }
  images: string[]
  assignedAgentId?: string
  features: string[]
  socialSharing?: {
    facebook?: { enabled: boolean; customMessage?: string }
    instagram?: { enabled: boolean; customMessage?: string }
  }
  createdAt: string
  updatedAt: string
}

export interface MarketingContactForm {
  name: string
  email: string
  phone?: string
  message: string
  propertyId?: string
  agentId?: string
}
