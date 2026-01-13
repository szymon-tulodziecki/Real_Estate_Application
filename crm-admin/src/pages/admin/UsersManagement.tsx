import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Shield, User, UserCheck, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User as UserType } from '../../types';
import { usersAPI } from '../../utils/api';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Sprawdź czy current user to Super Admin
  const isRoot = currentUser?.role === 'root';

  // Funkcja sprawdzająca czy można edytować użytkownika
  const canEditUser = (user: UserType) => {
    // Każdy może edytować swoje konto
    if (user._id === currentUser?._id) return true;
    
    // Agenci mogą być edytowani przez każdego admina
    if (user.role === 'agent') return true;
    
    // Admin może edytować inne konta adminów tylko jeśli jest Root
    if (user.role === 'admin') {
      return isRoot;
    }
    
    // Root może edytować wszystkich
    if (user.role === 'root') {
      return isRoot;
    }
    
    return false;
  };

  // Funkcja sprawdzająca czy można usunąć użytkownika
  const canDeleteUser = (user: UserType) => {
    // Nie można usunąć własnego konta
    if (user._id === currentUser?._id) return false;
    
    // Nie można usunąć root użytkownika
    if (user.role === 'root') return false;
    
    // Root może usunąć wszystkich (oprócz siebie)
    if (isRoot) return true;
    
    // Zwykły admin może usunąć tylko agentów
    if (user.role === 'agent') return true;
    
    return false;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = users.find(u => u._id === id);
    
    // Sprawdź czy to nie super admin (który nie może być usunięty)
    if (target && target.role === 'root') {
      setError('Nie można usunąć Super Administratora (Root).');
      return;
    }

    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    
    setDeletingId(id);
    setError(null);

    try {
      await usersAPI.delete(id);
      setUsers(users.filter(u => u._id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      
      type APIError = {
        response?: {
          status?: number;
          data?: {
            message?: string;
            error?: string;
          };
        };
      };

      const apiError = error as APIError;

      if (apiError?.response?.status === 401) {
        setError('Sesja wygasła. Zaloguj się ponownie.');
        window.location.href = '/admin/login';
      } else if (apiError?.response?.status === 403) {
        setError('Brak uprawnień do usunięcia użytkownika.');
      } else if (apiError?.response?.data?.error || apiError?.response?.data?.message) {
        setError(`Błąd: ${apiError.response.data.error || apiError.response.data.message}`);
      } else {
        setError('Wystąpił błąd podczas usuwania użytkownika');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'agent':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'agent':
        return 'Agent';
      case 'client':
        return 'Klient';
      default:
        return role;
    }
  };

  const filteredUsers = (users && Array.isArray(users)) ? users
    .filter(user => {
      const matchSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' ? true : user.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }) : [];

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
          <h1 className="text-2xl font-bold text-gray-900">Zarządzanie użytkownikami</h1>
          <p className="text-gray-600">Dodawaj, edytuj i usuwaj użytkowników</p>
        </div>
        <button 
          onClick={() => window.location.href = '/admin/users/create'} 
          className="btn-primary btn-primary-sm flex items-center"
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Dodaj użytkownika
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="search-wrapper w-full md:max-w-xs">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Szukaj użytkowników..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-search search-input w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <div className="seg-group">
              {(['all','admin','agent'] as const).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRoleFilter(val)}
                  className={`seg-btn ${roleFilter === val ? 'seg-btn-active' : ''}`}
                >
                  {val === 'all' ? 'Wszyscy' : (val === 'admin' ? 'Admin' : 'Agenci')}
                </button>
              ))}
            </div>
            <div className="seg-group">
              {(['asc','desc'] as const).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSortOrder(val)}
                  className={`seg-btn ${sortOrder === val ? 'seg-btn-active' : ''}`}
                  title={val === 'asc' ? 'Sortuj rosnąco' : 'Sortuj malejąco'}
                >
                  {val === 'asc' ? 'A→Z' : 'Z→A'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">Nie znaleziono użytkowników</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-zebra">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data rejestracji
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center cursor-pointer" onClick={() => navigate(`/admin/users/view/${user._id}`)} title="Pokaż szczegóły użytkownika">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium text-white ${index % 2 ? 'bg-blue-500' : 'bg-blue-700'}`}>
                            <span className="text-sm">
                              {user.firstName && user.firstName.length > 0 ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 hover:underline">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getRoleLabel(user.role)}
                        </span>
                        {/* Korona dla Super Admina */}
                        {user.role === 'root' && (
                          <Crown className="w-4 h-4 text-yellow-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-4">
                        {/* Ikona edycji - pokazuj tylko jeśli można edytować */}
                        {canEditUser(user) && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-sm"
                            title="Edytuj użytkownika"
                            aria-label="Edytuj użytkownika"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {/* Ikona usuwania - pokazuj tylko jeśli można usunąć */}
                        {canDeleteUser(user) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded-sm flex items-center"
                            disabled={deletingId === user._id}
                            title="Usuń użytkownika"
                            aria-label="Usuń użytkownika"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === user._id && <span className="ml-1 animate-pulse text-xs">...</span>}
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

export default UsersManagement;