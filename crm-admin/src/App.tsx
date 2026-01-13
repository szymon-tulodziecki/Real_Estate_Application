import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useContext } from 'react';
import AuthContext from './contexts/AuthContext';
import SessionTimeoutNotification from './components/SessionTimeoutNotification';
import LoginPage from './pages/admin/LoginPage';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import ViewUser from './pages/admin/ViewUser';
import PropertiesManagement from './pages/admin/PropertiesManagement';
import CreateProperty from './pages/admin/CreateProperty';
import EditProperty from './pages/admin/EditProperty';
import ViewProperty from './pages/admin/ViewProperty';
import SessionsManagement from './pages/admin/SessionsManagement';
import ProtectedRoute from './components/ProtectedRoute';
// removed Outlet import
import './App.css';


// Komponent opakowujący całą aplikację, aby mieć dostęp do AuthContext
function AppWithSessionTimeout() {
  const { logout, user } = useContext(AuthContext);
  return (
    <>
      {user && <SessionTimeoutNotification onLogout={logout} />}
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Login Routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />

            {/* Admin Protected Area */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* Sessions Management - only for admins */}
              <Route path="sessions" element={
                <ProtectedRoute adminOnly>
                  <SessionsManagement />
                </ProtectedRoute>
              } />
              {/* User Management */}
              <Route path="users" element={<UsersManagement />} />
              <Route path="users/create" element={<CreateUser />} />
              <Route path="users/edit/:id" element={<EditUser />} />
              <Route path="users/view/:id" element={<ViewUser />} />
              {/* Property Management */}
              <Route path="properties" element={<PropertiesManagement />} />
              <Route path="properties/create" element={<CreateProperty />} />
              <Route path="properties/edit/:id" element={<EditProperty />} />
              <Route path="properties/view/:id" element={<ViewProperty />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppWithSessionTimeout />
    </AuthProvider>
  );
}

export default App;
