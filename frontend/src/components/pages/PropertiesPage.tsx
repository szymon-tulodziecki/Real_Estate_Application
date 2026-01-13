import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, Property as ApiProperty } from '@/lib/api';
import {
  MapPin,
  Bed,
  ArrowsOut,
  Buildings,
  Rows,
  SquaresFour,
} from '@phosphor-icons/react';
import { cn, getPropertyImageUrl, normalizeCoordinates } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface PropertiesPageProps {
  onNavigate: (route: Route, options?: {
    propertyId?: string;
    filters?: Record<string, unknown>;
    replaceState?: boolean;
  }) => void;
  initialFilters?: Record<string, unknown>;
}

function PropertiesPage({
  onNavigate,
  initialFilters = {}
}: PropertiesPageProps) {
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('list');
  const [countryFilter, setCountryFilter] = useState<string>('');
  
  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Apply initial filters
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      if (initialFilters.type) {
        const types = Array.isArray(initialFilters.type) ? initialFilters.type : [initialFilters.type];
        if (types.length === 1) setPropertyType(types[0]);
      }
      if (initialFilters.transactionType) setTransactionType(String(initialFilters.transactionType));
      if (initialFilters.country) setCountryFilter(String(initialFilters.country));
      if (initialFilters.minPrice) setMinPrice(String(initialFilters.minPrice));
      if (initialFilters.maxPrice) setMaxPrice(String(initialFilters.maxPrice));
    }
  }, [initialFilters]);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        limit: 50,
        sortBy: sortBy === 'newest' ? 'createdAt' :
                sortBy === 'price-asc' ? 'price' :
                sortBy === 'price-desc' ? '-price' : 'createdAt'
      };

      if (transactionType !== 'all') params.transactionType = transactionType;
      if (propertyType !== 'all') params.type = propertyType;
      if (countryFilter) params.country = countryFilter;

      const response = await apiClient.getProperties(params);

      if (!response.success) {
        setError(response.message || 'Nie udało się załadować nieruchomości.');
        setProperties([]);
        return;
      }

      if (response.data) {
        const propertiesData = Array.isArray(response.data) ? response.data : response.data.properties || [];
        const visibleProperties = propertiesData.filter((property) => property.status?.toLowerCase() !== 'sprzedane');
        setProperties(visibleProperties);
      } else {
        setError('Nie udało się załadować nieruchomości');
      }
    } catch {
      setError('Wystąpił błąd podczas ładowania nieruchomości');
    } finally {
      setLoading(false);
    }
  }, [transactionType, propertyType, sortBy, countryFilter]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const filteredProperties = properties.filter(property => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const titleMatch = property.title.toLowerCase().includes(normalizedSearch);
    const cityMatch = (property.location.city?.toLowerCase() || '').includes(normalizedSearch);
    const addressMatch = (property.location.address?.toLowerCase() || '').includes(normalizedSearch);
    const matchesSearch = normalizedSearch === '' || titleMatch || cityMatch || addressMatch;
    
    const matchesMinPrice = minPrice === '' || property.price >= parseInt(minPrice);
    const matchesMaxPrice = maxPrice === '' || property.price <= parseInt(maxPrice);
    const matchesCountry = countryFilter === '' || ((property.location as { country?: string }).country?.toLowerCase() || '') === countryFilter.toLowerCase();
    
    return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesCountry;
  });

  // Force list view if only 1 item
  useEffect(() => {
    if (filteredProperties.length === 1 && viewLayout === 'grid') {
      setViewLayout('list');
    }
  }, [filteredProperties.length, viewLayout]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, transactionType, propertyType, minPrice, maxPrice, sortBy, itemsPerPage, countryFilter]);

  const availableCountries = Array.from(
    new Set(properties.map(p => (p.location as { country?: string }).country || 'Polska').filter(Boolean))
  ).sort();

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyImage = (property: ApiProperty): string => {
    const images = property.images ?? [];
    if (images.length > 0) {
      const sortedImages = [...images].sort((a, b) => Number(Boolean(b?.isMain)) - Number(Boolean(a?.isMain)));
      return getPropertyImageUrl(sortedImages[0]);
    }
    return getPropertyImageUrl();
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-16 lg:px-12 text-slate-900">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-slate-300 bg-[#E2E8F0] px-6 py-3 text-sm font-medium uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-400 hover:bg-[#CBD5E0] hover:text-slate-900"
          >
            ← Wróć na stronę główną
          </Button>
          <p className="text-center sm:text-right text-xs font-semibold uppercase tracking-[0.35em] text-slate-700">
            {`Znaleziono ${filteredProperties.length} ${filteredProperties.length === 1 ? 'ofertę' : filteredProperties.length % 10 >= 2 && filteredProperties.length % 10 <= 4 && (filteredProperties.length % 100 < 10 || filteredProperties.length % 100 >= 20) ? 'oferty' : 'ofert'}`}
          </p>
        </div>

        {/* Filters Card */}
        <Card className="mt-8 md:mt-10 border border-slate-300 bg-[#F8FAFC] shadow-sm">
          <CardContent className="space-y-6 p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Słowa kluczowe</label>
                <Input
                  placeholder="Miasto, ulica..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Typ transakcji</label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="!h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700">
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-300 bg-[#E2E8F0] text-slate-700">
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="sprzedaż">Sprzedaż</SelectItem>
                    <SelectItem value="wynajem">Wynajem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Typ nieruchomości</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="!h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700">
                    <SelectValue placeholder="Wszystkie typy" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-300 bg-[#E2E8F0] text-slate-700">
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="mieszkanie">Mieszkania</SelectItem>
                    <SelectItem value="dom">Domy</SelectItem>
                    <SelectItem value="działka">Działki</SelectItem>
                    <SelectItem value="komercyjne">Komercyjne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Lokalizacja</label>
                <Select value={countryFilter === '' ? 'all' : countryFilter} onValueChange={(value) => setCountryFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="!h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700">
                    <SelectValue placeholder="Wszystkie kraje" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-300 bg-[#E2E8F0] text-slate-700">
                    <SelectItem value="all">Wszystkie kraje</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Sortowanie</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="!h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700">
                    <SelectValue placeholder="Najnowsze" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-300 bg-[#E2E8F0] text-slate-700">
                    <SelectItem value="newest">Najnowsze</SelectItem>
                    <SelectItem value="price-asc">Cena: rosnąco</SelectItem>
                    <SelectItem value="price-desc">Cena: malejąco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Cena od</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                <label className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Cena do</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Bez limitu"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-10 rounded-full border-slate-300 bg-[#E2E8F0] text-sm text-slate-700 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-red-500" />
            <p>Ładujemy oferty dopasowane do Twoich oczekiwań…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="text-lg font-medium text-red-700">{error}</p>
            <Button
              onClick={loadProperties}
              className="mt-6 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:bg-red-500"
            >
              Spróbuj ponownie
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredProperties.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-slate-300 bg-[#F8FAFC] p-12 text-center text-slate-600">
                <p className="text-lg">Nie znaleźliśmy ofert spełniających wybrane kryteria.</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setMinPrice('');
                    setMaxPrice('');
                    setTransactionType('all');
                    setPropertyType('all');
                    setCountryFilter('');
                  }}
                  className="mt-6 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-700"
                >
                  Wyczyść filtry
                </Button>
              </div>
            ) : (
              <>
                {filteredProperties.length > 1 && (
                  <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">Widok</p>
                      <div className="flex gap-2">
                        <Button
                          variant={viewLayout === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewLayout('list')}
                          className={cn(
                            'rounded-full px-4',
                            viewLayout === 'list'
                              ? 'bg-red-600 text-white hover:bg-red-500'
                              : 'border-slate-300 text-slate-700 hover:bg-[#CBD5E0] hover:border-slate-400 hover:text-slate-900'
                          )}
                        >
                          <Rows size={18} weight="bold" className="mr-2" />
                          Lista
                        </Button>
                        <Button
                          variant={viewLayout === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewLayout('grid')}
                          className={cn(
                            'rounded-full px-4',
                            viewLayout === 'grid'
                              ? 'bg-red-600 text-white hover:bg-red-500'
                              : 'border-slate-300 text-slate-700 hover:bg-[#CBD5E0] hover:border-slate-400 hover:text-slate-900'
                          )}
                        >
                          <SquaresFour size={18} weight="bold" className="mr-2" />
                          Siatka
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <label className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">
                        Wyświetl:
                      </label>
                      <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                        <SelectTrigger className="h-10 w-24 rounded-full border-slate-300 bg-[#E2E8F0] text-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border border-slate-300 bg-[#E2E8F0] text-slate-700">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className={cn(
                  filteredProperties.length > 1 ? 'mt-6' : 'mt-8 md:mt-12',
                  viewLayout === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-6 md:space-y-8'
                )}>
                  {paginatedProperties.map((property) => {
                    const locationPrimary = property.location.city?.trim() || property.location.address?.trim() || property.location.district?.trim() || 'Lokalizacja w przygotowaniu';
                    
                    const roomsLabel = typeof property.rooms === 'number'
                      ? `${property.rooms} ${property.rooms === 1 ? 'pokój' : property.rooms > 4 ? 'pokoi' : 'pokoje'}`
                      : null;
                    
                    const highlightItems = [
                      { label: 'Powierzchnia', value: `${property.area} m²`, Icon: ArrowsOut },
                      roomsLabel ? { label: 'Pokoje', value: roomsLabel, Icon: Bed } : null,
                      property.buildYear ? { label: 'Rok budowy', value: property.buildYear.toString(), Icon: Buildings } : null,
                      typeof property.floor === 'number' ? { label: 'Piętro', value: property.floor === 0 ? 'Parter' : `Piętro ${property.floor}`, Icon: Buildings } : null,
                    ].filter(Boolean) as Array<{ label: string; value: string; Icon: typeof ArrowsOut }>;
                    
                    const features = Array.isArray(property.features) ? property.features.filter(Boolean) : [];
                    const featureTags = features.slice(0, 4);
                    
                    const normalizedStatus = property.status?.toLowerCase();
                    const statusLabel = property.status && normalizedStatus && !['aktywne', 'sprzedane'].includes(normalizedStatus)
                      ? property.status
                      : null;
                    
                    const priceLabel = formatPrice(property.price);
                    const promoLabel = property.promotionalPrice ? formatPrice(property.promotionalPrice) : null;
                    const isRent = property.transactionType === 'wynajem';
                    const transactionLabel = property.transactionType === 'sprzedaż_wynajem'
                      ? 'Sprzedaż / Wynajem'
                      : isRent ? 'Wynajem' : 'Sprzedaż';
                    const transactionBadgeClass = isRent 
                      ? 'bg-orange-50 text-orange-600 border-orange-200' 
                      : 'bg-green-50 text-green-600 border-green-200';
                    
                    const coordinates = normalizeCoordinates(property.location.coordinates);
                    const canOpenMap = coordinates || locationPrimary !== 'Lokalizacja w przygotowaniu';

                    const handleOpenMap = (event: ReactMouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation();
                      if (!canOpenMap) return;
                      const targetUrl = coordinates
                        ? `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationPrimary)}`;
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    };

                    const isListView = viewLayout === 'list' || filteredProperties.length === 1;

                    return (
                      <Card
                        key={property._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onNavigate('property-detail', { propertyId: property._id })}
                        className="group overflow-hidden rounded-3xl border border-slate-300 bg-[#F8FAFC] shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                      >
                        <div className={cn(
                          'flex h-full',
                          isListView ? 'flex-col lg:flex-row' : 'flex-col'
                        )}>
                          {/* ZACHOWANE ORYGINALNE MARGINESY I ZAOKRĄGLENIA:
                             m-3, rounded-2xl - to daje efekt "pływającego" obrazka
                          */}
                          <div className={cn(
                            'relative overflow-hidden rounded-2xl shrink-0 m-3', 
                            isListView 
                              ? 'h-64 w-auto lg:h-auto lg:w-2/5 lg:my-3 lg:ml-3 lg:mr-0' // List: Full on mobile, 40% on desktop + margins
                              : 'h-64 w-auto' // Grid: Fixed height + margins
                          )}>
                            <img
                              src={getPropertyImage(property)}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                              <div className={cn('text-xs px-3 py-1.5 rounded-full font-semibold border', transactionBadgeClass)}>
                                {transactionLabel}
                              </div>
                              {statusLabel && (
                                <Badge variant="secondary" className="bg-amber-200/90 text-amber-900">
                                  {statusLabel}
                                </Badge>
                              )}
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <p className="flex items-center gap-2 text-base font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                <MapPin size={20} weight="fill" className="text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                                {locationPrimary}
                              </p>
                            </div>
                          </div>

                          <div className={cn(
                            "flex flex-col gap-4 p-4 md:p-6 justify-between flex-1",
                            // Usuwamy padding z lewej tylko jeśli to lista na desktopie i mamy margines na zdjęciu, 
                            // żeby nie było dziury, ale przy zachowaniu m-3 lepiej zostawić standardowy padding.
                          )}>
                            <div className="space-y-4">
                              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 md:gap-4">
                                <h3 className={cn(
                                  "font-semibold leading-snug text-slate-900 line-clamp-2",
                                  isListView ? 'text-xl md:text-2xl' : 'text-lg'
                                )}>
                                  {property.title}
                                </h3>
                                <div className="text-left md:text-right shrink-0">
                                  <div className="flex items-center md:justify-end gap-2">
                                    <p className={cn(
                                      "font-semibold leading-snug text-slate-900",
                                      isListView ? 'text-2xl md:text-3xl' : 'text-xl'
                                    )}>
                                      {promoLabel || priceLabel}
                                      {isRent && <span className="text-sm font-normal text-slate-700"> / m-c</span>}
                                    </p>
                                    {promoLabel && (
                                      <Badge variant="secondary" className="text-[11px] bg-amber-100 text-amber-800 border-amber-200">
                                        PROMO
                                      </Badge>
                                    )}
                                  </div>
                                  {promoLabel && (
                                    <p className="text-sm text-slate-400 line-through">{priceLabel}</p>
                                  )}
                                </div>
                              </div>

                              <div className={cn(
                                'grid gap-3 md:gap-4',
                                isListView 
                                  ? 'grid-cols-2 lg:grid-cols-4'
                                  : 'grid-cols-2'
                              )}>
                                {highlightItems.map(({ label, value, Icon }) => (
                                  <div key={label} className="rounded-xl bg-slate-50 p-2 md:p-3">
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-wider text-slate-500">
                                      <Icon size={14} weight="bold" className="text-red-600" />
                                      {label}
                                    </div>
                                    <p className="mt-1 text-sm md:text-base font-semibold text-slate-900">{value}</p>
                                  </div>
                                ))}
                              </div>

                              {featureTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {featureTags.map((feature) => (
                                    <span key={feature} className="rounded-full bg-slate-200/90 px-3 py-1 text-[10px] md:text-xs font-medium text-slate-700">
                                      {feature}
                                    </span>
                                  ))}
                                  {features.length > featureTags.length && (
                                    <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[10px] md:text-xs text-slate-600">
                                      +{features.length - featureTags.length} więcej
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className={cn(
                              "flex gap-3 mt-2",
                              isListView ? 'flex-col sm:flex-row' : 'flex-col'
                            )}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full border-slate-300 bg-[#E2E8F0] text-slate-700 hover:bg-[#CBD5E0] hover:border-slate-400 hover:text-slate-900 flex-1"
                                onClick={handleOpenMap}
                                disabled={!canOpenMap}
                              >
                                <MapPin size={16} weight="bold" className="mr-2" />
                                Mapa
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-full bg-red-600 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:bg-red-500 flex-1"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onNavigate('property-detail', { propertyId: property._id });
                                }}
                              >
                                Szczegóły
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Paginacja */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border-slate-300 bg-[#E2E8F0] text-slate-700 hover:bg-[#CBD5E0] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </Button>
                    
                    <div className="hidden sm:flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        const showPage = page === 1 || page === totalPages || 
                                        (page >= currentPage - 1 && page <= currentPage + 1);
                        const showDots = (page === currentPage - 2 && currentPage > 3) || 
                                        (page === currentPage + 2 && currentPage < totalPages - 2);
                        
                        if (showDots) return <span key={page} className="px-2 text-slate-500">...</span>;
                        if (!showPage) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'rounded-full w-10 h-10',
                              currentPage === page
                                ? 'bg-red-600 text-white hover:bg-red-500'
                                : 'border-slate-300 bg-[#E2E8F0] text-slate-700 hover:bg-[#CBD5E0]'
                            )}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <div className="sm:hidden text-sm font-medium text-slate-700">
                      Strona {currentPage} z {totalPages}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full border-slate-300 bg-[#E2E8F0] text-slate-700 hover:bg-[#CBD5E0] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PropertiesPage;