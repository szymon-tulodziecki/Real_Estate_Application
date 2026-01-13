import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient, RecentlySoldProperty as ApiRecentlySoldProperty, PropertyStats } from '../../lib/api';
import { Property, OnNavigate, RecentlySoldSummary } from '../../types/common';
import { getPropertyImageUrl, convertApiProperty, parseNumericInput } from '../../lib/utils';
import { 
  HeroSection, 
  StatisticsSection,
  FeaturedPropertiesSection, 
  AboutSection,
  ServicesSection,
  RecentlySoldSection
} from '../home';

const CATEGORY_CONFIG = [
  { id: 'mieszkania', title: 'Mieszkania', propertyTypes: ['mieszkanie'] },
  { id: 'domy', title: 'Domy', propertyTypes: ['dom'] },
  { id: 'działki', title: 'Działki', propertyTypes: ['działka'] },
  { id: 'komercyjne', title: 'Komercyjne', propertyTypes: ['komercyjne'] }
];

interface HomePageProps {
  onNavigate: OnNavigate;
}

function HomePage({ onNavigate }: HomePageProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlySold, setRecentlySold] = useState<RecentlySoldSummary[]>([]);
  const [recentlySoldLoading, setRecentlySoldLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('mieszkania');
  const [serverStats, setServerStats] = useState<PropertyStats | null>(null);

  const availableCategories = useMemo(() => {
    const filtered = CATEGORY_CONFIG.filter((category) =>
      category.propertyTypes.some((type) => properties.some((property) => property.propertyType === type))
    );
    return filtered.map((category) => {
      const count = properties.filter((property) => 
        category.propertyTypes.includes(property.propertyType)
      ).length;
      return {
        ...category,
        title: category.title || category.id,
        count,
      };
    });
  }, [properties]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveFilter((current) => (current === categoryId ? current : categoryId));
  }, []);

  const handleHeroHighlight = useCallback((categoryId: string) => {
    const categoryExists = CATEGORY_CONFIG.some((category) => category.id === categoryId);
    if (!categoryExists) {
      return;
    }
    setActiveFilter((current) => (current === categoryId ? current : categoryId));
  }, []);

  const filteredByCategory = useMemo(() => {
    const category = CATEGORY_CONFIG.find((cat) => cat.id === activeFilter);
    if (!category) {
      return properties;
    }

    return properties.filter((property) => category.propertyTypes.includes(property.propertyType));
  }, [activeFilter, properties]);

  const featuredProperties = useMemo(
    () =>
      filteredByCategory.slice(0, 3).map((property) => ({
        ...property,
        title: property.title || 'Oferta bez tytułu',
      })),
    [filteredByCategory]
  );


  const calculateStats = useCallback((propertiesData: Property[]) => {
    if (!propertiesData || propertiesData.length === 0) {
      return {
        uniqueCities: 0,
        minSalePrice: 0,
        minRentPrice: 0,
        satisfactionRate: 100,
      };
    }

    const parsePositiveNumber = (value: unknown) => {
      const parsed = parseNumericInput(value);
      return parsed !== null && parsed > 0 ? parsed : null;
    };

    const getPriceValue = (property: Property) => {
      const candidates = [property.promotionalPrice, property.price];
      for (const candidate of candidates) {
        const parsed = parsePositiveNumber(candidate);
        if (parsed !== null) {
          return parsed;
        }
      }
      return null;
    };

    const collectPrices = (items: Property[]) =>
      items
        .map(getPriceValue)
        .filter((price): price is number => price !== null);

    const normalizedTransactionType = (value?: string | null) => {
      if (!value) {
        return '';
      }

      return value
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z_]/g, '');
    };

    const matchesSale = (value?: string | null) => {
      const normalized = normalizedTransactionType(value);
      return normalized === 'sprzedaz' || normalized === 'sprzedaz_wynajem' || normalized === 'sale';
    };

    const matchesRent = (value?: string | null) => {
      const normalized = normalizedTransactionType(value);
      return normalized === 'wynajem' || normalized === 'sprzedaz_wynajem' || normalized === 'rent';
    };

    const saleProperties = propertiesData.filter(
      (prop) => prop.type === 'sale' || matchesSale(prop.transactionType)
    );
    const rentProperties = propertiesData.filter(
      (prop) => prop.type === 'rent' || matchesRent(prop.transactionType)
    );

    const cities = new Set(
      propertiesData
        .map((prop) => (prop.city || prop.location || '').split(',')[0].trim())
        .filter(Boolean)
    );

    const salePrices = collectPrices(saleProperties);
    const rentPrices = collectPrices(rentProperties);

    const pickMin = (values: number[]) => (values.length > 0 ? Math.min(...values) : 0);

    return {
      uniqueCities: cities.size,
      minSalePrice: pickMin(salePrices),
      minRentPrice: pickMin(rentPrices),
      satisfactionRate: 100,
    };
  }, []);

  const fallbackStats = useMemo(() => calculateStats(properties), [calculateStats, properties]);

  const effectiveStats = useMemo(() => {
    if (!serverStats) {
      return fallbackStats;
    }

    return {
      uniqueCities: serverStats.uniqueCities || fallbackStats.uniqueCities,
      minSalePrice: serverStats.minSalePrice || fallbackStats.minSalePrice,
      minRentPrice: serverStats.minRentPrice || fallbackStats.minRentPrice,
      satisfactionRate: serverStats.satisfactionRate || fallbackStats.satisfactionRate,
    };
  }, [serverStats, fallbackStats]);

  const getAvailableCategories = useCallback(() => availableCategories, [availableCategories]);

  useEffect(() => {
    let isMounted = true;

    const loadActiveProperties = async () => {
      try {
        setLoading(true);
        const propertiesResponse = await apiClient.getProperties({ page: 1, limit: 20 });

        if (!isMounted) {
          return;
        }

        if (propertiesResponse.success && propertiesResponse.data) {
          const propertiesArray = Array.isArray(propertiesResponse.data)
            ? propertiesResponse.data
            : propertiesResponse.data.properties || [];
          const convertedProperties = propertiesArray.map(convertApiProperty);
          const visibleProperties = convertedProperties.filter(
            (property) => property.status?.toLowerCase() !== 'sprzedane'
          );
          setProperties(visibleProperties);
          const availableForData = CATEGORY_CONFIG.filter((category) =>
            category.propertyTypes.some((type) => visibleProperties.some((property) => property.propertyType === type))
          );
          if (availableForData.length > 0) {
            setActiveFilter((current) =>
              availableForData.some((category) => category.id === current)
                ? current
                : availableForData[0].id
            );
          }
        } else {
          setProperties([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading properties:', error);
        setProperties([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadActiveProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const response = await apiClient.getPropertyStats();
        if (!isMounted) {
          return;
        }

        if (response.success && response.data) {
          setServerStats(response.data);
        } else {
          setServerStats(null);
          console.warn('Nie udało się pobrać statystyk:', response.message);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Błąd podczas pobierania statystyk:', error);
        setServerStats(null);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRecentTransactions = async () => {
      try {
        setRecentlySoldLoading(true);
        const recentlySoldResponse = await apiClient.getRecentlySoldProperties(4);

        if (!isMounted) {
          return;
        }

        if (recentlySoldResponse.success) {
          const recentlySoldArray = normalizeRecentlySoldPayload(recentlySoldResponse.data);
          const convertedRecentlySold = recentlySoldArray.map(convertRecentlySoldProperty);
          setRecentlySold(convertedRecentlySold);
        } else {
          setRecentlySold([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading recently sold properties:', error);
        setRecentlySold([]);
      } finally {
        if (isMounted) {
          setRecentlySoldLoading(false);
        }
      }
    };

    loadRecentTransactions();

    return () => {
      isMounted = false;
    };
  }, []);


  const convertRecentlySoldProperty = (apiProp: ApiRecentlySoldProperty): RecentlySoldSummary => {
    const city = apiProp.location?.city?.trim() || '';
    const district = apiProp.location?.district?.trim() || '';
    const address = apiProp.location?.address?.trim() || '';
    const locationLabel = [city, district, address].filter(Boolean).join(', ') || city || address || 'Lokalizacja w przygotowaniu';
    const agentName = apiProp.agent
      ? `${apiProp.agent.firstName ?? ''} ${apiProp.agent.lastName ?? ''}`.trim() || undefined
      : undefined;

    return {
      id: apiProp._id || apiProp.propertyId || `sold-${Math.random().toString(36).slice(2)}`,
      title: apiProp.title || 'Transakcja zakończona',
      price: apiProp.price ?? 0,
      promotionalPrice: apiProp.promotionalPrice,
      transactionType: apiProp.transactionType || 'sprzedaż',
      image: getPropertyImageUrl(apiProp.image),
      location: locationLabel,
      city,
      district,
      agentName,
      soldAt: apiProp.soldAt || new Date().toISOString(),
    };
  };

  const normalizeRecentlySoldPayload = (
    payload: ApiRecentlySoldProperty[] | { properties?: ApiRecentlySoldProperty[] } | undefined
  ): ApiRecentlySoldProperty[] => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      payload &&
      !Array.isArray(payload) &&
      'properties' in payload &&
      Array.isArray(payload.properties)
    ) {
      return payload.properties;
    }

    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <HeroSection 
        properties={properties}
        onNavigate={onNavigate}
        onHighlightCategory={handleHeroHighlight}
      />

      {/* Statistics Section */}
      <StatisticsSection 
        stats={effectiveStats}
      />

      {/* Featured Properties Section */}
      <FeaturedPropertiesSection 
        featuredProperties={featuredProperties}
        loading={loading}
        error={null}
        onNavigate={onNavigate}
        activeFilter={activeFilter}
        onCategoryClick={handleCategoryClick}
        getAvailableCategories={getAvailableCategories}
      />

      {/* Recently Sold Section */}
      <RecentlySoldSection properties={recentlySold} loading={recentlySoldLoading} />

      {/* About Section */}
      <AboutSection onNavigate={onNavigate} />

      {/* Services Section */}
      <ServicesSection />
    </div>
  );
}

export default HomePage;
