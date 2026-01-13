import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Property, OnNavigate } from '../../types/common';

interface FeaturedPropertiesSectionProps {
  featuredProperties: Property[];
  loading: boolean;
  error: string | null;
  onNavigate: OnNavigate;
  activeFilter?: string;
  onCategoryClick?: (categoryId: string) => void;
  getAvailableCategories?: () => { id: string; title: string; count?: number }[];
}

export const FeaturedPropertiesSection = ({ 
  featuredProperties, 
  loading, 
  error, 
  onNavigate,
  activeFilter = 'mieszkania',
  onCategoryClick = () => {},
  getAvailableCategories = () => []
}: FeaturedPropertiesSectionProps) => {
  if (loading) {
    return (
      <section className="pb-16 bg-slate-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Ładowanie ofert...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pb-16 bg-slate-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 font-medium">Błąd podczas ładowania ofert</p>
              <p className="text-gray-600 mt-2">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-600 text-white hover:bg-red-700"
              >
                Spróbuj ponownie
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProperties.length === 0) {
    return null;
  }

  return (
    <section className="pb-16 bg-slate-50">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        {/* Header: Mobile = Column Centered, Desktop = Row Space Between */}
        <div className="flex flex-col md:flex-row items-center md:justify-between mb-8 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold">Aktualne oferty</h2>
          </div>
          
          <Button 
            onClick={() => onNavigate('properties', { filters: {} })}
            className="bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all duration-300 w-full md:w-auto"
          >
            Zobacz wszystkie
          </Button>
        </div>
        
        {/* Category filter buttons */}
        {getAvailableCategories().length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {getAvailableCategories().map((slide: { id: string; title: string; count?: number }) => (
              <button
                key={slide.id}
                onClick={() => onCategoryClick(slide.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  activeFilter === slide.id 
                    ? "bg-red-600 text-white shadow-md" 
                    : "bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                )}
              >
                {slide.title.replace(/<br\s*\/?>/gi, ' ')}
              </button>
            ))}
          </div>
        )}
        
        {/* Properties Layout: Swipe on Mobile, Grid on Desktop */}
        <div className="flex justify-center">
          <div className={cn(
            // MOBILE styles
            "flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-4 scrollbar-hide w-full",
            // DESKTOP styles
            "md:grid md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:gap-6 md:w-auto md:max-w-6xl",
            // Desktop columns logic
            featuredProperties.length === 1 ? "md:grid-cols-1 md:max-w-md" :
            featuredProperties.length === 2 ? "md:grid-cols-2 md:max-w-2xl" :
            "md:grid-cols-2 xl:grid-cols-3"
          )}>
            {featuredProperties.map((property) => {
              const locationLabel = [property.city, property.district, property.address]
                .filter(Boolean)
                .join(', ') || property.location;

              const metaItems: string[] = [];
              if (property.buildYear) {
                metaItems.push(`Rok ${property.buildYear}`);
              }
              if (property.floor !== null && property.floor !== undefined) {
                metaItems.push(property.floor === 0 ? 'Parter' : `Piętro ${property.floor}`);
              }
              if (property.buildingFloors) {
                metaItems.push(`${property.buildingFloors} kond.`);
              }
              const metaLabel = metaItems.join(' • ');

              const basePrice = property.price ?? 0;
              const displayPrice = property.promotionalPrice ?? basePrice;
              const formattedPrice = displayPrice.toLocaleString('pl-PL', {
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).replace(/,/g, ' ');
              const formattedBasePrice = property.promotionalPrice ? basePrice.toLocaleString('pl-PL', {
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).replace(/,/g, ' ') : null;

              const roomsLabel = typeof property.rooms === 'number' && property.rooms > 0
                ? `${property.rooms} ${property.rooms === 1 ? 'pokój' : property.rooms > 4 ? 'pokoi' : 'pokoje'}`
                : null;

              return (
                <Card 
                  key={property.id} 
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-600/10 border border-slate-300 shadow-md rounded-3xl overflow-hidden h-full flex flex-col bg-[#F8FAFC]",
                    // Mobile sizing
                    "flex-shrink-0 w-[85vw] sm:w-[350px] snap-center",
                    // Desktop sizing
                    "md:w-auto md:flex-shrink md:snap-align-none"
                  )}
                >
                  <div className="relative overflow-hidden p-3">
                    <div className="aspect-[16/9] relative rounded-2xl overflow-hidden">
                      <img 
                        src={property.image} 
                        alt={`${property.title}, ${locationLabel}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <div className={`${
                          property.type === 'sale' 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                        } text-xs px-3 py-1.5 rounded-full font-semibold border uppercase`}>
                          {property.type === 'sale' ? 'Sprzedaż' : 'Wynajem'}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-gray-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigate('property-detail', { propertyId: property.id });
                          }}
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Podgląd
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                      <p className="text-sm text-slate-700 mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {locationLabel}
                      </p>
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2 group-hover:text-red-600 transition-colors flex-1">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-slate-700 tracking-tight">
                          {formattedPrice} PLN{property.transactionType === 'wynajem' ? '/mies.' : ''}
                        </span>
                        {formattedBasePrice && (
                          <span className="text-sm text-slate-500 line-through">
                            {formattedBasePrice} PLN
                          </span>
                        )}
                        {property.status && !['aktywne', 'sprzedane'].includes(property.status.toLowerCase()) && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                            {property.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                          </svg>
                          {property.area} m²
                        </span>
                        {roomsLabel && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0v8a1 1 0 01-1 1h-8a1 1 0 01-1-1V4m0 0H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                            </svg>
                            {roomsLabel}
                          </span>
                        )}
                        {metaLabel && (
                          <span className="text-xs text-slate-700">{metaLabel}</span>
                        )}
                      </div>
                      <div className="mt-auto">
                        <Button 
                          size="sm" 
                          className="w-full bg-red-600 hover:bg-red-700 text-white h-9"
                          onClick={() => onNavigate('property-detail', { propertyId: property.id })}
                        >
                          Szczegóły
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};