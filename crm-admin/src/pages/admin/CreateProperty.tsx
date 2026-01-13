import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import { propertiesAPI, usersAPI } from '../../utils/api';
import type { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import LocationMap from '../../components/LocationMap';

const propertyTypes = [
  { value: 'mieszkanie', label: 'Mieszkanie' },
  { value: 'dom', label: 'Dom' },
  { value: 'lokal', label: 'Lokal' },
  { value: 'działka', label: 'Działka' }
] as const;

const transactionTypes = [
  { value: 'sprzedaż', label: 'Sprzedaż' },
  { value: 'wynajem', label: 'Wynajem' }
] as const;

const statuses = [
  { value: 'aktywne', label: 'Aktywne' },
  { value: 'sprzedane', label: 'Sprzedane' },
  { value: 'wynajęte', label: 'Wynajęte' }
] as const;

const CreateProperty = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [isPromoted, setIsPromoted] = useState(false);
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [buildingFloors, setBuildingFloors] = useState('');
  const [buildYear, setBuildYear] = useState('');
  const [type, setType] = useState<(typeof propertyTypes)[number]['value']>(propertyTypes[0].value);
  const [transactionType, setTransactionType] = useState<(typeof transactionTypes)[number]['value']>(transactionTypes[0].value);
  const [status, setStatus] = useState<(typeof statuses)[number]['value']>(statuses[0].value);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [district, setDistrict] = useState('');
  const [voivodeship, setVoivodeship] = useState('');
  const [coordinates] = useState<{ x: number; y: number } | null>(null);
  const [features, setFeatures] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState<User[]>([]);
  const [images, setImages] = useState<FileList | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAgents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ustawiamy agentId na ID obecnie zalogowanego użytkownika, jeśli jest agentem
  useEffect(() => {
    if (!isAdmin() && user?._id) {
      setAgentId(user._id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Gdy typ nie posiada pokoi, czyść pole rooms i nie pokazuj
  useEffect(() => {
    if (type === 'działka' || type === 'lokal') {
      setRooms('');
    }
    if (type === 'działka') {
      setFloor('');
      setBuildingFloors('');
      setBuildYear('');
    }
    if (type !== 'mieszkanie') {
      setFloor('');
    }
  }, [type]);

  const fetchAgents = async () => {
    try {
      const response = await usersAPI.getAgents();

      let availableAgents = response;

      // Upewnij się, że admin może wybrać siebie jako agenta (ale nie root)
      if (isAdmin() && user && user.role !== 'root') {
        const alreadyPresent = response.some(agent => agent._id === user._id);
        if (!alreadyPresent) {
          availableAgents = [
            {
              ...user,
              employeeId: user.employeeId,
            },
            ...response,
          ];
        }
      }

      setAgents(availableAgents);

      // Jeśli użytkownik jest adminem (ale nie rootem), domyślnie ustaw jego ID lub pierwszego agenta z listy
      if (isAdmin() && user?.role !== 'root') {
        if (!agentId) {
          const preferredAgentId = user?._id || availableAgents[0]?._id || '';
          setAgentId(preferredAgentId || '');
        }
      } else if (isAdmin() && user?.role === 'root') {
        // Dla roota ustaw pierwszego agenta z listy
        if (!agentId && availableAgents.length > 0) {
          setAgentId(availableAgents[0]._id || '');
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError('Nie udało się pobrać listy agentów');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages(e.target.files);
      
      // Generate preview URLs
      const newPreviewUrls: string[] = [];
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewUrls.push(reader.result as string);
          if (newPreviewUrls.length === e.target.files!.length) {
            setImagePreviewUrls(newPreviewUrls);
            // Reset main image index na pierwsze zdjęcie, gdy dodajemy nowe zdjęcia
            setMainImageIndex(0);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    if (!images) return;
    
    const dt = new DataTransfer();
    const files = Array.from(images);
    
    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });
    
    setImages(dt.files);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Jeśli usuwamy główne zdjęcie, ustaw pierwsze jako główne
    if (index === mainImageIndex) {
      setMainImageIndex(0);
    }
    // Jeśli usuwamy zdjęcie przed głównym, musimy zaktualizować indeks
    else if (index < mainImageIndex) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        setLoading(false);
        return;
      }

      // Użyj FormData żeby wysłać dane razem ze zdjęciami
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('type', type);
      formData.append('transactionType', transactionType);
      formData.append('status', status);
      formData.append('area', area);

      if (floor) {
        formData.append('floor', floor);
      }

      if (buildingFloors) {
        formData.append('buildingFloors', buildingFloors);
      }

      if (buildYear) {
        formData.append('buildYear', buildYear);
      }
      
      // Dodaj rooms tylko dla mieszkań i domów
      if ((type === 'mieszkanie' || type === 'dom') && rooms) {
        formData.append('rooms', rooms);
      }
      
      // Dodaj promocję
      formData.append('isPromoted', String(isPromoted));
      if (isPromoted && promotionalPrice) {
        formData.append('promotionalPrice', promotionalPrice);
      }
      
      // Lokalizacja
      formData.append('location[address]', address.trim());
      formData.append('location[city]', city.trim());
      formData.append('location[postalCode]', postalCode.trim());

      if (district.trim()) {
        formData.append('location[district]', district.trim());
      }

      if (voivodeship.trim()) {
        formData.append('location[voivodeship]', voivodeship.trim());
      }
      
      // Współrzędne
      if (coordinates) {
        formData.append('location[coordinates][x]', coordinates.x.toString());
        formData.append('location[coordinates][y]', coordinates.y.toString());
      }
      
      // Features
      if (features) {
        const featuresArray = features.split(',').map(f => f.trim()).filter(Boolean);
        featuresArray.forEach((feature, index) => {
          formData.append(`features[${index}]`, feature);
        });
      }
      
      // Agent
      if (agentId) {
        formData.append('agent', agentId);
      }
      
      // Dodaj zdjęcia
      if (images && images.length > 0) {
        Array.from(images).forEach((file) => {
          formData.append('images', file);
        });
        
        // Dodaj informację o głównym zdjęciu
        if (mainImageIndex !== null) {
          formData.append('mainImageIndex', mainImageIndex.toString());
        }
      }
      
      // Wyślij wszystko razem
      await propertiesAPI.createWithFormData(formData);

      setSuccess(true);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setPromotionalPrice('');
      setIsPromoted(false);
      setArea('');
      setRooms('');
  setFloor('');
  setBuildingFloors('');
  setBuildYear('');
      setType(propertyTypes[0].value);
      setTransactionType(transactionTypes[0].value);
      setStatus(statuses[0].value);
      setAddress('');
      setCity('');
      setPostalCode('');
  setDistrict('');
  setVoivodeship('');
      setFeatures('');
      setImages(null);
      setImagePreviewUrls([]);
      setMainImageIndex(0);
      
      setTimeout(() => {
        setSuccess(false);
        navigate('/admin/properties');
      }, 1200);
    } catch (error: unknown) {
      console.error('Error creating property:', error);
      const apiError = error as { 
        response?: { 
          status?: number; 
          data?: { 
            message?: string, 
            error?: string, 
            errors?: Record<string, string> 
          } 
        } 
      };
      if (apiError?.response?.status === 401) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
        setTimeout(() => { navigate('/admin/login'); }, 1200);
      } else if (apiError?.response?.status === 403) {
        setError('Brak uprawnień do dodawania nieruchomości.');
      } else if (apiError?.response?.status === 400 && apiError?.response?.data?.errors) {
        setValidationErrors(apiError.response.data.errors);
        setError('Formularz zawiera błędy. Sprawdź pola oznaczone na czerwono.');
      } else if (apiError?.response?.data?.message) {
        setError(apiError.response.data.message);
      } else {
        setError('Wystąpił błąd podczas dodawania nieruchomości');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dodaj nową nieruchomość</h1>
          <p className="text-gray-600">Wypełnij formularz, aby dodać nową nieruchomość</p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="btn-back flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Sukces!</strong>
          <span className="block sm:inline"> Nieruchomość została dodana.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Informacje podstawowe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="label-field">
                Tytuł*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Np. Piękne mieszkanie w centrum"
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="label-field">
                Cena (PLN)*
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="Np. 500000"
                min="0"
                required
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isPromoted"
                  checked={isPromoted}
                  onChange={(e) => setIsPromoted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <label htmlFor="isPromoted" className="ml-2 text-sm font-medium text-gray-700">
                  Promocja
                </label>
              </div>
              {isPromoted && (
                <div>
                  <label htmlFor="promotionalPrice" className="label-field">
                    Cena promocyjna (PLN)*
                  </label>
                  <input
                    type="number"
                    id="promotionalPrice"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    className={`input-field ${validationErrors.promotionalPrice ? 'border-red-500' : ''}`}
                    placeholder="Np. 450000"
                    min="0"
                    required={isPromoted}
                  />
                  {validationErrors.promotionalPrice && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.promotionalPrice}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="area" className="label-field">
                Powierzchnia (m²)*
              </label>
              <input
                type="number"
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="input-field"
                placeholder="Np. 75"
                min="0"
                required
              />
            </div>
            {type !== 'działka' && type !== 'lokal' && (
              <div>
                <label htmlFor="rooms" className="label-field">
                  Liczba pokoi
                </label>
                <input
                  type="number"
                  id="rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="input-field"
                  placeholder="Np. 3"
                  min="0"
                />
              </div>
            )}
            {type === 'mieszkanie' && (
              <div>
                <label htmlFor="floor" className="label-field">
                  Piętro
                </label>
                <input
                  type="number"
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className={`input-field ${validationErrors.floor ? 'border-red-500' : ''}`}
                  placeholder="Np. 3"
                  min="-1"
                />
                {validationErrors.floor && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.floor}
                  </p>
                )}
              </div>
            )}
            {type !== 'działka' && (
              <div>
                <label htmlFor="buildingFloors" className="label-field">
                  Liczba kondygnacji budynku
                </label>
                <input
                  type="number"
                  id="buildingFloors"
                  value={buildingFloors}
                  onChange={(e) => setBuildingFloors(e.target.value)}
                  className={`input-field ${validationErrors.buildingFloors ? 'border-red-500' : ''}`}
                  placeholder="Np. 10"
                  min="1"
                />
                {validationErrors.buildingFloors && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.buildingFloors}
                  </p>
                )}
              </div>
            )}
            {type !== 'działka' && (
              <div>
                <label htmlFor="buildYear" className="label-field">
                  Rok budowy
                </label>
                <input
                  type="number"
                  id="buildYear"
                  value={buildYear}
                  onChange={(e) => setBuildYear(e.target.value)}
                  className={`input-field ${validationErrors.buildYear ? 'border-red-500' : ''}`}
                  placeholder="Np. 2015"
                  min="1800"
                  max={new Date().getFullYear()}
                />
                {validationErrors.buildYear && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.buildYear}
                  </p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="type" className="label-field">
                Typ nieruchomości*
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof propertyTypes)[number]['value'])}
                className="input-field"
                required
              >
                {propertyTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="transactionType" className="label-field">
                Typ transakcji*
              </label>
              <select
                id="transactionType"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as (typeof transactionTypes)[number]['value'])}
                className="input-field"
                required
              >
                {transactionTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="label-field">
                Status*
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof statuses)[number]['value'])}
                className="input-field"
                required
              >
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Pole agenta tylko dla adminów */}
            {isAdmin() && (
              <div>
                <label htmlFor="agent" className="label-field">
                  Przypisany agent*
                </label>
                <select
                  id="agent"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Wybierz agenta</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.firstName} {agent.lastName} (ID: {agent.employeeId || '—'})
                      {agent.role === 'root' ? ' • Root' : agent.role === 'admin' ? ' • Admin' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Lokalizacja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="address" className="label-field">
                Pełny adres*
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                placeholder="Pełny adres z ulicą i numerem (jeśli dostępny)"
                required
              />
            </div>
            <div>
              <label htmlFor="city" className="label-field">
                Miejscowość*
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
                placeholder="Nazwa miasta, wsi lub miejscowości"
                required
              />
            </div>
            <div>
              <label htmlFor="district" className="label-field">
                Dzielnica / osiedle
              </label>
              <input
                type="text"
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={`input-field ${validationErrors['location.district'] ? 'border-red-500' : ''}`}
                placeholder="Np. Śródmieście"
              />
              {validationErrors['location.district'] && (
                <p className="mt-1 text-sm text-red-500">
                  {validationErrors['location.district']}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="postalCode" className="label-field">
                Kod pocztowy*
              </label>
              <input
                type="text"
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="input-field"
                placeholder="00-001"
                pattern="[0-9]{2}-[0-9]{3}"
                required
              />
            </div>
            <div>
              <label htmlFor="voivodeship" className="label-field">
                Województwo
              </label>
              <input
                type="text"
                id="voivodeship"
                value={voivodeship}
                onChange={(e) => setVoivodeship(e.target.value)}
                className={`input-field ${validationErrors['location.voivodeship'] ? 'border-red-500' : ''}`}
                placeholder="Np. Mazowieckie"
              />
              {validationErrors['location.voivodeship'] && (
                <p className="mt-1 text-sm text-red-500">
                  {validationErrors['location.voivodeship']}
                </p>
              )}
            </div>
          </div>
          
          {/* Podgląd mapy */}
          {(address || city) && (
            <div className="mt-6">
              <LocationMap
                address={address}
                city={city}
                postalCode={postalCode}
                className="w-full h-80 rounded-lg border border-gray-300 resize-y overflow-hidden min-h-48 max-h-96"
              />
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Opis</h2>
          <div>
            <label htmlFor="description" className="label-field">
              Opis nieruchomości*
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field h-32"
              placeholder="Opisz nieruchomość..."
              required
            />
          </div>
          <div className="mt-6">
            <label htmlFor="features" className="label-field">
              Cechy nieruchomości (oddzielone przecinkami)
            </label>
            <input
              type="text"
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="input-field"
              placeholder="Np. balkon, parking, winda"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Zdjęcia</h2>
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-600">Kliknij aby dodać zdjęcia</span>
                <p className="text-sm text-gray-500 mt-1">Maksymalnie 10 plików, każdy do 5MB</p>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </label>
            
            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className={`h-32 w-full object-cover rounded-lg ${
                        mainImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainImageIndex(index)}
                      className={`absolute bottom-0 left-0 right-0 py-1 text-xs text-center transition-colors ${
                        mainImageIndex === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {mainImageIndex === index ? 'Główne zdjęcie' : 'Ustaw jako główne'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary mr-4"
            disabled={loading}
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Zapisz nieruchomość
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProperty;
