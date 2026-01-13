import { Button } from '../ui/button';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface CTASectionProps {
  onNavigate: (route: Route, options?: { 
    propertyId?: string; 
    filters?: Record<string, unknown>;
    replaceState?: boolean;
  }) => void;
}

export const CTASection = ({ onNavigate }: CTASectionProps) => {
  return (
    <section className="py-16 bg-red-600 text-white">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Gotowy na kolejny krok?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Skontaktuj się z nami już dziś i znajdź wymarzoną nieruchomość
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => onNavigate('contact')}
            variant="secondary"
            size="lg"
            className="!bg-white !text-black !border-2 !border-transparent hover:!bg-red-600 hover:!text-white hover:!border-2 hover:!border-white transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Napisz do nas
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="!bg-red-600 !border-2 !border-white !text-white hover:!bg-white hover:!text-black hover:!border-2 hover:!border-white transition-all duration-300"
          >
            <a href="tel:+48555123456">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +48 555 123 456
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
