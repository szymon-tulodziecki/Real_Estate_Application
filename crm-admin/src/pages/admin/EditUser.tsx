import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, User as UserIcon } from 'lucide-react';
import { usersAPI } from '../../utils/api';
import { userLockAPI } from '../../utils/userLockAPI';
import { useAuth } from '../../hooks/useAuth';
import LockNotification from '../../components/LockNotification';
import type { User } from '../../types';

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  
  // Sprawdź czy current user jest root
  const isRoot = currentUser?.role === 'root';
  
  // Dostępne role - zwykły admin może edytować tylko agentów
  const availableRoles = useMemo(() => 
    isRoot 
      ? [{ value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Administrator' }]
      : [{ value: 'agent', label: 'Agent' }], 
    [isRoot]
  );
  
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(availableRoles[0].value);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
    // Stany lockowania
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; lockedBy?: string; lockedById?: string } | null>(null);
  const [showLockNotification, setShowLockNotification] = useState(false);
  
  // Check lock status
  const checkLock = useCallback(async (userId: string) => {
    try {
      const lock = await userLockAPI.acquireLock(userId);
      setLockInfo(lock);
      if (lock.locked && lock.lockedById && lock.lockedById !== currentUser?._id) {
        setShowLockNotification(true);
      } else {
        setShowLockNotification(false);
      }
    } catch {
      setLockInfo({ locked: false });
    }
  }, [currentUser]);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async (userId: string) => {
      try {
        setFetchLoading(true);
        const userData = await usersAPI.getById(userId);
        setUser(userData);
        
        // Populate form fields
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setRole(userData.role || availableRoles[0].value);
        setBio((userData as unknown as { bio?: string }).bio || '');
        setAvatar((userData as unknown as { avatar?: string }).avatar);
        setIsPublic((userData as unknown as { isPublic?: boolean }).isPublic ?? true);
        
        // Sprawdź czy zwykły admin próbuje edytować admina
        if (!isRoot && userData.role === 'admin') {
          setError('Nie masz uprawnień do edycji tego użytkownika');
          return;
        }
        
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Nie udało się pobrać danych użytkownika');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchUser(id);
      checkLock(id);
    } else {
      setFetchLoading(false);
      setError('Brak ID użytkownika');
    }
    
    // Release lock on unmount
    return () => {
      if (id) userLockAPI.releaseLock(id).catch(() => {});
    };
  }, [id, checkLock, availableRoles, isRoot, currentUser?._id]);

  const validateForm = () => {
    // Email wymagany tylko dla agentów
    if (user?.role === 'agent' && !email) {
      setError('Email jest wymagany');
      return false;
    }

    if (password && password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return false;
    }

    if (password && password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setError('Brak ID użytkownika');
      return;
    }

    // Sprawdź czy użytkownik nie jest zablokowany przez INNEGO użytkownika
    if (lockInfo?.locked && lockInfo.lockedById && lockInfo.lockedById !== currentUser?._id) {
      setError('Użytkownik jest zablokowany do edycji przez innego administratora');
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const userData: Partial<User> & { password?: string } = {};
      
      // Podstawowe pola dla wszystkich typów użytkowników
      if (firstName) userData.firstName = firstName;
      if (lastName) userData.lastName = lastName;
      if (password) userData.password = password;
      
      // Dodatkowe pola tylko dla agentów
      if (user?.role === 'agent') {
        if (email) userData.email = email;
        if (phone) userData.phone = phone;
        if (role) userData.role = role as User['role'];
        if (bio) userData.bio = bio;
        userData.isPublic = isPublic;
      }
      
      await usersAPI.update(id, userData);
      
      // Upload avatar dla wszystkich użytkowników
      if (avatarFile) {
        await usersAPI.uploadAvatar(id, avatarFile);
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        // Agenci przekierowywani do dashboard, admini do listy użytkowników
        navigate(isAdmin() ? '/admin/users' : '/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setError((error as { response?: { data?: { message?: string } } }).response!.data!.message!);
      } else {
        setError('Wystąpił błąd podczas aktualizacji użytkownika');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Sprawdzenie uprawnień: admin może edytować każdego, agent tylko siebie
  if (currentUser && !isAdmin() && currentUser._id !== id) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Brak uprawnień!</strong>
        <span className="block sm:inline"> Możesz edytować tylko swój własny profil.</span>
      </div>
    );
  }

  if (!user && !fetchLoading) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> Nie udało się pobrać danych użytkownika</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edytuj użytkownika</h1>
          <p className="text-gray-600">Zaktualizuj informacje o użytkowniku</p>
        </div>
        <button 
          onClick={() => navigate(isAdmin() ? '/admin/users' : '/admin/dashboard')}
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
          <span className="block sm:inline"> Użytkownik został zaktualizowany.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Błąd!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 form-stack">
        <div className="card card-basic-info">
          <h2 className="form-section-title">Informacje podstawowe</h2>
          {/* Uproszczona forma dla adminów */}
          {user?.role === 'admin' ? (
            <div className="form-grid">
              <div className="form-section">
                <label htmlFor="firstName" className="label-field">Imię</label>
                <input id="firstName" type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="input-field" placeholder="Jan" />
              </div>
              <div className="form-section">
                <label htmlFor="lastName" className="label-field">Nazwisko</label>
                <input id="lastName" type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="input-field" placeholder="Kowalski" />
              </div>
            </div>
          ) : (
            /* Pełna forma dla agentów */
            <div className="form-grid">
              <div className="form-section">
                <label htmlFor="firstName" className="label-field">Imię</label>
                <input id="firstName" type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="input-field" placeholder="Jan" />
              </div>
              <div className="form-section">
                <label htmlFor="lastName" className="label-field">Nazwisko</label>
                <input id="lastName" type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="input-field" placeholder="Kowalski" />
              </div>
              {/* Email - tylko dla root adminów */}
              {isRoot && (
                <div className="form-section">
                  <label htmlFor="email" className="label-field">Email<span className="req">*</span></label>
                  <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="jan.kowalski@example.com" required />
                </div>
              )}
              {/* Telefon - tylko dla root adminów */}
              {isRoot && (
                <div className="form-section">
                  <label htmlFor="phone" className="label-field">Telefon</label>
                  <input id="phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="input-field" placeholder="123-456-789" />
                </div>
              )}
              <div className="form-section">
                <label htmlFor="role" className="label-field">Rola<span className="req">*</span></label>
                <select 
                  id="role" 
                  value={role} 
                  onChange={e=>setRole(e.target.value)} 
                  className="select-field" 
                  required
                  disabled={!isAdmin()} // Agent nie może zmieniać swojej roli
                >
                  {availableRoles.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {!isAdmin() && (
                  <p className="mt-1 text-xs text-gray-500">
                    Tylko administratorzy mogą zmieniać role użytkowników.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sekcja profilu - dla agentów i adminów (nie dla root) */}
        {user && user.role !== 'root' && (
          <div className="card card-profile">
            <h2 className="form-section-title">Profil</h2>
            <div className="grid gap-6 md:grid-cols-3 items-start">
              {/* Lewa kolumna - większa ikona */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 mb-4">
                  {avatarFile ? (
                    <img 
                      src={URL.createObjectURL(avatarFile)} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : avatar ? (
                    <img 
                      src={avatar} 
                      alt="Current avatar" 
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
                    {avatar || avatarFile ? 'Zmień zdjęcie' : 'Wybierz zdjęcie'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setAvatarFile(file || null);
                      }} 
                      className="sr-only" 
                    />
                  </label>
                  <p className="text-xs text-gray-500 mb-2">PNG, JPG, GIF do 10MB</p>
                  {(avatarFile || avatar) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatar(undefined);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm block w-full"
                    >
                      Usuń zdjęcie
                    </button>
                  )}
                </div>
              </div>
              
              {/* Prawa kolumna - Bio (tylko dla agentów) */}
              {user?.role === 'agent' && (
                <div className="md:col-span-2 form-section">
                  <label className="label-field">Bio</label>
                  <textarea className="input-field textarea-auto" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Krótki opis agenta" />
                  <div className="helper-text">Opis widoczny w szczegółach użytkownika.</div>
                </div>
              )}
            </div>
            
            {/* Sekcja uprawnień - tylko dla agentów */}
            {role === 'agent' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium mb-4">Ustawienia profilu</h3>
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
          </div>
        )}

        <div className="card">
          <h2 className="form-section-title">Zmień hasło</h2>
          <p className="helper-text">Pozostaw puste jeśli nie chcesz zmieniać hasła</p>
          <div className="form-grid">
            <div className="form-section">
              <label htmlFor="password" className="label-field">Nowe hasło</label>
              <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field" placeholder="••••••" minLength={6} />
            </div>
            <div className="form-section">
              <label htmlFor="confirmPassword" className="label-field">Potwierdź nowe hasło</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••" minLength={6} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={()=>navigate(isAdmin() ? '/admin/users' : '/admin/dashboard')} className="btn-secondary" disabled={loading || lockInfo?.locked}>Anuluj</button>
          <button type="submit" className="btn-primary" disabled={loading || lockInfo?.locked}>
            {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>Zapisywanie...</> : <><Save className="w-4 h-4 mr-2"/>Zapisz zmiany</>}
          </button>
        </div>
      </form>

      {/* Lock Notification */}
      {showLockNotification && lockInfo?.lockedBy && (
        <LockNotification 
          lockedBy={lockInfo.lockedBy} 
          resourceType="user"
          onClose={() => setShowLockNotification(false)} 
        />
      )}
    </div>
  );
};

export default EditUser;
