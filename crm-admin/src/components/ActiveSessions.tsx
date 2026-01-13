import React, { useState, useEffect } from 'react';
import { Users, Clock, Wifi, WifiOff, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sessionsAPI } from '../utils/api';

interface SessionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  avatar?: string;
  role: string;
  createdBy?: string;
}

interface ActiveSession {
  _id: string;
  sessionToken: string;
  userId: SessionUser;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  isActive: boolean;
}

interface SessionStats {
  activeNow: number;
  activeToday: number;
  lastUpdate: string;
}

const ActiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Sprawdź czy user to super admin lub root
  const isSuperAdmin = user && (user.role === 'root' || (user.role === 'admin' && !user.createdBy));

  const fetchData = async () => {
    try {
      const [sessionsResponse, statsResponse] = await Promise.all([
        sessionsAPI.getActiveSessions(),
        sessionsAPI.getSessionStats()
      ]);

      setSessions(sessionsResponse);
      setStats(statsResponse.stats);
      setError(null);
    } catch (error) {
      console.error('Session fetch error:', error);
      setError('Błąd podczas ładowania sesji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tylko admin i root mogą widzieć sesje
    if (user?.role !== 'admin' && user?.role !== 'root') return;

    fetchData();
    const interval = setInterval(fetchData, 30000); // Odświeżaj co 30 sekund

    return () => clearInterval(interval);
  }, [user]);

  const terminateSession = async (sessionId: string, userName: string) => {
    console.debug('[ActiveSessions] terminateSession clicked', sessionId, userName);
    if (!confirm(`Czy na pewno chcesz zakończyć sesję ${userName}?`)) {
      return;
    }

    try {
      const response = await sessionsAPI.terminateSession(sessionId);
      // Odśwież dane z serwera zamiast filtrować lokalnie
      await fetchData();
      // Pokaż powiadomienie sukcesu
      console.log(response.message);
    } catch (error) {
      console.error('Session termination error:', error);
      setError('Błąd podczas kończenia sesji');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceActivity = (dateString: string) => {
    const now = new Date();
    const activity = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - activity.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'teraz';
    if (diffMinutes < 60) return `${diffMinutes} min temu`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} godz temu`;
  };

  // Tylko admin i root mogą widzieć ten komponent
  if (user?.role !== 'admin' && user?.role !== 'root') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Aktywne Sesje</h3>
            {isSuperAdmin && (
              <Crown 
              className="w-4 h-4 text-yellow-500" 
              aria-label="Super Administrator" 
            />
            )}
          </div>
          {stats && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Wifi className="w-4 h-4 mr-1 text-green-500" />
                {stats.activeNow} teraz
              </span>
              <span>{stats.activeToday} dzisiaj</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista sesji */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <WifiOff className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>
              {isSuperAdmin ? 
                'Brak aktywnych sesji administratorów i agentów' : 
                'Brak aktywnych sesji agentów'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isAdmin = session.userId.role === 'admin';
              const canTerminate = isSuperAdmin || !isAdmin;
              
              return (
                <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {session.userId.avatar ? (
                      <img 
                        src={session.userId.avatar} 
                        alt={`${session.userId.firstName} ${session.userId.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        isAdmin ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {session.userId.firstName[0]}{session.userId.lastName[0]}
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium text-gray-900 flex items-center space-x-2">
                        <span>{session.userId.firstName} {session.userId.lastName}</span>
                        {isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        )}
                        {isAdmin && !session.userId.createdBy && (
                          <Crown className="w-3 h-3 text-yellow-500" aria-label="Super Administrator" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{session.userId.employeeId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeSinceActivity(session.lastActivity)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ostatnia aktywność: {formatTime(session.lastActivity)}
                      </div>
                    </div>

                    {canTerminate ? (
                      <button
                        onClick={() => terminateSession(session._id, `${session.userId.firstName} ${session.userId.lastName}`)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        title="Zakończ sesję"
                      >
                        Wyloguj
                      </button>
                    ) : (
                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-400 rounded">
                        Brak uprawnień
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
