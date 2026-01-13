import { useState, useEffect, useCallback } from 'react';
import LockNotification from '../../components/LockNotification';
import { propertyLockAPI } from '../../utils/propertyLockAPI';
import { Save, ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import { propertiesAPI, usersAPI } from '../../utils/api';
import type { User, Property } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPropertyImageUrl } from '../../utils/images';
import LocationMap from '../../components/LocationMap';

const propertyTypes = [
  { value: 'mieszkanie', label: 'Mieszkanie' },
  { value: 'dom', label: 'Dom' },
  { value: 'lokal', label: 'Lokal' },
  { value: 'działka', label: 'Działka' }
];

const transactionTypes = [
  { value: 'sprzedaż', label: 'Sprzedaż' },
  { value: 'wynajem', label: 'Wynajem' }
];

const statuses = [
  { value: 'aktywne', label: 'Aktywne' },
  { value: 'sprzedane', label: 'Sprzedane' },
  { value: 'wynajęte', label: 'Wynajęte' }
];

const EditProperty = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
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
  const [type, setType] = useState(propertyTypes[0].value);
  const [transactionType, setTransactionType] = useState(transactionTypes[0].value);
  const [status, setStatus] = useState(statuses[0].value);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [district, setDistrict] = useState('');
  const [voivodeship, setVoivodeship] = useState('');
  const [coordinates] = useState<{ x: number; y: number } | null>(null);
  const [features, setFeatures] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState<User[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ filename: string; isMain: boolean }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<FileList | null>(null);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  const [newMainImageIndex, setNewMainImageIndex] = useState<number>(0);
  
  // Custom fields
  const [customFields, setCustomFields] = useState<Array<{ name: string; value: string; type: 'text' | 'number' | 'boolean' | 'date' }>>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'boolean' | 'date'>('text');
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; lockedBy?: string; lockedById?: string } | null>(null);
  const [showLock, setShowLock] = useState(true);
  // Check lock status (tylko jedna deklaracja, powyżej useEffect)
  const checkLock = useCallback(async (propertyId: string) => {
    try {
      const lock = await propertyLockAPI.acquireLock(propertyId);
      setLockInfo(lock);
      if (lock.locked && lock.lockedById && lock.lockedById !== user?._id) {
        setShowLock(true);
      } else {
        setShowLock(false);
      }
    } catch {
      setLockInfo({ locked: false });
    }
  }, [user]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await usersAPI.getAgents();
      let availableAgents = response;

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

      if (isAdmin() && user?.role !== 'root' && !agentId) {
        const preferredAgentId = user?._id || availableAgents[0]?._id;
        if (preferredAgentId) {
          setAgentId(preferredAgentId);
        }
      } else if (isAdmin() && user?.role === 'root' && !agentId && availableAgents.length > 0) {
        setAgentId(availableAgents[0]._id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError('Nie udało się pobrać listy agentów');
    }
  }, [user, agentId, isAdmin]);

  useEffect(() => {
    fetchAgents();
    if (id) {
      fetchProperty(id);
      checkLock(id);
    } else {
      setFetchLoading(false);
      setError('Brak ID nieruchomości');
    }
    // Release lock on unmount
    return () => {
      if (id) propertyLockAPI.releaseLock(id).catch(() => {});
    };
  }, [id, checkLock, fetchAgents]);

  const fetchProperty = async (propertyId: string) => {
    try {
      setFetchLoading(true);
      const property = await propertiesAPI.getById(propertyId);
      setProperty(property);
      
      // Populate form fields
      setTitle(property.title || '');
      setDescription(property.description || '');
      setPrice(property.price.toString() || '');
      setIsPromoted(property.isPromoted || false);
      setPromotionalPrice(property.promotionalPrice?.toString() || '');
      setArea(property.area.toString() || '');
      setRooms(property.rooms ? property.rooms.toString() : '');
      setFloor(
        property.floor !== undefined && property.floor !== null
          ? property.floor.toString()
          : ''
      );
      setBuildingFloors(
        property.buildingFloors !== undefined && property.buildingFloors !== null
          ? property.buildingFloors.toString()
          : ''
      );
      setBuildYear(
        property.buildYear !== undefined && property.buildYear !== null
          ? property.buildYear.toString()
          : ''
      );
      setType(property.type || propertyTypes[0].value);
      setTransactionType(property.transactionType || transactionTypes[0].value);
      setStatus(property.status || statuses[0].value);
      
      if (property.location) {
        setAddress(property.location.address || '');
        setCity(property.location.city || '');
        setPostalCode(property.location.postalCode || '');
        setDistrict(property.location.district || '');
        setVoivodeship(property.location.voivodeship || '');
      }
      
      setFeatures(property.features ? property.features.join(', ') : '');
      
      if (property.agent) {
        const agentId = property.agent._id;
        if (agentId) setAgentId(agentId);
      }
      
      if (property.images && property.images.length > 0) {
        setExistingImages(property.images.map(img => ({
          filename: img.filename,
          isMain: img.isMain
        })));
      }
      
      // Load custom fields if they exist
      if (property.customFields && property.customFields.length > 0) {
        setCustomFields(property.customFields.map(field => ({
          ...field,
          type: field.type || 'text' // Domyślnie 'text', jeśli nie ma typu
        })));
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Nie udało się pobrać danych nieruchomości');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Wyczyść poprzednie URL-e podglądu
      cleanupPreviewUrls();
      setNewImagePreviewUrls([]);
      
      setNewImages(e.target.files);
      
      // Generate preview URLs
      const newPreviewUrls: string[] = [];
      const filesArray = Array.from(e.target.files);
      
      filesArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewUrls[index] = reader.result as string;
          if (newPreviewUrls.filter(url => url).length === filesArray.length) {
            setNewImagePreviewUrls([...newPreviewUrls]);
            // Reset głównego zdjęcia
            setNewMainImageIndex(0);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      // Wyczyść jeśli nie ma plików
      cleanupPreviewUrls();
      setNewImages(null);
      setNewImagePreviewUrls([]);
    }
  };

  const removeNewImage = (index: number) => {
    if (!newImages) return;
    
    // Wyczyść URL podglądu usuwanego obrazu
    const urlToRevoke = newImagePreviewUrls[index];
    if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
    
    const dt = new DataTransfer();
    const files = Array.from(newImages);
    
    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });
    
    setNewImages(dt.files.length > 0 ? dt.files : null);
    setNewImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Aktualizacja indeksu głównego zdjęcia
    if (index === newMainImageIndex) {
      setNewMainImageIndex(0);
    }
    else if (index < newMainImageIndex) {
      setNewMainImageIndex(newMainImageIndex - 1);
    }
  };

  const toggleDeleteExistingImage = (filename: string) => {
    if (imagesToDelete.includes(filename)) {
      setImagesToDelete(prev => prev.filter(name => name !== filename));
    } else {
      setImagesToDelete(prev => [...prev, filename]);
    }
  };

  const setMainImage = (filename: string) => {
    setExistingImages(prev => 
      prev.map(img => ({
        ...img,
        isMain: img.filename === filename
      }))
    );
  };
  
  // Custom fields handlers
  const addCustomField = () => {
    if (newFieldName.trim() === '') {
      return;
    }
    
    // Check if field with this name already exists
    if (customFields.some(field => field.name === newFieldName.trim())) {
      setError('Pole o tej nazwie już istnieje');
      return;
    }
    
    // Limit the number of custom fields to 10
    if (customFields.length >= 10) {
      setError('Osiągnięto limit dodatkowych pól (10)');
      return;
    }
    
    setCustomFields([...customFields, {
      name: newFieldName.trim(),
      value: '',
      type: newFieldType
    }]);
    
    setNewFieldName('');
    setError(null); // POPRAWKA: wyczyść błąd po udanej akcji
  };
  
  const updateCustomFieldValue = (index: number, value: string) => {
    const updatedFields = [...customFields];
    updatedFields[index].value = value;
    setCustomFields(updatedFields);
  };
  
  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const cleanupPreviewUrls = () => {
    newImagePreviewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setError('Brak ID nieruchomości');
      return;
    }
    
    setLoading(true);
    setError(null); 

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
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
      
      // Dodanie pól związanych z promocją
      formData.append('isPromoted', String(isPromoted));
      if (isPromoted && promotionalPrice) {
        formData.append('promotionalPrice', promotionalPrice);
      }
      
      if (rooms) {
        formData.append('rooms', rooms);
      }
      
      formData.append('type', type);
      formData.append('transactionType', transactionType);
      formData.append('status', status);
      
      formData.append('location[address]', address);
      formData.append('location[city]', city);
      formData.append('location[postalCode]', postalCode);

      if (district.trim()) {
        formData.append('location[district]', district.trim());
      }

      if (voivodeship.trim()) {
        formData.append('location[voivodeship]', voivodeship.trim());
      }
      
      // Dodaj współrzędne mapy jeśli są dostępne
      if (coordinates) {
        formData.append('location[coordinates][x]', coordinates.x.toString());
        formData.append('location[coordinates][y]', coordinates.y.toString());
      }
      
      if (features) {
        const featuresArray = features.split(',').map(feature => feature.trim());
        featuresArray.forEach((feature, index) => {
          formData.append(`features[${index}]`, feature);
        });
      }
      
      if (agentId) {
        formData.append('agent', agentId);
      }
      
      // Add images to delete
      imagesToDelete.forEach((filename, index) => {
        formData.append(`imagesToDelete[${index}]`, filename);
      });
      
      // Add new main image if changed
      const mainImage = existingImages.find(img => img.isMain);
      if (mainImage) {
        formData.append('mainImage', mainImage.filename);
      }
      
      // Add new images
      if (newImages) {
        Array.from(newImages).forEach((file, index) => {
          formData.append('images', file);
          // Dodajemy informację o głównym nowym zdjęciu
          if (index === newMainImageIndex) {
            formData.append('newMainImageIndex', index.toString());
          }
        });
      }
      
      // Add custom fields
      if (customFields.length > 0) {
        formData.append('customFields', JSON.stringify(customFields));
      }
      
      await propertiesAPI.updateWithFormData(id, formData);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        navigate('/admin/properties'); // POPRAWKA: użycie navigate zamiast window.location.href
      }, 2000);
    } catch (error) {
      console.error('Error updating property:', error);
      setError('Wystąpił błąd podczas aktualizacji nieruchomości');
    } finally {
      setLoading(false);
    }
  };

  // POPRAWKA: lepsze sprawdzenie warunków loading/error
  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!id || (!property && !fetchLoading)) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> 
          {!id ? 'Brak ID nieruchomości' : 'Nie udało się pobrać danych nieruchomości'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lockInfo?.locked && lockInfo.lockedById && lockInfo.lockedById !== user?._id && showLock && lockInfo.lockedBy && (
        <LockNotification lockedBy={lockInfo.lockedBy} onClose={() => setShowLock(false)} />
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edytuj nieruchomość</h1>
          <p className="text-gray-600">Zaktualizuj informacje o nieruchomości</p>
        </div>
        <button 
          onClick={() => navigate(-1)} // POPRAWKA: użycie navigate zamiast window.history.back()
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
          <span className="block sm:inline"> Nieruchomość została zaktualizowana.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
          {/* POPRAWKA: dodano przycisk zamykania błędu */}
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Pozostała część formularza pozostaje bez zmian */}
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
                    className="input-field"
                    placeholder="Np. 450000"
                    min="0"
                    required={isPromoted}
                  />
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
            <div>
              <label htmlFor="floor" className="label-field">
                Piętro
              </label>
              <input
                type="number"
                id="floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="input-field"
                placeholder="Np. 3"
                min="-1"
              />
            </div>
            <div>
              <label htmlFor="buildingFloors" className="label-field">
                Liczba kondygnacji budynku
              </label>
              <input
                type="number"
                id="buildingFloors"
                value={buildingFloors}
                onChange={(e) => setBuildingFloors(e.target.value)}
                className="input-field"
                placeholder="Np. 10"
                min="1"
              />
            </div>
            <div>
              <label htmlFor="buildYear" className="label-field">
                Rok budowy
              </label>
              <input
                type="number"
                id="buildYear"
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
                className="input-field"
                placeholder="Np. 2015"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label htmlFor="type" className="label-field">
                Typ nieruchomości*
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                onChange={(e) => setTransactionType(e.target.value)}
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
                onChange={(e) => setStatus(e.target.value)}
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
                className="input-field"
                placeholder="Np. Śródmieście"
              />
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
                className="input-field"
                placeholder="Np. Mazowieckie"
              />
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
          <h2 className="text-lg font-semibold mb-4">Opis i cechy</h2>
          <div>
            <label htmlFor="description" className="label-field">
              Opis nieruchomości*
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[150px]"
              placeholder="Wprowadź szczegółowy opis nieruchomości"
              required
            ></textarea>
          </div>
          <div className="mt-4">
            <label htmlFor="features" className="label-field">
              Cechy i udogodnienia (oddzielone przecinkami)
            </label>
            <input
              type="text"
              id="features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="input-field"
              placeholder="Np. balkon, winda, garaż, ogród"
            />
          </div>
        </div>
        
        {/* Custom Fields */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pola dodatkowe</h2>
          <p className="text-sm text-gray-600 mb-4">
            Możesz dodać do 10 niestandardowych pól dla tej nieruchomości.
          </p>
          
          {/* Add new field form */}
          <div className="flex items-end space-x-2 mb-6">
            <div className="flex-1">
              <label htmlFor="newFieldName" className="label-field">
                Nazwa pola
              </label>
              <input
                type="text"
                id="newFieldName"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="input-field"
                placeholder="Np. Rok budowy, Piętro, itp."
              />
            </div>
            <div className="w-1/4">
              <label htmlFor="newFieldType" className="label-field">
                Typ pola
              </label>
              <select
                id="newFieldType"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as 'text' | 'number' | 'boolean' | 'date')}
                className="input-field"
              >
                <option value="text">Tekst</option>
                <option value="number">Liczba</option>
                <option value="boolean">Tak/Nie</option>
                <option value="date">Data</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="btn-secondary py-2"
              disabled={newFieldName.trim() === '' || customFields.length >= 10}
            >
              Dodaj pole
            </button>
          </div>
          
          {/* Custom fields list */}
          {customFields.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-md font-medium">Lista dodatkowych pól</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.name}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomFieldValue(index, e.target.value)}
                          className="input-field"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={field.value}
                          onChange={(e) => updateCustomFieldValue(index, e.target.value)}
                          className="input-field"
                        />
                      )}
                      {field.type === 'boolean' && (
                        <select
                          value={field.value}
                          onChange={(e) => updateCustomFieldValue(index, e.target.value)}
                          className="input-field"
                        >
                          <option value="">Wybierz</option>
                          <option value="true">Tak</option>
                          <option value="false">Nie</option>
                        </select>
                      )}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={field.value}
                          onChange={(e) => updateCustomFieldValue(index, e.target.value)}
                          className="input-field"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Brak dodatkowych pól</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Zdjęcia</h2>
          
          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Obecne zdjęcia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {existingImages.map((img, index) => (
                  <div key={index} className={`relative group ${imagesToDelete.includes(img.filename) ? 'opacity-50' : ''}`}>
                    <img
                      src={getPropertyImageUrl(property?._id || '', img.filename)}
                      alt={`Zdjęcie ${index + 1}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <div className="absolute top-0 right-0 p-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleDeleteExistingImage(img.filename)}
                        className={`bg-white rounded-full p-1 shadow-md hover:bg-red-100 ${imagesToDelete.includes(img.filename) ? 'bg-red-100' : ''}`}
                      >
                        <Trash2 className={`w-4 h-4 ${imagesToDelete.includes(img.filename) ? 'text-red-600' : 'text-gray-600'}`} />
                      </button>
                    </div>
                    {!imagesToDelete.includes(img.filename) && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2">
                        <button
                          type="button"
                          onClick={() => setMainImage(img.filename)}
                          className={`text-xs py-1 px-2 rounded-full ${img.isMain 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {img.isMain ? 'Główne zdjęcie' : 'Ustaw jako główne'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add new images */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Dodaj nowe zdjęcia</h3>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="newImages"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Kliknij, aby dodać zdjęcia</span> lub przeciągnij i upuść
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG do 10MB</p>
                </div>
                <input
                  id="newImages"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleNewImageChange}
                />
              </label>
            </div>
            
            {newImagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {newImagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Nowe zdjęcie ${index + 1}`}
                      className={`h-32 w-full object-cover rounded-lg ${
                        newMainImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMainImageIndex(index)}
                      className={`absolute bottom-0 left-0 right-0 py-1 text-xs text-center transition-colors ${
                        newMainImageIndex === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {newMainImageIndex === index ? 'Główne nowe zdjęcie' : 'Ustaw jako główne'}
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
            onClick={() => navigate(-1)} // POPRAWKA: użycie navigate
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
                Zapisz zmiany
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default EditProperty;
