import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { MapPin, ArrowsOut, Bed, Buildings, CalendarBlank, Check, Phone, Envelope, User } from '@phosphor-icons/react';
import { propertiesAPI } from '../../utils/api';
import type { Property } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyImageUrls } from '../../utils/images';
import LocationMap from '../../components/LocationMap';

const ViewProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Array<{filename: string; isMain: boolean; url: string; thumbnailUrl: string}>>([]);

  useEffect(() => {
    if (id) fetchProperty(id);
  }, [id]);

  const fetchProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      const propertyData = await propertiesAPI.getById(propertyId);
      setProperty(propertyData);
      
      const urls = getPropertyImageUrls(propertyData);
      setImageUrls(urls);
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Nie udało się pobrać danych nieruchomości');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property || !id) return;

    if (!window.confirm('Czy na pewno chcesz usunąć tę nieruchomość?')) return;

    const markAsRecentlySold = window.confirm(
      'Czy chcesz oznaczyć tę nieruchomość jako sprzedaną i dodać ją do sekcji "Ostatnio sprzedane" na stronie?'
    );

    setDeleting(true);
    setError(null);

    try {
      await propertiesAPI.delete(id, { markAsRecentlySold });
      navigate('/admin/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Wystąpił błąd podczas usuwania nieruchomości');
    } finally {
      setDeleting(false);
    }
  };

  const showNextImage = () => {
    if (!imageUrls || imageUrls.length <= 1) return;
    setSelectedImageIndex(prev => (prev + 1) % imageUrls.length);
  };

  const showPreviousImage = () => {
    if (!imageUrls || imageUrls.length <= 1) return;
    setSelectedImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', { 
      day: '2-digit',
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPropertyType = (value?: string | null) => {
    if (!value) return 'Brak danych';
    const normalized = value.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-6 py-16 text-slate-600 md:px-10 lg:px-12">
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
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-slate-900 md:px-8 lg:px-12">
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-red-700">{error || 'Nie znaleziono nieruchomości'}</p>
            <button
              onClick={() => navigate('/admin/properties')}
              className="mt-8 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:bg-red-500"
            >
              Wróć do listy
            </button>
          </div>
        </div>
      </div>
    );
  }

  const propertyLocation = property.location ?? null;
  const city = propertyLocation?.city?.trim() ?? '';
  const district = propertyLocation?.district?.trim() ?? '';
  const address = propertyLocation?.address?.trim() ?? '';
  const voivodeship = propertyLocation?.voivodeship?.trim() ?? '';
  const postalCode = propertyLocation?.postalCode?.trim() ?? '';
  const locationLabel = [city, district, address].filter(Boolean).join(', ') || city || address || 'Lokalizacja w przygotowaniu';

  const propertyImages = imageUrls.length > 0 ? imageUrls : [null];
  const selectedImage = propertyImages[selectedImageIndex] ?? propertyImages[0];
  const selectedImageUrl = selectedImage?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop';

  const createdDateLabel = property?.createdAt ? formatDate(property.createdAt) : 'Brak danych';
  const promotionalPrice = typeof property?.promotionalPrice === 'number' && property.promotionalPrice > 0
    ? property.promotionalPrice
    : null;
  const basePrice = property?.price ?? 0;
  const displayPrice = promotionalPrice ?? basePrice;
  const hasDiscount = promotionalPrice !== null && promotionalPrice < basePrice;
  const isRentTransaction = property?.transactionType === 'wynajem';
  const transactionLabel = isRentTransaction ? 'Wynajem' : 'Sprzedaż';

  const normalizedStatus = property?.status?.toLowerCase();
  const statusChip = property?.status && !['aktywne', 'sprzedane'].includes(normalizedStatus ?? '') ? property.status : null;
  const statusChipClass = normalizedStatus === 'wynajęte'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  const propertyFeatures = Array.isArray(property?.features) ? property.features.filter(Boolean) : [];
  const agentFullName = property?.agent
    ? [property.agent.firstName, property.agent.lastName].filter(Boolean).join(' ').trim()
    : '';
  const hasRooms = typeof property?.rooms === 'number';
  const formattedFloor = typeof property?.floor === 'number' ? (property.floor === 0 ? 'Parter' : property.floor.toString()) : null;
  const formattedBuildingFloors = typeof property?.buildingFloors === 'number' ? property.buildingFloors.toString() : null;
  const pricePerSquareMeter = property?.area ? Math.round(displayPrice / property.area) : null;
  const propertyReference = property?._id || 'brak danych';

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

  const hasLocationForMap = Boolean(city || district || address);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16 text-slate-900 md:px-10 lg:px-12">
        {/* Admin Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            onClick={() => navigate('/admin/properties')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
          </button>
          <div className="flex items-center gap-3">
            {(isAdmin() || property.agent?._id === user?._id) && (
              <>
                <button
                  onClick={() => navigate(`/admin/properties/edit/${id}`)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4" />
                  Edytuj
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Usuwanie...' : 'Usuń'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-500">
            <CalendarBlank size={16} />
            <span>Dodano {createdDateLabel}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
          {/* Left Column */}
          <div className="space-y-10">
            {/* Main Image with Overlay */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
              <img
                src={selectedImageUrl}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/80" />

              {/* Badges */}
              <div className="pointer-events-none absolute top-6 left-6 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] ${
                    isRentTransaction ? 'text-sky-600' : 'text-emerald-600'
                  }`}
                >
                  {transactionLabel}
                </span>
                {statusChip && (
                  <span className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] ${statusChipClass}`}>
                    {statusChip}
                  </span>
                )}
              </div>

              {/* Image Counter */}
              {imageUrls.length > 1 && (
                <div className="pointer-events-none absolute right-6 top-6 rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-slate-700 shadow">
                  {selectedImageIndex + 1} / {imageUrls.length}
                </div>
              )}

              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-3 text-slate-700 shadow transition hover:border-red-200 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label="Poprzednie zdjęcie"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-3 text-slate-700 shadow transition hover:border-red-200 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label="Następne zdjęcie"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Title and Price Overlay */}
              <div className="absolute inset-x-0 bottom-0 px-8 pb-10 pt-16 text-white">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm text-white/80">
                      <MapPin size={16} weight="fill" className="text-red-200" />
                      {locationLabel}
                    </p>
                    <h1 className="!text-white text-3xl font-semibold leading-tight md:text-4xl">
                      {property.title}
                    </h1>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/70">Cena</span>
                    <p className="text-4xl font-semibold text-white">{formatPrice(displayPrice)}</p>
                    {isRentTransaction && (
                      <span className="text-xs uppercase tracking-[0.3em] text-white/70">/ miesiąc</span>
                    )}
                    {hasDiscount && (
                      <p className="mt-2 text-sm font-medium text-white/80 line-through">
                        {formatPrice(basePrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-6 text-sm uppercase tracking-[0.3em] text-white/80">
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

            {/* Thumbnails */}
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {imageUrls.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative overflow-hidden rounded-2xl border border-slate-200 transition hover:border-red-200 ${
                      selectedImageIndex === index ? 'ring-2 ring-red-300' : ''
                    }`}
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt={`Zdjęcie ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Price and Quick Facts Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Price Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
              </div>

              {/* Quick Facts */}
              <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="!text-slate-500 text-sm uppercase tracking-[0.35em]">Najważniejsze informacje</h3>
                <div className="mt-6 grid gap-3">
                  {quickFacts.map(({ label, value, Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
                          <Icon size={18} />
                        </span>
                        <span className="truncate text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
                      </div>
                      <span className="flex-shrink-0 whitespace-nowrap text-base font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <h2 className="!text-slate-500 text-sm uppercase tracking-[0.35em]">Opis nieruchomości</h2>
              <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
                {property.description || 'Opis tej nieruchomości jest aktualnie przygotowywany.'}
              </p>
            </div>

            {/* Features */}
            {propertyFeatures.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <h2 className="!text-slate-500 text-sm uppercase tracking-[0.35em]">Udogodnienia</h2>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {propertyFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow">
                        <Check size={18} />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map */}
            {hasLocationForMap && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <h2 className="!text-slate-500 text-sm uppercase tracking-[0.35em]">Lokalizacja</h2>
                <div className="relative mt-6 h-96 w-full overflow-hidden rounded-2xl border border-slate-200">
                  <LocationMap
                    className="!absolute !inset-0 !h-full !w-full !border-0 !rounded-none"
                    address={address}
                    city={city}
                    postalCode={postalCode}
                  />
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} weight="fill" className="text-red-400" />
                  {locationLabel}
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Agent Card */}
            {property.agent && (
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white shadow-xl">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Dedykowany opiekun</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/10">
                    <User size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {agentFullName || 'Zespół Prime Estate'}
                    </p>
                    <p className="text-sm text-white/70">Ekspert ds. nieruchomości</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-white/80">
                  {property.agent.phone && (
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/20"
                    >
                      <Phone size={18} className="text-white" />
                      <span>{property.agent.phone}</span>
                    </a>
                  )}
                  {property.agent.email && (
                    <a
                      href={`mailto:${property.agent.email}`}
                      className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/20"
                    >
                      <Envelope size={18} className="text-white" />
                      <span>{property.agent.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Specification Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <h3 className="!text-slate-500 text-sm uppercase tracking-[0.35em]">Specyfikacja nieruchomości</h3>
              <dl className="mt-6 space-y-3 text-sm text-slate-600">
                {detailItems.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
                {statusChip && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400">Status</dt>
                    <dd className="mt-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusChipClass}`}>
                        {statusChip}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProperty;
