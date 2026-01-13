import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Header from './components/Header';
import HomePage from './components/pages/HomePage';
import PropertiesPage from './components/pages/PropertiesPage';
import PropertyDetailPage from './components/pages/PropertyDetailPage';
import AboutPage from './components/pages/AboutPage';
import TeamPage from './components/pages/TeamPage';
import ContactPage from './components/pages/ContactPage';
import Footer from './components/Footer';
import { SearchFilters } from './lib/types';
import { parseSearchParams } from './lib/utils';

type Route = 'home' | 'properties' | 'property-detail' | 'about' | 'team' | 'contact';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Handle URL changes and deep linking
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      
      if (path === '/' || path === '/home') {
        setCurrentRoute('home');
      } else if (path === '/nieruchomosci' || path.startsWith('/properties')) {
        setCurrentRoute('properties');
        // Parse search filters from URL
        if (search) {
          const params = new URLSearchParams(search);
          const filters = parseSearchParams(params);
          setSearchFilters(filters);
        }
      } else if (path.startsWith('/nieruchomosc/') || path.startsWith('/property/')) {
        setCurrentRoute('property-detail');
        const propertyId = path.split('/').pop();
        if (propertyId) {
          setSelectedPropertyId(propertyId);
        }
      } else if (path === '/o-nas' || path === '/about') {
        setCurrentRoute('about');
      } else if (path === '/zespol' || path === '/team') {
        setCurrentRoute('team');
      } else if (path === '/kontakt' || path === '/contact') {
        setCurrentRoute('contact');
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const navigate = (route: Route, options?: { 
    propertyId?: string; 
    filters?: SearchFilters;
    replaceState?: boolean;
  }) => {
    let url = '/';
    
    switch (route) {
      case 'home':
        url = '/';
        break;
      case 'properties':
        url = '/nieruchomosci';
        if (options?.filters) {
          const params = new URLSearchParams();
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value) && value.length > 0) {
                params.set(key, value.join(','));
              } else if (!Array.isArray(value)) {
                params.set(key, String(value));
              }
            }
          });
          if (params.toString()) {
            url += `?${params.toString()}`;
          }
        }
        break;
      case 'property-detail':
        if (options?.propertyId) {
          url = `/nieruchomosc/${options.propertyId}`;
        }
        break;
      case 'about':
        url = '/o-nas';
        break;
      case 'team':
        url = '/zespol';
        break;
      case 'contact':
        url = '/kontakt';
        break;
    }
    
    if (options?.replaceState) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    
    setCurrentRoute(route);
    window.scrollTo(0, 0);
    if (options?.propertyId) {
      setSelectedPropertyId(options.propertyId);
    }
    if (options?.filters) {
      setSearchFilters(options.filters);
    }
  };

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <HomePage 
            onNavigate={navigate}
          />
        );
      case 'properties':
        return (
          <PropertiesPage 
            onNavigate={navigate}
            initialFilters={searchFilters}
          />
        );
      case 'property-detail':
        return (
          <PropertyDetailPage 
            propertyId={selectedPropertyId}
            onNavigate={navigate}
          />
        );
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      case 'team':
        return <TeamPage onNavigate={navigate} />;
      case 'contact':
        return <ContactPage />;
      default:
        return (
          <HomePage 
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentRoute={currentRoute} onNavigate={navigate} />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={navigate} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'font-medium',
        }}
      />
    </div>
  );
}

export default App;