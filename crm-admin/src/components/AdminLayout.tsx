import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Crown,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('admin_sidebar_collapsed') === '1'; } catch { /* ignore */ return false; }
  });
  const location = useLocation();

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

    // Różne tytuły dla różnych ról
  const panelTitle = user && user.role === 'root'
    ? 'Administrator Systemu' 
    : isAdmin() 
      ? 'Panel Administratora' 
      : 'Panel Agenta';

  // Główne elementy nawigacji
  const mainNavigation = [
    // Dashboard dostępny dla wszystkich zalogowanych
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Nieruchomości', href: '/admin/properties', icon: Building },
    // Opcja "Użytkownicy" dostępna tylko dla administratorów
    ...(isAdmin() ? [{ name: 'Użytkownicy', href: '/admin/users', icon: Users }] : []),
    // Opcja "Aktywne Sesje" dostępna tylko dla administratorów
    ...(isAdmin() ? [{ name: 'Aktywne Sesje', href: '/admin/sessions', icon: Monitor }] : []),
  ];

  // Sekcja profilu - dostępna tylko dla agentów
  const profileNavigation = (user && !isAdmin()) ? [
    { name: 'Mój profil', href: `/admin/users/edit/${user._id}`, icon: UserCog }
  ] : [];

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-white">{panelTitle}</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Główne elementy nawigacji */}
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Separator */}
            {profileNavigation.length > 0 && (
              <div className="border-t border-gray-700 my-4"></div>
            )}

            {/* Sekcja profilu */}
            {profileNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex ${collapsed ? 'lg:w-20' : 'lg:w-64'} lg:flex-col transition-[width] duration-200`}>
        <div className="relative flex flex-col flex-grow bg-gray-800 border-r border-gray-700">
          {/* Nagłówek z tytułem */}
          <div className="px-4 py-3">
            <h1 className={`text-xl font-bold text-white ${collapsed ? 'opacity-0 pointer-events-none select-none' : 'truncate'}`}>{panelTitle}</h1>
          </div>

          {/* Nawigacja ukryta, gdy zwinięte */}
          {!collapsed && (
            <nav className="flex-1 space-y-1 px-2 py-4">
              {/* Główne elementy nawigacji */}
              {mainNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Separator */}
              {profileNavigation.length > 0 && (
                <div className="border-t border-gray-700 my-4"></div>
              )}

              {/* Sekcja profilu */}
              {profileNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Nawigacja dla zwinniętego sidebar - tylko ikony */}
          {collapsed && (
            <nav className="flex-1 space-y-1 px-2 py-4">
              {/* Główne elementy nawigacji */}
              {mainNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={item.name}
                    className={`group flex items-center justify-center p-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                );
              })}

              {/* Separator */}
              {profileNavigation.length > 0 && (
                <div className="border-t border-gray-700 my-4 mx-2"></div>
              )}

              {/* Sekcja profilu */}
              {profileNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={item.name}
                    className={`group flex items-center justify-center p-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Sekcja użytkownika ukryta, gdy zwinięte */}
          {!collapsed && (
            <div className={`border-t border-gray-700 p-4`}>
              <div className={`flex items-center`}>
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user && user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white">
                      {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Użytkownik'}
                    </p>
                    {/* Korona dla Super Admina */}
                    {user && user.role === 'root' && (
                      <Crown className="w-4 h-4 text-yellow-400" aria-label="Super Administrator" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{user ? `ID: ${user.employeeId}` : ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Wyloguj
              </button>
            </div>
          )}

          {/* Centralny przycisk zwijania/rozwijania na krawędzi paska */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-50">
            <button
              onClick={toggleCollapsed}
              className="rounded-full border border-gray-600 bg-gray-800 shadow p-1 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={collapsed ? 'Rozwiń panel' : 'Zwiń panel'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={collapsed ? 'lg:pl-20' : 'lg:pl-64'}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-400 bg-gray-200 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-400" />
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-800">
                  Witaj, {user && user.firstName ? user.firstName : 'Użytkowniku'}
                  <span className="text-xs text-gray-600 ml-2">
                    ({isAdmin() ? 'Administrator' : 'Agent'})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;