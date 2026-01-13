import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from '../components/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from './admin/LoginPage';
import Dashboard from './admin/Dashboard';
import PropertiesManagement from './admin/PropertiesManagement';
import UsersManagement from './admin/UsersManagement';
import CreateProperty from './admin/CreateProperty';
import EditProperty from './admin/EditProperty';
import ViewProperty from './admin/ViewProperty';
import CreateUser from './admin/CreateUser';
import EditUser from './admin/EditUser';
import ViewUser from './admin/ViewUser';

const AdminPanel = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/*" element={<AdminLayout />}>
        <Route 
          index 
          element={
            <Navigate 
              to="dashboard" 
              replace 
            />
          } 
        />
        
        {/* Dashboard - dostępne dla wszystkich zalogowanych */}
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        
        {/* Properties Routes - dostępne dla wszystkich zalogowanych */}
        <Route path="properties" element={<PropertiesManagement />} />
        <Route path="properties/create" element={<CreateProperty />} />
        <Route path="properties/:id" element={<ViewProperty />} />
        <Route path="properties/:id/edit" element={<EditProperty />} />
        
        {/* Users Routes - tylko dla administratorów */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute adminOnly>
              <UsersManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/create" 
          element={
            <ProtectedRoute adminOnly>
              <CreateUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/:id" 
          element={
            <ProtectedRoute adminOnly>
              <ViewUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users/:id/edit" 
          element={<EditUser />} 
        />
      </Route>
    </Routes>
  );
};

export default AdminPanel; 