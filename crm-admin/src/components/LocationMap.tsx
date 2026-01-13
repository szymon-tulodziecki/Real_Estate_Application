import React from 'react';

interface LocationMapProps {
  address?: string;
  city: string;
  postalCode?: string;
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  address, 
  city, 
  postalCode, 
  className = "w-full h-64 rounded-lg border border-gray-300"
}) => {
  // Budowanie pełnego adresu do wyszukania
  const getFullAddress = () => {
    const parts = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (postalCode) parts.push(postalCode);
    return parts.join(', ');
  };

  // URL dla Google Maps Embed (do wyświetlania)
  const getEmbedUrl = () => {
    const fullAddress = getFullAddress();
    const encodedAddress = encodeURIComponent(fullAddress);
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodedAddress}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Google Maps Embed */}
      <iframe
        src={getEmbedUrl()}
        className="w-full h-full rounded-lg"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa lokalizacji: ${getFullAddress()}`}
      />
    </div>
  );
};

export default LocationMap;
