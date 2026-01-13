import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { 
  House, 
  Buildings, 
  Users, 
  Phone, 
  Info,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo
} from '@phosphor-icons/react';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

interface HeaderProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
}

export default function Header({ onNavigate, currentRoute }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Oferty', key: 'properties' as const, icon: Buildings },
    { label: 'O nas', key: 'about' as const, icon: Info },
    { label: 'Zespół', key: 'team' as const, icon: Users },
    { label: 'Kontakt', key: 'contact' as const, icon: Phone },
  ];

  const handleNavClick = (route: Route) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-3 transition-all duration-300"
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {/* UKŁAD: Mobile = Logo na środku, Desktop = Rozstrzelone */}
        <nav className="relative flex items-center justify-center md:justify-between h-10 md:h-auto">
          
          {/* --- LOGO (Zostawiam to ładniejsze w kafelku) --- */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 group focus:outline-none transition-transform active:scale-95"
          >
            <div className="bg-red-600 text-white p-1.5 rounded-lg shadow-md shadow-red-600/20 transition-transform duration-300 group-hover:scale-110">
              <House size={24} weight="fill" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-red-600 transition-colors">
              Real Estate CRM
            </span>
          </button>

          {/* --- DESKTOP NAVIGATION (Przywrócona PIERWOTNA wersja) --- */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className="text-base font-medium transition-all duration-300 ease-out relative py-3 px-4 rounded-lg focus:outline-none text-gray-700 hover:text-red-600 hover:scale-105 hover:font-semibold"
              >
                <span className={`${
                  currentRoute === item.key 
                    ? "border-b-2 border-red-600" 
                    : "hover:border-b-2 hover:border-red-600"
                } pb-1`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* --- DESKTOP CTA (Przywrócona PIERWOTNA wersja - wysokość py-3) --- */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+48555123456"
              className="flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-300 ease-out hover:scale-105 text-red-600 hover:text-red-700"
            >
              <Phone size={20} weight="bold" />
              <span className="font-bold text-base">+48 555 123 456</span>
            </a>
          </div>

          {/* --- MOBILE BURGER (Absolutnie po prawej) --- */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 text-gray-900 hover:text-red-600 hover:bg-red-50"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </SheetTrigger>
            
            {/* --- MOBILE MENU CONTENT (To "profesjonalne" z ikonami) --- */}
            <SheetContent side="right" className="w-[85vw] sm:w-[380px] p-0 border-l border-gray-100">
              <div className="sr-only">
                <SheetTitle>Menu nawigacyjne</SheetTitle>
                <SheetDescription>Główne menu nawigacji mobilnej</SheetDescription>
              </div>

              <div className="flex flex-col h-full bg-white">
                {/* Mobile Header Inside Menu */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-600/20">
                      <House size={28} weight="fill" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-none">Real Estate CRM</h2>
                      <p className="text-xs text-gray-500 mt-1">Twój partner w nieruchomościach</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleNavClick('home')}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                        currentRoute === 'home' 
                          ? 'bg-red-50 text-red-700 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <House size={24} weight={currentRoute === 'home' ? 'fill' : 'regular'} className={currentRoute === 'home' ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'} />
                      <span className="text-base">Strona główna</span>
                    </button>

                    {navItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleNavClick(item.key)}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                          currentRoute === item.key
                            ? 'bg-red-50 text-red-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon size={24} weight={currentRoute === item.key ? 'fill' : 'regular'} className={currentRoute === item.key ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'} />
                        <span className="text-base">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Footer (Contact Card) */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 text-center">
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Infolinia 24/7</p>
                    <a
                      href="tel:+48555123456"
                      className="flex items-center justify-center gap-2 text-red-600 font-bold text-lg hover:text-red-700 transition-colors"
                    >
                      <Phone size={24} weight="fill" />
                      +48 555 123 456
                    </a>
                  </div>

                  <div className="flex justify-center gap-6 text-gray-400">
                    <a href="#" className="hover:text-blue-600 transition-colors bg-white p-2.5 rounded-full shadow-sm hover:shadow-md border border-gray-100">
                      <FacebookLogo size={22} weight="fill" />
                    </a>
                    <a href="#" className="hover:text-pink-600 transition-colors bg-white p-2.5 rounded-full shadow-sm hover:shadow-md border border-gray-100">
                      <InstagramLogo size={22} weight="fill" />
                    </a>
                    <a href="#" className="hover:text-blue-700 transition-colors bg-white p-2.5 rounded-full shadow-sm hover:shadow-md border border-gray-100">
                      <LinkedinLogo size={22} weight="fill" />
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}