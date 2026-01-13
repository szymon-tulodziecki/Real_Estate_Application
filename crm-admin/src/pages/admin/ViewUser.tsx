import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, Shield, UserCheck, User } from 'lucide-react';
import { usersAPI } from '../../utils/api';
import type { User as UserType } from '../../types';

const ViewUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchUser(id);
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      const userData = await usersAPI.getById(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Nie udało się pobrać danych użytkownika');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    
    // Sprawdź czy to nie Super Admin
    if (user.role === 'admin' && (!user.createdBy || user.createdBy === null)) {
      setError('Nie można usunąć Super Administratora (Root).');
      return;
    }
    
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      await usersAPI.delete(id);
      navigate('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Wystąpił błąd podczas usuwania użytkownika');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Brak danych';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'agent':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'agent':
        return 'Agent';
      case 'client':
        return 'Klient';
      default:
        return role || 'Nieznana rola';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Błąd!</strong>
        <span className="block sm:inline"> {error || 'Nie udało się pobrać danych użytkownika'}</span>
        <button 
          className="btn-secondary mt-4"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć do listy
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </h1>
          <div className="flex items-center text-gray-600 mt-1">
            {getRoleIcon(user.role)}
            <span className="ml-2">{getRoleLabel(user.role)}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/admin/users')}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </button>
          <button 
            onClick={() => navigate(`/admin/users/${id}/edit`)}
            className="btn-primary flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edytuj
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex items-center disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Usuwanie...' : 'Usuń'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User info card */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center mb-8">
              <div className="flex-shrink-0 h-24 w-24">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-3xl font-medium text-white">
                      {user.firstName 
                        ? user.firstName.charAt(0).toUpperCase() 
                        : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'Brak danych'}
                </h2>
                <div className="mt-1 flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="mt-1 flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Dane użytkownika</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Imię</p>
                  <p className="font-medium mt-1">{user.firstName || 'Brak danych'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nazwisko</p>
                  <p className="font-medium mt-1">{user.lastName || 'Brak danych'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium mt-1">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <p className="font-medium mt-1">{user.phone || 'Brak danych'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rola</p>
                  <div className="flex items-center mt-1">
                    {getRoleIcon(user.role)}
                    <span className="ml-2 font-medium">{getRoleLabel(user.role)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive !== false ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity card */}
        <div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Aktywność</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Data rejestracji</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Ostatnia aktualizacja</p>
                    <p className="font-medium">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
              {user.lastLogin && (
                <div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ostatnie logowanie</p>
                      <p className="font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold mb-4">Szybkie akcje</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/admin/users/${id}/edit`)} 
                className="btn-secondary w-full justify-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edytuj użytkownika
              </button>
              {/* Ukryj przycisk usuwania dla Super Admina */}
              {!(user.role === 'admin' && (!user.createdBy || user.createdBy === null)) && (
                <button 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="btn-danger w-full justify-center disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Usuwanie...' : 'Usuń użytkownika'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;
