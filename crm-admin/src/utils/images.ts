// Helper functions for property images
import type { Property } from '../types';

const CLOUDINARY_CLOUD_NAME = 'dl3tmkryv';

// Get image URL for property - Cloudinary URL is stored in url field or filename
export const getPropertyImageUrl = (propertyId: string, filename: string, url?: string) => {
  // If url is provided (Cloudinary), use it directly
  if (url) {
    return url;
  }
  // If filename is already a full URL (Cloudinary), return it directly
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // If filename looks like a Cloudinary public_id (e.g., "real_estate_crm/properties/..."), build URL
  if (filename.includes('/')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`;
  }
  
  // Legacy support for old file-manager URLs
  const fileServerUrl = import.meta.env.VITE_FILE_SERVER_URL || 'http://localhost:3001';
  return `${fileServerUrl}/uploads/properties/${propertyId}/${filename}`;
};

// Get thumbnail URL for property - Cloudinary handles transformations
export const getPropertyThumbnailUrl = (propertyId: string, filename: string, url?: string) => {
  // Use url field if provided (Cloudinary)
  const imageUrl = url || filename;
  
  // If using Cloudinary, apply thumbnail transformation
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Cloudinary thumbnail transformation
    return imageUrl.replace('/upload/', '/upload/w_400,h_300,c_fill/');
  }
  
  // If filename looks like a Cloudinary public_id, build thumbnail URL
  if (filename.includes('/')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fill/${filename}`;
  }
  
  // Legacy support
  const fileServerUrl = import.meta.env.VITE_FILE_SERVER_URL || 'http://localhost:3001';
  return `${fileServerUrl}/uploads/properties/${propertyId}/thumb_${filename}`;
};

// Get main image for property
export const getMainImage = (property: Property) => {
  if (!property.images || property.images.length === 0) {
    return null;
  }
  
  const mainImage = property.images.find((img) => img.isMain);
  return mainImage || property.images[0];
};

// Get main image URL
export const getMainImageUrl = (property: Property) => {
  const mainImage = getMainImage(property);
  if (!mainImage) {
    return null;
  }
  
  return getPropertyImageUrl(property._id, mainImage.filename, mainImage.url);
};

// Get all image URLs for property
export const getPropertyImageUrls = (property: Property) => {
  if (!property.images || property.images.length === 0) {
    return [];
  }
  
  return property.images.map((img) => ({
    ...img,
    url: img.url || getPropertyImageUrl(property._id, img.filename, img.url),
    thumbnailUrl: getPropertyThumbnailUrl(property._id, img.filename, img.url)
  }));
};
