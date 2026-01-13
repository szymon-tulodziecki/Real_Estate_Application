import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Phone, 
  Envelope, 
  MapPin,
  Clock,
  Building
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  gdprConsent: boolean;
}

function ContactPage() {
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    gdprConsent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const offices = [
    {
      name: 'Biuro Główne',
      address: 'ul. Przykładowa 1',
      postalCode: '00-000 Miasto',
      phone: '+48 555 123 456',
      email: 'biuro@realestate.com',
      hours: 'Pon-Pt: 9:00-17:00, Sob: 9:00-14:00',
    },
    {
      name: 'Biuro Centrum',
      address: 'ul. Centralna 26',
      postalCode: '00-001 Miasto',
      phone: '+48 555 123 456',
      email: 'biuro@realestate.com',
      hours: 'Pon-Pt: 9:00-17:00, Sob: 9:00-14:00',
    }
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message || !contactForm.gdprConsent) {
      toast.error('Wypełnij wszystkie wymagane pola i zaakceptuj politykę prywatności');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Dziękujemy za wiadomość! Skontaktujemy się z Tobą wkrótce.');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        gdprConsent: false
      });
    } catch {
      toast.error('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              Skontaktuj się z nami
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Jesteśmy tutaj, aby pomóc Ci znaleźć wymarzoną nieruchomość lub sprzedać obecną. 
              Skontaktuj się z nami już dziś!
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 md:mb-16">
          {/* Contact Forms - LEWA STRONA (Top on mobile) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Envelope size={24} className="text-red-600" />
                  Formularz kontaktowy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Imię i nazwisko *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jan Kowalski"
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Adres e-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="jan@example.com"
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Numer telefonu</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+48 123 456 789"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Temat</Label>
                      <Select 
                        value={contactForm.subject}
                        onValueChange={(value) => setContactForm(prev => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Wybierz temat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kupno">Kupno nieruchomości</SelectItem>
                          <SelectItem value="sprzedaz">Sprzedaż nieruchomości</SelectItem>
                          <SelectItem value="wynajem">Wynajem</SelectItem>
                          <SelectItem value="wycena">Wycena nieruchomości</SelectItem>
                          <SelectItem value="inne">Inne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Wiadomość *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Opisz swoją potrzebę..."
                      rows={5}
                      required
                      className="resize-none"
                    />
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="contact-gdpr"
                      checked={contactForm.gdprConsent}
                      onCheckedChange={(checked) => 
                        setContactForm(prev => ({ ...prev, gdprConsent: checked === true }))
                      }
                      required
                      className="mt-1"
                    />
                    <Label htmlFor="contact-gdpr" className="text-sm leading-snug cursor-pointer text-muted-foreground">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z{' '}
                      <span className="text-red-600 underline hover:no-underline">
                        polityką prywatności
                      </span>
                      *
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-base"
                    size="lg"
                  >
                    {isSubmitting ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information (Sidebar) - PRAWA STRONA (Bottom on mobile) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Szybki kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <Phone size={24} className="text-red-600 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm text-slate-600">Zadzwoń teraz</p>
                    <a 
                      href="tel:+48555123456" 
                      className="text-red-600 hover:underline text-lg font-semibold block truncate"
                    >
                      +48 555 123 456
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <Envelope size={24} className="text-red-600 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm text-slate-600">Napisz do nas</p>
                    <a 
                      href="mailto:biuro@realestate.com" 
                      className="text-red-600 hover:underline block truncate"
                    >
                      biuro@realestate.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={20} />
                  Godziny pracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Pn - Pt</span>
                    <span className="font-medium">9:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Sobota</span>
                    <span className="font-medium">9:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niedziela</span>
                    <span className="text-red-500 font-medium">Zamknięte</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- NOWA SEKCJA BIUR NA DOLE --- */}
        <div>
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Nasze Biura</h2>
            <p className="text-muted-foreground">Odwiedź nas w jednej z naszych lokalizacji</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offices.map((office, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building size={24} className="text-red-600" />
                    {office.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-md">
                    <MapPin size={20} className="mt-1 text-red-600 shrink-0" />
                    <div>
                      <p className="font-medium">Adres:</p>
                      <p className="text-muted-foreground text-sm">{office.address}</p>
                      <p className="text-muted-foreground text-sm">{office.postalCode}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-red-600 shrink-0" />
                      <a href={`tel:${office.phone}`} className="hover:text-red-600 transition-colors text-sm">
                        {office.phone}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Envelope size={18} className="text-red-600 shrink-0" />
                      <a href={`mailto:${office.email}`} className="hover:text-red-600 transition-colors text-sm truncate">
                        {office.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={16} className="text-red-600 shrink-0" />
                      <span>{office.hours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ContactPage;