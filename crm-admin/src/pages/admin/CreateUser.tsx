import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const CreateUser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
    // Sprawdź czy user jest root (może tworzyć adminów)
  const isRoot = user?.role === 'root';
  
  // Dostępne role - zwykły admin może tworzyć tylko agentów
  const availableRoles = useMemo(() => 
    isRoot 
      ? [{ value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Administrator' }]
      : [{ value: 'agent', label: 'Agent' }],
    [isRoot]
  );
    
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(availableRoles[0].value);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!employeeId) {
      setError('Numer pracownika jest wymagany');
      return false;
    }
    if (!/^[0-9]{4,10}$/.test(employeeId)) {
      setError('Numer pracownika musi mieć 4-10 cyfr');
      return false;
    }
    if (!email || !password) {
      setError('Email i hasło są wymagane');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return false;
    }
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append('employeeId', employeeId);
      form.append('firstName', firstName);
      form.append('lastName', lastName);
      form.append('email', email);
      form.append('password', password);
      form.append('phone', phone);
      form.append('role', role);
      if (role === 'agent') {
        form.append('isPublic', isPublic.toString());
      }
      if (avatarFile) form.append('avatar', avatarFile);

      const apiModule = await import('../../utils/api');
      const apiDefault = apiModule.default;
      await apiDefault.post('/users', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/admin/users');
      }, 2000);
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      type APIError = { response?: { status?: number; data?: { message?: string } } };
      const apiError = error as APIError;
      if (apiError?.response?.status === 401) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
        setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
      } else if (apiError?.response?.status === 403) {
        setError('Brak uprawnień do tworzenia użytkowników.');
      } else if (apiError?.response?.data?.message) {
        setError(apiError.response.data.message);
      } else {
        setError('Wystąpił błąd podczas tworzenia użytkownika');
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
          <h1 className="text-2xl font-bold text-gray-900">Dodaj nowego użytkownika</h1>
          <p className="text-gray-600">Wypełnij formularz, aby dodać nowego użytkownika</p>
        </div>
        <button 
          onClick={() => navigate('/admin/users')}
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
          <span className="block sm:inline"> Użytkownik został dodany.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Informacje podstawowe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="employeeId" className="label-field">Numer pracownika*</label>
              <input
                type="text"
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="input-field"
                placeholder="np. 2004"
                required
              />
            </div>
            <div>
              <label htmlFor="firstName" className="label-field">
                Imię
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="Jan"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label-field">
                Nazwisko
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="Kowalski"
              />
            </div>
            {/* Email i telefon tylko dla agentów */}
            {role === 'agent' && (
              <>
                <div>
                  <label htmlFor="email" className="label-field">
                    Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="jan.kowalski@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="label-field">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder="123-456-789"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="role" className="label-field">
                Rola*
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
                required
              >
                {availableRoles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Avatar tylko dla agentów */}
            {role === 'agent' && (
              <div className="flex justify-center">
                {/* Centrowana sekcja avatar z większą ikoną */}
                <div className="flex flex-col items-center w-full max-w-xs">
                <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 mb-4">
                  {avatarFile ? (
                    <img 
                      src={URL.createObjectURL(avatarFile)} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                
                {/* Wybór zdjęcia pod ikoną */}
                <div className="w-full text-center">
                  <label className="label-field mb-2">Zdjęcie profilowe</label>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 mb-2">
                    <Upload className="w-4 h-4 mr-2" />
                    Wybierz zdjęcie
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} 
                      className="sr-only" 
                    />
                  </label>
                  <p className="text-xs text-gray-500 mb-2">PNG, JPG, GIF do 10MB</p>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={() => setAvatarFile(null)}
                      className="text-red-600 hover:text-red-800 text-sm block w-full"
                    >
                      Usuń zdjęcie
                    </button>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Sekcja uprawnień - tylko dla agentów */}
        {role === 'agent' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Ustawienia profilu</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Profil publiczny (widoczny na stronie dla klientów)
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Agenci z profilem publicznym będą widoczni na stronie internetowej dla potencjalnych klientów.
              </p>
            </div>
          </div>
        )}

        {/* Sekcja hasła */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Hasło</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="label-field">
                Hasło*
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label-field">
                Potwierdź hasło*
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••"
                required
                minLength={6}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
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
                Zapisz użytkownika
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
