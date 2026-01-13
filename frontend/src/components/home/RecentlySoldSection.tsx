import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import type { RecentlySoldSummary } from '../../types/common';

interface RecentlySoldSectionProps {
  properties: RecentlySoldSummary[];
  loading?: boolean;
}

export const RecentlySoldSection = ({ properties, loading = false }: RecentlySoldSectionProps) => {
  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            <p className="mt-4 text-gray-600">Ładowanie ostatnio sprzedanych...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ostatnio sprzedane</h2>
          <p className="text-lg text-gray-600">
            Zobacz nasze udane transakcje
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property) => {
            const saleDateLabel = property.soldAt
              ? new Date(property.soldAt).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : null;

            return (
              <div key={property.id} className="relative group">
                <Card className="grayscale opacity-80 transition-all duration-300 group-hover:opacity-100">
                <div className="relative overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">{property.title}</h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.location}
                  </p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {saleDateLabel && <p>Zamknięta {saleDateLabel}</p>}
                    {property.agentName && <p>Agent: {property.agentName}</p>}
                  </div>
                  <div className="text-base font-semibold text-slate-700">
                    {(property.promotionalPrice ?? property.price).toLocaleString('pl-PL')} PLN
                  </div>
                </CardContent>
              </Card>
                <Badge
                  variant="secondary"
                  className="absolute top-4 right-4 bg-red-600 text-white shadow-md"
                >
                  Zakończona transakcja
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
