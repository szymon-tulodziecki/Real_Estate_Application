import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Users, 
  TrendUp,
  CheckCircle,
  Star
} from '@phosphor-icons/react';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface AboutPageProps {
  onNavigate: (route: Route) => void;
}

function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      icon: <CheckCircle size={32} weight="bold" />,
      title: 'Profesjonalizm',
      description: 'Każda transakcja przeprowadzana z najwyższą starannością'
    },
    {
      icon: <Users size={32} weight="bold" />,
      title: 'Partnerstwo',
      description: 'Budujemy długotrwałe relacje oparte na zaufaniu'
    },
    {
      icon: <TrendUp size={32} weight="bold" />,
      title: 'Innowacyjność',
      description: 'Wykorzystujemy nowoczesne technologie i metody'
    },
    {
      icon: <Star size={32} weight="bold" />,
      title: 'Jakość',
      description: 'Gwarantujemy najwyższą jakość świadczonych usług'
    }
  ];

  const achievements = [
    { number: '500+', label: 'Udanych transakcji' },
    { number: '15+', label: 'Lat doświadczenia' },
    { number: '50+', label: 'Doradców' },
    { number: '98%', label: 'Zadowolonych klientów' }
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              O naszej firmie
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Jesteśmy dynamicznie rozwijającym się zespołem profesjonalistów, 
              który pomaga klientom w realizacji ich marzeń o idealnej nieruchomości.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          {/* History Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Nasza historia</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                <p>
                  Jesteśmy nowoczesnym biurem nieruchomości z doświadczonym zespołem ekspertów. Dzięki wieloletniej praktyce i znajomości rynku pomagamy naszym klientom w realizacji marzeń o idealnym miejscu do życia lub udanej inwestycji.
                </p>
                <p>
                  Specjalizujemy się w doradztwie i wsparciu na każdym etapie procesu sprzedaży, zakupu oraz wynajmu nieruchomości, gwarantując kompleksową obsługę na najwyższym poziomie.
                </p>
                <p>
                  Naszym celem jest ciągły rozwój i rozbudowa sieci biur, które zapewniają klientom wsparcie o najwyższym standardzie. Świadczymy usługi na terenie całego kraju, łącząc lokalną wiedzę z profesjonalnym podejściem.
                </p>
              </div>
            </div>
            
            <div className="relative mt-4 lg:mt-0">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=500&fit=crop"
                alt="Zespół Real Estate CRM"
                className="rounded-xl shadow-lg w-full h-64 md:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl" />
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-12 md:mb-16">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Nasze wartości</h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Fundamenty, na których budujemy nasze relacje z klientami
              </p>
            </div>
            
            {/* Grid adjusted for mobile: 1 column on small, 2 on medium, 4 on large */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="text-red-600 mb-4 flex justify-center">
                      {value.icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{value.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-red-600 text-white rounded-3xl p-6 md:p-8 mb-12 md:mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Nasze osiągnięcia</h2>
              <p className="text-base md:text-xl opacity-90">
                Liczby, które świadczą o naszym doświadczeniu
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{achievement.number}</div>
                  <div className="text-sm md:text-lg opacity-90">{achievement.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Approach */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image ordered second on mobile to keep flow, first on desktop */}
            <div className="relative order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=500&fit=crop"
                alt="Profesjonalne podejście"
                className="rounded-xl shadow-lg w-full h-64 md:h-[500px] object-cover"
              />
            </div>
            
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Nasze podejście</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                <p>
                  Koncentrujemy się na pracy na podstawie umów ekskluzywnych, co pozwala nam przygotowywać oferty sprzedaży, kupna lub wynajmu nieruchomości z najwyższą starannością i dbałością o detale.
                </p>
                <p>
                  Nasze podejście opiera się na zaufaniu i partnerskich relacjach z Klientami. Dzięki temu jesteśmy w stanie doradzać w sposób indywidualny, dostosowany do specyficznych potrzeb każdego Klienta.
                </p>
                <p>
                  Każda umowa przygotowywana przez naszych doradców jest tworzona z myślą o pełnym zabezpieczeniu interesów obu stron transakcji, co zapewnia pełną satysfakcję z przeprowadzonych operacji.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                <Button 
                  onClick={() => onNavigate('team')} 
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  Poznaj nasz zespół
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate('contact')}
                  className="w-full sm:w-auto"
                >
                  Skontaktuj się z nami
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;