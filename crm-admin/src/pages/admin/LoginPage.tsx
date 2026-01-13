import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
import { authAPI } from '../../utils/api';
import type { LoginCredentials } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    employeeId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(credentials);
      
      if (!response.token || !response.user) {
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }
      
      login(response.user, response.token);
    } catch (err: unknown) {
      // Pobierz komunikat z backend API
      let errorMessage = 'Wystąpił nieoczekiwany błąd podczas logowania';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Panel CRM
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Profesjonalne zarządzanie nieruchomościami
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Zaloguj się aby kontynuować
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Numer pracownika
                </label>
                <input
                  id="employeeId"
                  type="text"
                  required
                  className="input-field-large"
                  placeholder="Wpisz numer pracownika..."
                  value={credentials.employeeId}
                  onChange={(e) => setCredentials({ ...credentials, employeeId: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Hasło
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field-large pr-12"
                    placeholder="wpisz swoje hasło..."
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center text-lg py-4 mt-6"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                  Logowanie...
                </div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-3" />
                  Zaloguj się do systemu
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2025 Biuro Nieruchomości CRM
          </p>
        </div>
      </div>
    </div>
  );
}