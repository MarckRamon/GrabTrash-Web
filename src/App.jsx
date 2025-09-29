import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import PrivateEntityDashboard from './PrivateEntityDashboard';
import EditPrivateEntityPin from './EditPrivateEntityPin';
import ForgotPassword from './ForgotPassword';
import SetNewPassword from './SetNewPassword';
import EditProfile from './EditProfile';
import Users from './Users';
import JobOrderRequest from './JobOrderRequest';
import CollectionPoints from './CollectionPoints';
import CollectionSchedule from './CollectionSchedule';
import Trucks from './Trucks';
import AuthSynchronizer from './components/AuthSynchronizer';
import './App.css';
import { Box } from '@mui/material';
import BarangayPage from './BarangayPage';

// Protected route component that checks authentication and role
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const location = useLocation();
  const userRole = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 Access denied: Authentication required for', location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return children ? children : <Outlet />;
};

// Role-based route component
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const userRole = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
  const location = useLocation();

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'private_entity') {
      // Already on private dashboard, do nothing to avoid loop
      if (location.pathname === '/private-dashboard') {
        return children;
      }
      return <Navigate to="/private-dashboard" replace />;
    } else if (userRole === 'admin') {
        // Already on admin dashboard, do nothing to avoid loop
        if (location.pathname === '/dashboard') {
            return children;
        }
      return <Navigate to="/dashboard" replace />;
    }
    // If role is not recognized or not allowed, redirect to login
    return <Navigate to="/" replace />;
  }

  // If role is allowed, render the children
  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  // Determine if current page is a public route
  const isPublicRoute = () => {
    const path = location.pathname;
    return path === '/' || 
           path === '/forgot-password' || 
           path === '/set-new-password';
  };

  // Initialize authentication on app start and after login
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      // If on a public route OR token/user data exists (meaning a login attempt happened or session persists)
      if (isPublicRoute() || (token && user)) {
        console.log('💡 App initializing: Public route or authentication data found.');
        // In a real app, you might validate the token here
        setIsInitialized(true);
      } else {
        console.log('⚠️ App initializing: No authentication data found, requires login.');
        setIsInitialized(true); // Still set initialized to true so routing can happen
      }
    };

    // Delay initialization slightly to allow AdminLogin to set local storage
    const timer = setTimeout(() => {
        initializeAuth();
    }, 100); // Small delay, adjust if needed

    return () => clearTimeout(timer);

  }, [location.pathname]); // Re-run if pathname changes

  if (!isInitialized) {
    // We can render a simple loading indicator or null here
    return null; // Or a loading spinner component
  }

  return (
    <>
      {/* Include the AuthSynchronizer component that runs in the background */}
      {/* Make sure AuthSynchronizer does not cause redirects or interfere with initial routing */}
      <AuthSynchronizer />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin routes */}
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/users" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Users />
            </RoleBasedRoute>
          } />
          <Route path="/collection-points" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <CollectionPoints />
            </RoleBasedRoute>
          } />
          <Route path="/schedule" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <CollectionSchedule />
            </RoleBasedRoute>
          } />
          <Route path="/trucks" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Trucks />
            </RoleBasedRoute>
          } />

          {/* Barangay Management Route */}
          <Route path="/barangays" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <BarangayPage />
            </RoleBasedRoute>
          } />

          {/* Private Entity routes */}
          <Route 
            path="/private-dashboard" 
            element={(
              <RoleBasedRoute allowedRoles={['private_entity']}>
                <PrivateEntityDashboard />
              </RoleBasedRoute>
            )}
          />
           {/* Nested route for editing private entity pin */}
           <Route path="/private-dashboard/edit-pin" element={(
               <RoleBasedRoute allowedRoles={['private_entity']}>
                 <EditPrivateEntityPin />
               </RoleBasedRoute>
           )} />

          {/* Shared routes */}
          <Route path="/profile" element={<EditProfile />} />
          <Route path="/job-orders" element={<JobOrderRequest />} />
        </Route>
        
        {/* Redirects for old /admin paths */}
        {/* These redirects should point to the new paths */}        
        <Route path="/admin/login" element={<Navigate to="/" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/forgot-password" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/admin/set-new-password" element={<Navigate to="/set-new-password" replace />} />
        <Route path="/admin/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/admin/users" element={<Navigate to="/users" replace />} />
        <Route path="/admin/job-orders" element={<Navigate to="/job-orders" replace />} />
        <Route path="/admin/collection-points" element={<Navigate to="/collection-points" replace />} />
        <Route path="/admin/schedule" element={<Navigate to="/schedule" replace />} />
        <Route path="/admin/trucks" element={<Navigate to="/trucks" replace />} />
        
        {/* Catch all route - redirect to login if not matched by other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Wrap the App with Router to use location in the App component
function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter; 