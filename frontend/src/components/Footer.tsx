import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Phone, 
  Envelope, 
  MapPin,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  ArrowRight,
  House
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatPhoneNumber } from '../lib/utils';
import { PolicyDialog } from './PolicyDialog';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface FooterProps {
  onNavigate: (route: Route) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [policyDialog, setPolicyDialog] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !gdprConsent) {
      toast.error('Wypełnij wszystkie pola i zaakceptuj politykę prywatności');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Dziękujemy za zapisanie się do newslettera!');
      setEmail('');
      setGdprConsent(false);
    } catch {
      toast.error('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLinks = [
    { label: 'Wszystkie oferty', route: 'properties' as const },
    { label: 'O nas', route: 'about' as const },
    { label: 'Zespół', route: 'team' as const },
    { label: 'Kontakt', route: 'contact' as const },
  ];

  const propertyTypes = [
    'Mieszkania',
    'Domy',
    'Lokale komercyjne',
    'Działki budowlane'
  ];

  const offices = [
    {
      name: 'Biuro Główne',
      address: 'ul. Przykładowa 1',
      postalCode: '00-000 Miasto',
      phone: '+48 555 123 456',
      email: 'biuro@realestate.com'
    },
    {
      name: 'Biuro Centrum',
      address: 'ul. Centralna 26',
      postalCode: '00-001 Miasto',
      phone: '+48 555 123 456',
      email: 'biuro@realestate.com'
    }
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Bądź na bieżąco z nowymi ofertami
            </h3>
            <p className="text-primary-foreground/80 mb-8">
              Zapisz się do naszego newslettera i otrzymuj najświeższe oferty nieruchomości prosto na swoją skrzynkę
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Twój adres e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:border-red-600 focus:ring-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/50"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    'Zapisuję...'
                  ) : (
                    <>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 justify-center text-sm">
                <Checkbox
                  id="gdpr-consent"
                  checked={gdprConsent}
                  onCheckedChange={(checked: boolean) => setGdprConsent(checked)}
                  className="border-primary-foreground/30 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <label htmlFor="gdpr-consent" className="text-primary-foreground/80 cursor-pointer">
                  Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z{' '}
                  <button 
                    type="button"
                    onClick={() => setPolicyDialog('privacy')}
                    className="underline hover:text-red-600 transition-colors"
                  >
                    polityką prywatności
                  </button>
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12">
        {/* ZMIANA: text-center na mobile, md:text-left na desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
          {/* Company Info */}
          <div className="lg:col-span-1">
            {/* ZMIANA: justify-center na mobile */}
            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <House size={40} weight="fill" className="text-red-600" />
                <span className="text-2xl font-bold text-white">Real Estate CRM</span>
              </div>
            </div>
            
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              Profesjonalne doradztwo w zakresie nieruchomości. Pomagamy znaleźć wymarzone mieszkania, domy i inwestycje na terenie całej Polski.
            </p>
            
            {/* ZMIANA: justify-center na mobile */}
            <div className="flex gap-3 justify-center md:justify-start">
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-10 p-0 hover:!bg-primary-foreground/10 text-primary-foreground hover:!text-red-600"
              >
                <FacebookLogo size={20} weight="bold" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-10 p-0 hover:!bg-primary-foreground/10 text-primary-foreground hover:!text-red-600"
              >
                <InstagramLogo size={20} weight="bold" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-10 p-0 hover:!bg-primary-foreground/10 text-primary-foreground hover:!text-red-600"
              >
                <LinkedinLogo size={20} weight="bold" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Szybkie linki</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate(link.route)}
                    className="text-primary-foreground/80 hover:text-red-600 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Nasze oferty</h4>
            <ul className="space-y-3">
              {propertyTypes.map((type, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate('properties')}
                    className="text-primary-foreground/80 hover:text-red-600 transition-colors"
                  >
                    {type}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Nasze biura</h4>
            <div className="space-y-6">
              {offices.map((office, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="font-medium text-red-600">{office.name}</h5>
                  
                  {/* ZMIANA: justify-center na mobile dla każdego wiersza kontaktu */}
                  <div className="flex items-start gap-2 text-sm text-primary-foreground/80 justify-center md:justify-start">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    {/* text-left wymuszone dla adresu, żeby ładnie wyglądał przy ikonie, ale całość wyśrodkowana flexem */}
                    <div className="text-left md:text-left">
                      <div>{office.address}</div>
                      <div>{office.postalCode}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80 justify-center md:justify-start">
                    <Phone size={16} />
                    <a href={`tel:${office.phone}`} className="hover:text-red-600 transition-colors">
                      {formatPhoneNumber(office.phone)}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80 justify-center md:justify-start">
                    <Envelope size={16} />
                    <a href={`mailto:${office.email}`} className="hover:text-red-600 transition-colors">
                      {office.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          {/* ZMIANA: text-center na mobile */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60 text-center md:text-left">
            <div>
              © 2025 Real Estate CRM. Wszystkie prawa zastrzeżone.
            </div>
            
            {/* ZMIANA: flex-wrap i justify-center na mobile */}
            <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
              <button 
                onClick={() => setPolicyDialog('privacy')}
                className="hover:text-red-600 transition-colors"
              >
                Polityka prywatności
              </button>
              <button 
                onClick={() => setPolicyDialog('terms')}
                className="hover:text-red-600 transition-colors"
              >
                Regulamin
              </button>
              <button 
                onClick={() => setPolicyDialog('cookies')}
                className="hover:text-red-600 transition-colors"
              >
                Pliki cookies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Dialogs */}
      {policyDialog && (
        <PolicyDialog
          open={!!policyDialog}
          onOpenChange={(open) => !open && setPolicyDialog(null)}
          type={policyDialog}
        />
      )}
    </footer>
  );
}