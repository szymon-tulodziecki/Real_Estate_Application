import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MapPin, 
  Bed, 
  Car,
  Phone,
  Eye
} from '@phosphor-icons/react';
import { Property } from '../lib/types';
import { cn, formatPrice, formatArea, formatRooms } from '../lib/utils';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewDetails: (id: string) => void;
  className?: string;
}

export default function PropertyCard({ 
  property, 
  isFavorite, 
  onToggleFavorite, 
  onViewDetails,
  className 
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const primaryImage = property.images[currentImageIndex] || property.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

  const getStatusBadge = () => {
    switch (property.status) {
      case 'sprzedane':
        return <Badge variant="destructive" className="absolute top-3 left-3">Sprzedane</Badge>;
      case 'wynajęte':
        return <Badge variant="secondary" className="absolute top-3 left-3">Wynajęte</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = () => {
    const typeColors = {
      mieszkanie: 'bg-blue-100 text-blue-800',
      dom: 'bg-green-100 text-green-800',
      lokal: 'bg-purple-100 text-purple-800',
      działka: 'bg-orange-100 text-orange-800',
      komercyjne: 'bg-indigo-100 text-indigo-800'
    };

    return (
      <Badge 
        variant="secondary" 
        className={cn("absolute top-3 right-14", typeColors[property.type])}
      >
        {property.type}
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
      className
    )}>
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={primaryImage}
          alt={property.title}
          className={cn(
            "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
            !imageLoaded && "bg-muted animate-pulse"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Status Badge */}
        {getStatusBadge()}
        
        {/* Type Badge */}
        {getTypeBadge()}
        
        {/* Promoted Badge */}
        {property.isPromoted && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
            Promowane
          </Badge>
        )}
        
        {/* Favorite Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-3 right-3 w-10 h-10 p-0 bg-white/90 hover:bg-white hover:scale-110 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart 
            size={18} 
            weight={isFavorite ? "fill" : "regular"}
            className={isFavorite ? "text-red-500" : "text-gray-600"}
          />
        </Button>

        {/* Image Navigation */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
            {property.images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentImageIndex ? "bg-white" : "bg-white/60 hover:bg-white/80"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Price */}
        <div className="mb-3">
          {property.promotionalPrice ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold text-accent">
                {formatPrice(property.promotionalPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(property.price)}
              </span>
              <Badge variant="secondary" className="text-[11px] bg-amber-100 text-amber-800 border-amber-200">
                PROMO
              </Badge>
            </div>
          ) : (
            <span className="text-2xl font-bold text-accent">
              {formatPrice(property.price)}
            </span>
          )}
          <span className="text-sm text-muted-foreground ml-1">
            {property.transactionType === 'wynajem' ? '/miesiąc' : ''}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground mb-3">
          <MapPin size={16} />
          <span className="text-sm">
            {property.location.city}
            {property.location.address && `, ${property.location.address}`}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">{formatArea(property.area)}</span>
          </div>
          
          {property.rooms && (
            <div className="flex items-center gap-1">
              <Bed size={16} />
              <span>{formatRooms(property.rooms)}</span>
            </div>
          )}
          
          {property.features.includes('garaż') && (
            <div className="flex items-center gap-1">
              <Car size={16} />
              <span>Garaż</span>
            </div>
          )}
        </div>

        {/* Features */}
        {property.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {property.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.features.length - 3} więcej
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="w-full">
          {/* Agent Info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
              {property.agent.photo ? (
                <img 
                  src={property.agent.photo} 
                  alt={property.agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-accent font-semibold text-sm">
                  {property.agent.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{property.agent.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                Agent nieruchomości
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(property.id)}
              className="w-full"
            >
              <Eye size={16} className="mr-2" />
              Szczegóły
            </Button>
            
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 w-full"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${property.agent.phone}`, '_self');
              }}
            >
              <Phone size={16} className="mr-2" />
              Kontakt
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}