import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import type { Property } from '../../types';
import { propertiesAPI } from '../../utils/api';
import api from '../../utils/api';
import { getPropertyImageUrl } from '../../utils/images';
import { useAuth } from '../../hooks/useAuth';

const PropertiesManagement = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Używamy useEffect z pustą tablicą zależności
  useEffect(() => {
    fetchProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertiesAPI.getAll();
      
      // Filtruj nieruchomości - admin widzi wszystkie, agent tylko swoje
      const filteredProperties = isAdmin() 
        ? response  // Now it's already an array
        : response.filter((prop: Property) => prop.agent?._id === user?._id);
      
      setProperties(filteredProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (property: Property) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę nieruchomość?')) return;
    
    const markAsRecentlySold = window.confirm(
      'Czy chcesz oznaczyć tę nieruchomość jako sprzedaną i dodać ją do sekcji "Ostatnio sprzedane" na stronie?'
    );

    setDeletingId(property._id);
    setError(null);
    
    try {
      // Próba blokady nieruchomości przed usunięciem
      try {
        await api.post(`/properties/${property._id}/lock`);
      } catch (lockError: unknown) {
        const apiLockError = lockError as { response?: { status?: number } };
        if (apiLockError?.response?.status === 423) {
          setError('Nieruchomość jest aktualnie edytowana przez innego użytkownika.');
          return;
        }
        if (apiLockError?.response?.status === 401) {
          setError('Sesja wygasła. Zaloguj się ponownie.');
          return;
        }
        // Kontynuuj z usuwaniem, nawet jeśli lock się nie powiódł
      }
      
      // Usuń nieruchomość
  await propertiesAPI.delete(property._id, { markAsRecentlySold });
      await fetchProperties(); // Odśwież listę
      setError(null);
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: { message?: string } } };
      
      if (apiError?.response?.status === 401) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
      } else if (apiError?.response?.status === 403) {
        setError('Brak uprawnień do usunięcia tej nieruchomości.');
      } else if (apiError?.response?.data?.message) {
        setError(`Błąd: ${apiError.response.data.message}`);
      } else {
        setError('Wystąpił błąd podczas usuwania.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Zamknij</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin() ? 'Zarządzanie nieruchomościami' : 'Moje nieruchomości'}
          </h1>
          <p className="text-gray-600">
            {isAdmin() 
              ? 'Zarządzaj wszystkimi nieruchomościami w systemie'
              : 'Zarządzaj swoimi ofertami nieruchomości'
            }
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/properties/create')}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAdmin() ? 'Dodaj nieruchomość' : 'Dodaj ofertę'}
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="search-wrapper w-full md:max-w-xs">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Szukaj nieruchomości..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-search search-input w-full"
          />
        </div>
      </div>

      {/* Properties Table */}
      <div className="card">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">Nie znaleziono nieruchomości</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data dodania
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
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
                                   ? getPropertyImageUrl(property._id, property.images.find(img => img.isMain)?.filename || '')
                                   : getPropertyImageUrl(property._id, property.images[0].filename)
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
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={property.title}>
                            {property.title}
                          </div>
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
                          <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">PROMO</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(property.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Podgląd */}
                        <button
                          onClick={() => navigate(`/admin/properties/view/${property._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 flex items-center justify-center"
                          title="Podgląd nieruchomości"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edycja */}
                        {(isAdmin() || property.agent?._id === user?._id) ? (
                          <button
                            onClick={() => navigate(`/admin/properties/edit/${property._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 flex items-center justify-center"
                            title="Edytuj nieruchomość"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 p-1 flex items-center justify-center cursor-not-allowed"
                            title="Brak uprawnień do edycji"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {/* Usuwanie */}
                        {(isAdmin() || property.agent?._id === user?._id) ? (
                          <button
                            onClick={() => handleDelete(property)}
                            className="text-red-600 hover:text-red-900 p-1 flex items-center justify-center"
                            title="Usuń nieruchomość"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === property._id && <span className="ml-1 animate-pulse text-xs">...</span>}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 p-1 flex items-center justify-center cursor-not-allowed"
                            title="Brak uprawnień do usuwania"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesManagement;