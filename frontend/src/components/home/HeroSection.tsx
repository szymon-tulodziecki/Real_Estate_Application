import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Property, SearchFilters, OnNavigate } from '../../types/common';

interface HeroSectionProps {
  properties: Property[];
  onNavigate: OnNavigate;
  onHighlightCategory?: (categoryId: string) => void;
}

export const HeroSection = ({ properties, onNavigate, onHighlightCategory }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const getTextGradientForSlide = (slideId: string) => {
    switch (slideId) {
      case 'mieszkania-pl':
        return {
          title: 'bg-gradient-to-br from-white via-blue-50 to-blue-100 bg-clip-text text-transparent',
          subtitle: 'text-white/95'
        };
      case 'mieszkania-es':
        return {
          title: 'bg-gradient-to-br from-white via-amber-50 to-amber-100 bg-clip-text text-transparent',
          subtitle: 'text-white/95'
        };
      case 'dzialki':
        return {
          title: 'bg-gradient-to-br from-white via-green-50 to-green-100 bg-clip-text text-transparent',
          subtitle: 'text-white/95'
        };
      case 'komercyjne':
        return {
          title: 'bg-gradient-to-br from-white via-slate-50 to-slate-100 bg-clip-text text-transparent',
          subtitle: 'text-white/95'
        };
      default:
        return {
          title: 'text-white',
          subtitle: 'text-white/90'
        };
    }
  };

  type HeroSlide = {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    filters: SearchFilters;
    gradient: string;
    propertyTypes: Property['propertyType'][];
    categoryId: string;
  };

  const heroSlides: HeroSlide[] = [
    {
      id: 'mieszkania-pl',
      title: 'Nieruchomości<br>w Polsce',
      subtitle: 'Znajdź wymarzone mieszkanie<br>w najlepszych lokalizacjach',
      image: '/hero_pl.jpg',
      filters: { type: ['mieszkanie'], transactionType: 'sprzedaż', city: '' },
      gradient: 'from-slate-900/70 to-slate-800/80',
      propertyTypes: ['mieszkanie'],
      categoryId: 'mieszkania'
    },
    {
      id: 'mieszkania-es',
      title: 'Nieruchomości w Hiszpanii',
      subtitle: 'Inwestuj w nieruchomości nad Morzem Śródziemnym',
      image: '/hero_sp.jpg',
      filters: { type: ['mieszkanie'], transactionType: 'sprzedaż', city: 'Hiszpania' },
      gradient: 'from-slate-900/70 to-blue-900/80',
      propertyTypes: ['mieszkanie'],
      categoryId: 'mieszkania'
    },
    {
      id: 'dzialki',
      title: 'Działki budowlane',
      subtitle: 'Postaw dom marzeń na wybranej przez siebie działce',
      image: '/hero_dzialki.jpg',
      filters: { type: ['działka'], transactionType: 'sprzedaż', city: '' },
      gradient: 'from-slate-900/70 to-green-900/80',
      propertyTypes: ['działka'],
      categoryId: 'działki'
    },
    {
      id: 'komercyjne',
      title: 'Nieruchomości komercyjne',
      subtitle: 'Rozwiń swój biznes w strategicznych lokalizacjach',
      image: '/hero_kom.jpg',
      filters: { type: ['komercyjne'], transactionType: 'sprzedaż', city: '' },
      gradient: 'from-slate-900/70 to-slate-800/80',
      propertyTypes: ['komercyjne'],
      categoryId: 'komercyjne'
    }
  ];

  const availableHeroSlides = useMemo(() => {
    if (properties.length === 0) return [];

    return heroSlides.filter(slide => {
      if (!slide.propertyTypes) return true;
      return slide.propertyTypes.some(type =>
        properties.some(property => property.propertyType === type)
      );
    });
  }, [properties, heroSlides]);

  useEffect(() => {
    if (currentSlide >= availableHeroSlides.length && availableHeroSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [availableHeroSlides, currentSlide]);

  useEffect(() => {
    if (isHovered) return;
    
    if (availableHeroSlides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % availableHeroSlides.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isHovered, availableHeroSlides]);

  // Categories should only change when user explicitly interacts with the hero CTA

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.categoryId) {
      onHighlightCategory?.(slide.categoryId);
    }
    onNavigate('properties', { filters: slide.filters });
  };

  const handlePrevSlide = () => {
    if (availableHeroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + availableHeroSlides.length) % availableHeroSlides.length);
  };

  const handleNextSlide = () => {
    if (availableHeroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % availableHeroSlides.length);
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextSlide();
    }
    if (isRightSwipe) {
      handlePrevSlide();
    }
  };

  return (
    <>
      {availableHeroSlides.length > 0 ? (
        <section 
          className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden touch-pan-y"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {availableHeroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1500 ease-linear",
                index === currentSlide ? "opacity-100" : "opacity-0"
              )}
            >
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: `url(${slide.image})`,
                  transform: slide.id === 'mieszkania-pl' ? 'scaleX(-1)' : 'none'
                }}
              />
              <div className={cn("absolute inset-0", slide.gradient)} />
              
              {/* Skośny gradient na całym Hero - łączący się z headerem */}
              <div className="absolute inset-0 z-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0) 100%)'
                   }}>
              </div>
              
              <div className="relative z-10 h-full flex items-center">
                <div className="container mx-auto px-6 md:px-8 lg:px-12">
                  <div className="max-w-3xl mx-auto md:mx-0 md:ml-12 lg:ml-20 relative">
                    {/* Subtelna winieta - widoczna ale nie przesadzona */}
                    <div className="absolute -inset-16 bg-black/12 rounded-full blur-3xl"></div>
                    <div className="absolute -inset-12 bg-black/8 rounded-full blur-2xl"></div>
                    <div className="absolute -inset-8 bg-black/6 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10 text-center md:text-left">
                      <h1 
                        className={cn("text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6", getTextGradientForSlide(slide.id).title)}
                        dangerouslySetInnerHTML={{ __html: slide.title }}
                      />
                      <p 
                        className={cn("text-lg md:text-xl lg:text-2xl mb-8 leading-relaxed font-light", getTextGradientForSlide(slide.id).subtitle)}
                        dangerouslySetInnerHTML={{ __html: slide.subtitle }}
                      />
                      <div className="flex justify-center md:justify-start">
                        <Button
                          onClick={() => handleSlideClick(slide)}
                          size="lg"
                          className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 hover:text-white/90 text-lg px-12 py-4 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20"
                        >
                          Zobacz oferty
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slide indicators with progress */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {availableHeroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "relative w-12 h-1 rounded-full transition-all overflow-hidden",
                  index === currentSlide
                    ? "bg-white/30"
                    : "bg-white/20 hover:bg-white/30"
                )}
              >
                {index === currentSlide && !isHovered && (
                  <div className="absolute inset-0 bg-white rounded-full animate-progress-bar origin-left" />
                )}
              </button>
            ))}
          </div>

          {/* Navigation arrows - hidden on mobile */}
          <button
            onClick={handlePrevSlide}
            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextSlide}
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>
      ) : (
        /* Fallback hero section when no slides available */
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Witamy w naszym biurze nieruchomości</h1>
            <p className="text-xl text-gray-300">Wkrótce pojawią się nowe oferty</p>
          </div>
        </section>
      )}
    </>
  );
};
