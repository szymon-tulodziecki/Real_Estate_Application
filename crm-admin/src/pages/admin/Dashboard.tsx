import { useState, useEffect, useCallback } from 'react';
import { Building, TrendingUp, Monitor, UserPlus, CheckCircle, UserCog, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property } from '../../types';
import { propertiesAPI, usersAPI } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyImageUrl } from '../../utils/images';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    soldProperties: 0,
    totalUsers: 0,
    totalAgents: 0,
  });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const propertiesResponse = await propertiesAPI.getAll();
      let properties = propertiesResponse; // Now it's already an array
      
      // Dla agentów filtruj tylko ich nieruchomości
      if (!isAdmin() && user) {
        properties = properties.filter((p: Property) => p.agent?._id === user._id);
      }
      
      // Calculate stats
      const availableProperties = properties.filter((p: Property) => p.status === 'aktywne');
      const soldProperties = properties.filter((p: Property) => p.status === 'sprzedane');
      
      // Stats dla adminów - pobierz dane użytkowników
      let users = [];
      let agents = [];
      if (isAdmin()) {
        const usersResponse = await usersAPI.getAll();
        users = usersResponse; // Now it's already an array
        agents = users.filter(u => u.role === 'agent');
      }
      
      setStats({
        totalProperties: properties.length,
        availableProperties: availableProperties.length,
        soldProperties: soldProperties.length,
        totalUsers: users.length,
        totalAgents: agents.length,
      });
      
      // Get recent properties (limit to 5)
      setRecentProperties(properties.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          {isAdmin() 
            ? 'Przegląd Twojego biura nieruchomości' 
            : 'Przegląd Twoich nieruchomości'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 ${isAdmin() ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">
                {isAdmin() ? 'Wszystkie nieruchomości' : 'Moje nieruchomości'}
              </p>
              <p className="text-2xl font-semibold text-blue-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Dostępne</p>
              <p className="text-2xl font-semibold text-green-900">{stats.availableProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow-sm p-6 border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-700">Sprzedane</p>
              <p className="text-2xl font-semibold text-yellow-900">{stats.soldProperties}</p>
            </div>
          </div>
        </div>

        {/* Stats tylko dla administratorów - tylko Agenci */}
        {isAdmin() && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg shadow-sm p-6 border border-orange-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCog className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Agenci</p>
                <p className="text-2xl font-semibold text-orange-900">{stats.totalAgents}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtelna linia oddzielająca */}
      <div className="border-t border-gray-200"></div>

      {/* Szybkie akcje dla wszystkich - adminów i agentów */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Szybkie akcje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdmin() && (
            <>
              <Link
                to="/admin/sessions"
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Aktywne Sesje</p>
                    <p className="text-base font-semibold text-gray-900">Zarządzaj sesjami użytkowników</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/admin/users/create"
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserPlus className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Dodaj Użytkownika</p>
                    <p className="text-base font-semibold text-gray-900">Utwórz nowego agenta</p>
                  </div>
                </div>
              </Link>
            </>
          )}
          
          <Link
            to="/admin/properties/create"
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dodaj Nieruchomość</p>
                <p className="text-base font-semibold text-gray-900">Dodaj nową ofertę</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Sekcja nieruchomości */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAdmin() ? 'Ostatnio dodane nieruchomości' : 'Moje ostatnio dodane nieruchomości'}
          </h3>
          <Link
            to="/admin/properties"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Zobacz wszystkie
          </Link>
        </div>
        
        <div className="card">
          {recentProperties.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Brak nieruchomości</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nieruchomość
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokalizacja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cena
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProperties.map((property) => (
                    <tr key={property._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {property.images.length > 0 ? (
                               <img
                                 className="h-12 w-12 rounded-lg object-cover"
                                 src={
                                   // Sprawdzamy czy istnieje główne zdjęcie
                                   property.images.find(img => img.isMain)
                                     ? getPropertyImageUrl(property._id, property.images.find(img => img.isMain)?.filename || '', property.images.find(img => img.isMain)?.url)
                                     : getPropertyImageUrl(property._id, property.images[0].filename, property.images[0].url)
                                 }
                                 alt={property.images.find(img => img.isMain)?.alt || property.images[0].alt || property.title}
                               />
                             ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Brak</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Link 
                              to={`/admin/properties/${property._id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-900 truncate max-w-[200px] block" 
                              title={property.title}
                            >
                              {property.title}
                            </Link>
                            <div className="text-sm text-gray-500 capitalize">
                              {property.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.location.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {property.isPromoted && property.promotionalPrice ? (
                          <div>
                            <span className="text-red-500 line-through text-xs block">
                              {formatPrice(property.price)}
                            </span>
                            <span className="font-bold">{formatPrice(property.promotionalPrice)}</span>
                          </div>
                        ) : (
                          formatPrice(property.price)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'aktywne'
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'sprzedane'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status === 'aktywne' ? 'Dostępne' : 
                           property.status === 'sprzedane' ? 'Sprzedane' : 'Wynajęte'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/properties/${property._id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center justify-center"
                          title="Podgląd nieruchomości"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 