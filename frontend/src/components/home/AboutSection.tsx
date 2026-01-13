import { Button } from '../ui/button';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface AboutSectionProps {
  onNavigate: (route: Route, options?: { 
    propertyId?: string; 
    filters?: Record<string, unknown>;
    replaceState?: boolean;
  }) => void;
}

export const AboutSection = ({ onNavigate }: AboutSectionProps) => {
  return (
    // Zmniejszony padding (py-12 zamiast py-16)
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Tekst: Wyśrodkowany na mobile (text-center), do lewej na desktopie (lg:text-left) */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-3xl font-bold mb-6">O nas</h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              Jesteśmy nowoczesnym biurem nieruchomości z doświadczonym zespołem ekspertów. 
              Dzięki wieloletniej praktyce i znajomości rynku pomagamy naszym klientom 
              w realizacji marzeń o idealnym miejscu do życia lub udanej inwestycji.
            </p>
            <p className="text-slate-700 mb-8 leading-relaxed">
              Oferujemy kompleksową obsługę na każdym etapie - od wyceny nieruchomości, 
              przez pomoc w formalnościach, aż po finalizację transakcji. 
              Nasze doświadczenie to Twoja pewność i bezpieczeństwo.
            </p>
            
            {/* Kontener przycisku: Centruje przycisk na mobile, wyrównuje do lewej na desktopie */}
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="sm"
                onClick={() => onNavigate('about')} 
                className="bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all duration-300"
              >
                Poznaj nas lepiej
              </Button>
            </div>
          </div>
          
          {/* Obrazek: Na mobile pierwszy (order-1), na desktopie drugi (lg:order-2) - opcjonalne, zależnie jak wolisz */}
          <div className="relative order-1 lg:order-2">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop"
              alt="Real Estate CRM Team"
              className="rounded-xl shadow-lg w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 to-transparent rounded-xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};