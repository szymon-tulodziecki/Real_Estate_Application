import { useState, useEffect } from 'react';
import { Crown, Monitor, Clock, MapPin, RefreshCw, Activity, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { sessionsAPI } from '../../utils/api';
import type { ActiveSession } from '../../types';

const SessionsManagement = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRoot = user?.role === 'root';

  const fetchSessions = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const sessions = await sessionsAPI.getActiveSessions();
      setSessions(sessions);
    } catch (err) {
      setError('Błąd podczas pobierania sesji');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!confirm('Czy na pewno chcesz zakończyć tę sesję?')) {
      return;
    }

    try {
      await sessionsAPI.terminateSession(sessionId);
      await fetchSessions(); // Odśwież listę sesji
    } catch (err) {
      setError('Błąd podczas kończenia sesji');
      console.error('Error terminating session:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Odświeżaj co 30 sekund
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activity = new Date(date);
    const diffMinutes = Math.floor((now.getTime() - activity.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'teraz';
    if (diffMinutes < 60) return `${diffMinutes} min temu`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} godz. temu`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Aktywne Sesje
          </h1>
          <p className="text-gray-600">
            Zarządzanie aktywnymi sesjami użytkowników
          </p>
        </div>
        <button
          onClick={() => fetchSessions(true)}
          disabled={refreshing}
          className={`btn btn-primary flex items-center gap-2 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Odświeżanie...' : 'Odśwież'}
        </button>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">Aktywne sesje</p>
              <p className="text-2xl font-semibold text-blue-900">{sessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700">Administratorzy</p>
              <p className="text-2xl font-semibold text-purple-900">
                {sessions.filter(s => s.userId.role === 'admin' || s.userId.role === 'root').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Agenci</p>
              <p className="text-2xl font-semibold text-green-900">
                {sessions.filter(s => s.userId.role === 'agent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista aktywnych sesji</h3>
        </div>
        
        <div className="overflow-x-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Brak aktywnych sesji</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ostatnia aktywność
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP / Lokalizacja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {session.userId.firstName} {session.userId.lastName}
                            </div>
                            {session.userId.role === 'root' && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{session.userId.email}</div>
                          <div className="text-xs text-gray-400">ID: {session.userId.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.userId.role === 'root'
                          ? 'bg-yellow-100 text-yellow-800'
                          : session.userId.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.userId.role === 'root' ? 'Root Administrator' 
                         : session.userId.role === 'admin' ? 'Administrator' 
                         : 'Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {formatLastActivity(session.lastActivity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[150px]" title={session.ipAddress}>
                          {session.ipAddress}
                        </span>
                      </div>
                      {session.userAgent && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={session.userAgent}>
                          {session.userAgent}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(() => {
                        // Root Admin może terminować wszystkie sesje
                        if (isRoot) {
                          return (
                            <button
                              onClick={() => terminateSession(session._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Zakończ sesję
                            </button>
                          );
                        }
                        
                        // Zwykły admin może terminować tylko sesje agentów (NIE innych adminów ani roota)
                        if (user?.role === 'admin' && session.userId.role === 'agent') {
                          return (
                            <button
                              onClick={() => terminateSession(session._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Zakończ sesję
                            </button>
                          );
                        }
                        
                        // W pozostałych przypadkach brak uprawnień
                        return <span className="text-gray-400">Brak uprawnień</span>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsManagement;
