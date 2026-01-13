import { useState, useEffect, useCallback, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient, Property } from '@/lib/api';
import {
  MapPin,
  Bed,
  ArrowsOut,
  Phone,
  CalendarBlank,
  User,
  Check,
  X,
  Buildings,
  ShareNetwork
} from '@phosphor-icons/react';
import { cn, formatPrice, getPropertyImageUrl, normalizeCoordinates } from '@/lib/utils';
import { PropertyLocationMap } from '@/components/PropertyLocationMap';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface PropertyDetailPageProps {
  propertyId: string | null;
  onNavigate: (route: Route) => void;
}

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return 'Brak danych';
  }
};

function PropertyDetailPage({ propertyId, onNavigate }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const propertyLocation = property?.location ?? null;
  const city = propertyLocation?.city?.trim() ?? '';
  const district = propertyLocation?.district?.trim() ?? '';
  const address = propertyLocation?.address?.trim() ?? '';
  const voivodeship = propertyLocation?.voivodeship?.trim() ?? '';
  const postalCode = propertyLocation?.postalCode?.trim() ?? '';
  const locationLabel = [city, district, address].filter(Boolean).join(', ') || city || address || 'Lokalizacja w przygotowaniu';

  const propertyImagesSource = Array.isArray(property?.images) ? property.images : [];
  const propertyImages = propertyImagesSource.length > 0
    ? [...propertyImagesSource].sort((a, b) => Number(Boolean(b?.isMain)) - Number(Boolean(a?.isMain)))
    : [null];
  const selectedImage = propertyImages[selectedImageIndex] ?? propertyImages[0];
  const selectedImageUrl = getPropertyImageUrl(selectedImage);

  const createdDateLabel = property?.createdAt ? formatDate(property.createdAt) : 'Brak danych';
  const promotionalPrice = typeof property?.promotionalPrice === 'number' && property.promotionalPrice > 0
    ? property.promotionalPrice
    : null;
  const basePrice = property?.price ?? 0;
  const displayPrice = promotionalPrice ?? basePrice;
  const hasDiscount = promotionalPrice !== null && promotionalPrice < basePrice;
  const isRentTransaction = property?.transactionType === 'wynajem';
  const transactionLabel = property?.transactionType === 'sprzedaż_wynajem'
    ? 'Sprzedaż / Wynajem'
    : isRentTransaction
      ? 'Wynajem'
      : 'Sprzedaż';

  const formatPropertyType = (value?: string | null) => {
    if (!value) return 'Brak danych';
    const normalized = value.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const normalizedStatus = property?.status?.toLowerCase();
  const statusChip = property?.status && !['aktywne', 'sprzedane'].includes(normalizedStatus ?? '') ? property.status : null;
  const statusChipClass = normalizedStatus === 'wynajęte'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  const coordinates = normalizeCoordinates(propertyLocation?.coordinates);
  const hasLocationForMap = Boolean(coordinates || city || district || address);
  const propertyFeatures = Array.isArray(property?.features) ? property.features.filter(Boolean) : [];
  const agentFullName = property?.agent
    ? [property.agent.firstName, property.agent.lastName].filter(Boolean).join(' ').trim()
    : '';
  const agentAvatarUrl = property?.agent?.avatar ? getPropertyImageUrl(property.agent.avatar) : null;
  const hasRooms = typeof property?.rooms === 'number';
  const formattedFloor = typeof property?.floor === 'number' ? (property.floor === 0 ? 'Parter' : property.floor.toString()) : null;
  const formattedBuildingFloors = typeof property?.buildingFloors === 'number' ? property.buildingFloors.toString() : null;
  const propertyReference = property?._id || (property as { id?: string })?.id || 'brak danych';
  const pricePerSquareMeter = property?.area ? Math.round(displayPrice / property.area) : null;

  const loadProperty = useCallback(async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getProperty(propertyId);

      if (response.success && response.data) {
        setProperty(response.data);
        setSelectedImageIndex(0);
        setIsLightboxOpen(false);
      } else {
        setError('Nie udało się załadować nieruchomości');
      }
    } catch (err) {
      console.error('Error loading property:', err);
      setError('Wystąpił błąd podczas ładowania nieruchomości');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const updateShareFeedback = useCallback((message: string | null) => {
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }

    setShareFeedback(message);

    if (message) {
      shareTimeoutRef.current = setTimeout(() => {
        setShareFeedback(null);
        shareTimeoutRef.current = null;
      }, 3000);
    }
  }, []);

  const handleShareOffer = useCallback(async () => {
    if (!property) return;

    const payload = {
      title: property.title,
      text: property.description ?? '',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        updateShareFeedback('Udostępniono ofertę');
        return;
      }

      await navigator.clipboard.writeText(payload.url);
      updateShareFeedback('Skopiowano link do schowka');
    } catch (shareError) {
      console.error('Nie udało się udostępnić oferty', shareError);
      updateShareFeedback('Nie udało się udostępnić oferty');
    }
  }, [property, updateShareFeedback]);

  const showPreviousImage = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (propertyImages.length <= 1) {
        return 0;
      }
      return prev === 0 ? propertyImages.length - 1 : prev - 1;
    });
  }, [propertyImages.length]);

  const showNextImage = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (propertyImages.length <= 1) {
        return 0;
      }
      return prev === propertyImages.length - 1 ? 0 : prev + 1;
    });
  }, [propertyImages.length]);

  const openLightbox = () => {
    if (propertyImages.length === 0) {
      return;
    }
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleImageKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      openLightbox();
    }
  };

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  useEffect(() => {
    return () => {
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedImageIndex >= propertyImages.length) {
      setSelectedImageIndex(0);
    }
  }, [propertyImages.length, selectedImageIndex]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPreviousImage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, showNextImage, showPreviousImage]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 md:pt-24">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 md:px-10 lg:px-12 text-slate-600">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-red-500" />
            <p>Ładujemy szczegóły nieruchomości…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 md:pt-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8 lg:px-12 py-16 text-slate-900">
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-red-700">{error || 'Nie znaleziono nieruchomości'}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={loadProperty}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:bg-red-500"
              >
                Spróbuj ponownie
              </Button>
              <Button
                onClick={() => onNavigate('properties')}
                variant="outline"
                className="rounded-full border-slate-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 hover:border-slate-400 hover:bg-slate-200"
              >
                Wróć do listy
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  type QuickFact = { label: string; value: string; Icon: typeof ArrowsOut };
  const quickFacts: QuickFact[] = [
    { label: 'Powierzchnia', value: `${property.area} m²`, Icon: ArrowsOut },
    hasRooms ? { label: 'Pokoje', value: `${property.rooms}`, Icon: Bed } : null,
    typeof property.buildYear === 'number' ? { label: 'Rok budowy', value: property.buildYear.toString(), Icon: CalendarBlank } : null,
    formattedFloor ? { label: 'Poziom', value: formattedFloor, Icon: Buildings } : null,
  ].filter((item): item is QuickFact => Boolean(item && item.value));

  const detailItems = [
    { label: 'Typ nieruchomości', value: formatPropertyType(property.type) },
    { label: 'Transakcja', value: transactionLabel },
    { label: 'Powierzchnia', value: `${property.area} m²` },
    hasRooms ? { label: 'Pokoje', value: `${property.rooms}` } : null,
    formattedFloor ? { label: 'Piętro', value: formattedFloor } : null,
    formattedBuildingFloors ? { label: 'Liczba kondygnacji', value: formattedBuildingFloors } : null,
    typeof property.buildYear === 'number' ? { label: 'Rok budowy', value: `${property.buildYear}` } : null,
    city ? { label: 'Miasto', value: city } : null,
    district ? { label: 'Dzielnica', value: district } : null,
    address ? { label: 'Adres', value: address } : null,
    voivodeship ? { label: 'Województwo', value: voivodeship } : null,
    postalCode ? { label: 'Kod pocztowy', value: postalCode } : null,
    pricePerSquareMeter ? { label: 'Cena / m²', value: `${formatPrice(pricePerSquareMeter)} / m²` } : null,
    propertyReference ? { label: 'ID oferty', value: propertyReference.substring(0, 10) + '...' } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item && item.value));

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-10 lg:px-12 py-8 md:py-16 text-slate-900">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
            <Button
              variant="outline"
              onClick={() => onNavigate('properties')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-slate-300 bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-200"
            >
              ← Wróć do listy
            </Button>
            <div className="flex items-center justify-center sm:justify-end gap-2 text-xs uppercase tracking-[0.4em] text-slate-500">
              <CalendarBlank size={16} />
              <span>Dodano {createdDateLabel}</span>
            </div>
          </div>

          <div className="grid gap-8 lg:gap-10 lg:grid-cols-[2fr_1fr]">
            {/* Left Column: Gallery & Details */}
            <div className="space-y-8 md:space-y-10">
              
              {/* Image Gallery */}
              <div className="space-y-3">
                <div
                  className="relative aspect-[4/3] md:aspect-[16/9] cursor-zoom-in overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md"
                  role="button"
                  tabIndex={0}
                  onClick={openLightbox}
                  onKeyDown={handleImageKeyDown}
                  aria-label="Powiększ galerię nieruchomości"
                >
                  <img
                    src={selectedImageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  
                  {/* GRADIENT - Hidden on Mobile (md:block) */}
                  <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

                  {/* BADGES - Always visible, standard positioning */}
                  <div className="pointer-events-none absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] md:tracking-[0.4em]',
                        isRentTransaction ? 'text-sky-600' : 'text-emerald-600'
                      )}
                    >
                      {transactionLabel}
                    </span>
                    {statusChip && (
                      <span className={cn('inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] md:tracking-[0.4em]', statusChipClass)}>
                        {statusChip}
                      </span>
                    )}
                  </div>

                  {/* COUNTER */}
                  {propertyImages.length > 1 && (
                    <div className="pointer-events-none absolute right-4 top-4 md:right-6 md:top-6 rounded-full bg-white/90 px-3 py-1 md:px-4 md:py-1 text-[10px] md:text-xs font-medium text-slate-700 shadow">
                      {selectedImageIndex + 1} / {propertyImages.length}
                    </div>
                  )}

                  {/* DESKTOP CONTENT OVERLAY (Hidden on Mobile) */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 px-8 pb-10 pt-16 text-white">
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="mb-3 flex items-center gap-2 text-sm text-white/90">
                          <MapPin size={16} weight="fill" className="text-red-200" />
                          {locationLabel}
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
                          {property.title}
                        </h1>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-2">
                          <div>
                            <span className="text-xs uppercase tracking-[0.35em] text-white/70">Cena</span>
                            <p className="text-4xl font-semibold">{formatPrice(displayPrice)}</p>
                            {isRentTransaction && (
                              <span className="text-xs uppercase tracking-[0.3em] text-white/70">/ miesiąc</span>
                            )}
                          </div>
                          {hasDiscount && (
                            <Badge variant="secondary" className="text-[11px] bg-amber-100/90 text-amber-900 border-amber-200">
                              PROMO
                            </Badge>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="mt-1 text-sm font-medium text-white/80 line-through">
                            {formatPrice(basePrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-6 text-sm uppercase tracking-[0.3em] text-white/90">
                      <span className="inline-flex items-center gap-2">
                        <ArrowsOut size={18} className="text-red-200" />
                        {property.area} m²
                      </span>
                      {hasRooms && (
                        <span className="inline-flex items-center gap-2">
                          <Bed size={18} className="text-red-200" />
                          {property.rooms} pok.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* MOBILE CONTENT (Below Image) - CZERWONY I WYŚRODKOWANY */}
                <div className="md:hidden space-y-4 px-1 text-center">
                  <div className="flex flex-col gap-2 items-center">
                    <h1 className="text-2xl font-bold leading-tight text-red-600">
                      {property.title}
                    </h1>
                    <p className="flex items-center justify-center gap-2 text-xs text-red-500/80">
                      <MapPin size={16} weight="fill" className="text-red-500" />
                      {locationLabel}
                    </p>
                  </div>

                  <div className="border-b border-red-100/50 pb-4">
                    <div>
                      <p className="text-3xl font-bold text-red-600">
                        {formatPrice(displayPrice)}
                        {isRentTransaction && <span className="text-sm font-normal text-red-500/80"> / m-c</span>}
                      </p>
                      {hasDiscount && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <p className="text-xs text-red-400 line-through">{formatPrice(basePrice)}</p>
                          <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 border-red-200">PROMO</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 text-xs font-medium uppercase tracking-widest text-red-600">
                    <span className="flex items-center gap-2">
                      <ArrowsOut size={16} className="text-red-500" />
                      {property.area} m²
                    </span>
                    {hasRooms && (
                      <span className="flex items-center gap-2">
                        <Bed size={16} className="text-red-500" />
                        {property.rooms} pok.
                      </span>
                    )}
                  </div>
                </div>

                {/* Image Thumbnails - Scrollable on mobile */}
                {propertyImages.length > 1 && (
                  <div className="flex overflow-x-auto gap-3 pb-2 md:grid md:grid-cols-4 md:overflow-visible scrollbar-hide mt-4 md:mt-0">
                    {propertyImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          'relative flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 transition hover:border-red-200 w-24 h-24 md:w-auto md:h-28',
                          selectedImageIndex === index ? 'ring-2 ring-red-300' : ''
                        )}
                      >
                        <img
                          src={getPropertyImageUrl(img)}
                          alt={`Zdjęcie ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                <h2 className="text-xs md:text-sm uppercase tracking-[0.35em] text-slate-500">Opis nieruchomości</h2>
                <p className="mt-4 md:mt-6 whitespace-pre-wrap text-sm md:text-base leading-relaxed text-slate-700">
                  {property.description || 'Opis tej nieruchomości jest aktualnie przygotowywany.'}
                </p>
              </div>

              {/* Features */}
              {propertyFeatures.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                  <h2 className="text-xs md:text-sm uppercase tracking-[0.35em] text-slate-500">Udogodnienia</h2>
                  <div className="mt-4 md:mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {propertyFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="inline-flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow flex-shrink-0">
                          <Check size={16} className="md:w-[18px] md:h-[18px]" />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {hasLocationForMap && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                  <h2 className="text-xs md:text-sm uppercase tracking-[0.35em] text-slate-500">Lokalizacja</h2>
                  <div className="relative mt-4 md:mt-6 h-64 md:h-96 w-full overflow-hidden rounded-2xl border border-slate-200">
                    <PropertyLocationMap
                      className="absolute inset-0"
                      height={400}
                      address={address}
                      city={city}
                      district={district}
                      voivodeship={voivodeship}
                      postalCode={postalCode}
                      coordinates={coordinates}
                    />
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <MapPin size={16} weight="fill" className="text-red-400 flex-shrink-0" />
                    {locationLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-8 md:space-y-10">
              
              {/* Price & Actions Card - Desktop Only (Mostly duplicated content for sidebar on large screens) */}
              <div className="hidden lg:block rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cena ofertowa</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">
                    {formatPrice(displayPrice)}
                    {isRentTransaction && <span className="text-base font-normal text-slate-500"> / miesiąc</span>}
                  </p>
                  {hasDiscount && (
                    <p className="text-sm text-slate-400 line-through">
                      {formatPrice(basePrice)}
                    </p>
                  )}
                </div>
                
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{transactionLabel}</span>
                  </div>
                  {pricePerSquareMeter && (
                    <>
                      <span className="h-4 w-px bg-slate-300"></span>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {formatPrice(pricePerSquareMeter)} / m²
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-6 grid gap-3">
                  <Button
                    className="w-full rounded-2xl bg-red-600 px-3 py-3 font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-red-500"
                    disabled={!property.agent?.phone}
                    onClick={() => {
                      if (!property.agent?.phone) return;
                      window.location.href = `tel:${property.agent.phone}`;
                    }}
                  >
                    <Phone size={18} className="mr-2" />
                    Zadzwoń
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-slate-200 px-3 py-3 font-semibold uppercase tracking-[0.15em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900"
                    onClick={handleShareOffer}
                  >
                    <ShareNetwork size={18} className="mr-2" />
                    Udostępnij
                  </Button>
                </div>
                {shareFeedback && (
                  <p className="mt-3 text-xs text-center text-slate-500">{shareFeedback}</p>
                )}
              </div>

              {/* Mobile Actions (Sticky or Inline) - Using a simplified version for mobile flow inside content */}
              <div className="lg:hidden grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    className="w-full rounded-2xl bg-red-600 px-3 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-red-500"
                    disabled={!property.agent?.phone}
                    onClick={() => {
                      if (!property.agent?.phone) return;
                      window.location.href = `tel:${property.agent.phone}`;
                    }}
                  >
                    <Phone size={20} className="mr-2" />
                    Zadzwoń
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-slate-200 px-3 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900"
                    onClick={handleShareOffer}
                  >
                    <ShareNetwork size={20} className="mr-2" />
                    Udostępnij
                  </Button>
              </div>

              {/* Quick Facts - Hidden on mobile if redundant, or kept as summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <h3 className="text-xs md:text-sm uppercase tracking-[0.35em] text-slate-500">Najważniejsze</h3>
                <div className="mt-6 grid gap-3">
                  {quickFacts.map(({ label, value, Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-8 w-8 md:h-9 md:w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
                          <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                        </span>
                        <span className="truncate text-[10px] md:text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
                      </div>
                      <span className="flex-shrink-0 whitespace-nowrap text-sm md:text-base font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Card */}
              {property.agent && (
                <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 text-white shadow-xl">
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/60">Twój opiekun</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center overflow-hidden rounded-full bg-white/10 flex-shrink-0">
                      {agentAvatarUrl ? (
                        <img src={agentAvatarUrl} alt={agentFullName || 'Opiekun oferty'} className="h-full w-full object-cover" />
                      ) : (
                        <User size={24} className="text-white md:w-[28px] md:h-[28px]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base md:text-lg font-semibold text-white truncate">
                        {agentFullName || 'Zespół Prime Estate'}
                      </p>
                      <p className="text-xs md:text-sm text-white/70">Ekspert ds. nieruchomości</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button
                      className="w-full rounded-full bg-white px-6 py-3 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-slate-200"
                      onClick={() => onNavigate('contact')}
                    >
                      Umów spotkanie
                    </Button>
                  </div>
                </div>
              )}

              {/* Specs List */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                <h3 className="text-xs md:text-sm uppercase tracking-[0.35em] text-slate-500">Szczegóły</h3>
                <dl className="mt-6 space-y-3 text-sm text-slate-600">
                  {detailItems.map(({ label, value }) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-900 text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Contact CTA */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 text-center shadow-sm">
                <p className="text-base md:text-lg font-medium text-slate-900">Masz pytania?</p>
                <p className="mt-2 text-xs md:text-sm text-slate-600">Przygotujemy dla Ciebie pełną ofertę.</p>
                <Button
                  className="mt-4 rounded-full border border-slate-300 bg-white px-6 py-3 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-200"
                  onClick={() => onNavigate('contact')}
                >
                  Napisz do nas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md px-2 py-4 md:px-4 md:py-8"
          onClick={closeLightbox}
        >
          <div
            className="relative flex w-full max-w-5xl flex-col items-center gap-4 md:gap-6"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-0 right-0 z-20 md:static md:ml-auto inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none"
              onClick={closeLightbox}
            >
              <X size={24} weight="bold" />
            </button>

            <div className="relative w-full flex items-center justify-center">
              <img
                src={selectedImageUrl}
                alt={property.title}
                className="max-h-[80vh] w-full rounded-xl md:rounded-3xl bg-black object-contain shadow-2xl"
              />

              {propertyImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 md:p-3 text-white backdrop-blur-sm transition hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 md:p-3 text-white backdrop-blur-sm transition hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            <div className="text-white text-sm font-medium tracking-widest bg-black/50 px-4 py-1 rounded-full">
               {selectedImageIndex + 1} / {propertyImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PropertyDetailPage;