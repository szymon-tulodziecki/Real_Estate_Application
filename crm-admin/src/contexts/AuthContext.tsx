import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  isAgent: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  isAdmin: () => false,
  isAgent: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (user: User, token: string) => {
    // Normalizujemy pole _id (backend może zwrócić id)
    const normalizedUser: User = {
      ...user,
      _id: (user as User)._id || (user as unknown as { id?: string }).id || user._id
    } as User;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    // Automatyczne przejście do dashboardu jeśli jesteśmy na stronie logowania
    if (window.location.pathname.includes('/admin/login')) {
      window.location.replace('/admin/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/admin/login';
  };

  const isAdmin = () => {
    // Pierwsze sprawdzenie - aktualny user w state
    if (user?.role === 'admin' || user?.role === 'root') {
      return true;
    }
    
    // Jeśli user nie istnieje w state, sprawdź localStorage jako backup
    if (!user) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser?.role === 'admin' || parsedUser?.role === 'root';
        }
      } catch (e) {
        console.error('Error reading user from localStorage', e);
      }
    }
    
    return false;
  };

  const isAgent = () => {
    // Pierwsze sprawdzenie - aktualny user w state
    if (user?.role === 'agent') {
      return true;
    }
    
    // Jeśli user nie istnieje w state, sprawdź localStorage jako backup
    if (!user) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser?.role === 'agent';
        }
      } catch (e) {
        console.error('Error reading user from localStorage', e);
      }
    }
    
    return false;
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user data:', error);
      logout();
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Odświeżamy dane użytkownika z serwera, ale tylko jeśli token jest ważny
          try {
            const userData = await authAPI.getProfile();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (refreshError) {
            // Jeśli odświeżanie się nie powiedzie, zachowujemy lokalnego użytkownika
            console.warn('Could not refresh user data, using cached data:', refreshError);
          }
        } catch (error) {
          console.error('Error during auth check:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
