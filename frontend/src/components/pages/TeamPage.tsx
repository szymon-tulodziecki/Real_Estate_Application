import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Envelope, User } from '@phosphor-icons/react';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
}

interface TeamPageProps {
  onNavigate: (route: Route) => void;
}

function TeamPage({ onNavigate }: TeamPageProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/public/agents`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TeamPage] Error response:', errorText);
        throw new Error(`Failed to fetch agents: ${response.status}`);
      }
      
      const data = await response.json();
      const activeAgents = (data.agents as Agent[]).filter(
        (agent) => agent.isActive
      );
      setAgents(activeAgents);
    } catch (err) {
      setError('Nie udało się załadować agentów. Spróbuj ponownie później.');
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAgents}>Spróbuj ponownie</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pt-24 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Nasz Zespół</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Poznaj ekspertów, którzy pomogą Ci znaleźć idealną nieruchomość
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {agents && agents.length > 0 ? (
            agents.map((agent) => (
            <div className="w-full max-w-sm" key={agent._id}>
              <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden">
                    {agent.avatar ? (
                      <img 
                        src={agent.avatar} 
                        alt={`${agent.firstName} ${agent.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {agent.firstName} {agent.lastName}
                  </h3>

                  <div className="space-y-2 mb-4 w-full">
                    {agent.email && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Envelope size={18} />
                        <a
                          href={`mailto:${agent.email}`}
                          className="hover:text-red-600 transition-colors text-sm"
                        >
                          {agent.email}
                        </a>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Phone size={18} />
                        <a
                          href={`tel:${agent.phone}`}
                          className="hover:text-red-600 transition-colors text-sm"
                        >
                          {agent.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onNavigate('contact')}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Skontaktuj się
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
            ))
          ) : !loading ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
              <p className="text-gray-600 text-lg">Brak dostępnych agentów</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Potrzebujesz pomocy?</h2>
          <p className="text-lg text-gray-600 mb-6">
            Nasi eksperci są gotowi odpowiedzieć na wszystkie Twoje pytania
          </p>
          <Button
            onClick={() => onNavigate('contact')}
            size="lg"
            className="bg-red-600 hover:bg-red-700"
          >
            Skontaktuj się z nami
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TeamPage;
