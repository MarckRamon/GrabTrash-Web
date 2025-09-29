import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  LocationOn,
  CalendarToday,
  Person,
  Assignment,
  LocalShipping,
  Home,
} from '@mui/icons-material';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [role, setRole] = useState(null);

  // Determine user role for menu filtering
  const isPrivateEntity = role === 'private_entity';

  // Function to check if menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Menu item styles
  const getMenuItemStyles = (path) => ({
    display: 'flex',
    alignItems: 'center',
    p: 1.5,
    borderRadius: 1,
    mb: 1,
    cursor: 'pointer',
    bgcolor: isActive(path) ? '#e6f4ea' : 'transparent',
    transition: 'all 0.2s ease-in-out',
    transform: 'translateX(0)',
    '&:hover': { 
      bgcolor: isActive(path) ? '#e6f4ea' : '#f1f5f9',
      transform: 'translateX(8px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
  });

  // Icon styles
  const getIconStyles = (path) => ({
    color: isActive(path) ? '#4CAF50' : '#475569',
    mr: 2
  });

  // Text styles
  const getTextStyles = (path) => ({
    color: isActive(path) ? '#4CAF50' : '#475569',
    fontSize: '16px',
    fontWeight: isActive(path) ? 600 : 400,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  });

  useEffect(() => {
    const fetchUserProfile = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUserProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const handleProfileUpdate = (event) => {
      setUserProfile(event.detail);
    };

    // Initial profile fetch
    fetchUserProfile();

    // Listen for profile updates
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [navigate]);

  useEffect(() => {
    const userRole = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    setRole(userRole);
  }, []);

  if (!role) return null;

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        bgcolor: '#f8f9fa',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: '240px',
          minWidth: '240px',
          bgcolor: 'white',
          borderRight: '1px solid #e5e7eb',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          zIndex: 1,
        }}
      >
        <Box sx={{ mb: 4, px: 1.5 }}>
          <img 
            src="/logo.png" 
            alt="GrabTrash Logo"
            style={{ height: 40, objectFit: 'contain' }}
          />
        </Box>

        {/* Services Section */}
        <Typography
          sx={{
            px: 1.5,
            py: 1,
            color: '#64748B',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Services
        </Typography>

        {/* Always show Dashboard */}
        <Box
          sx={getMenuItemStyles('/dashboard')}
          onClick={() => navigate('/dashboard')}
        >
          <TrendingUp sx={getIconStyles('/dashboard')} />
          <Typography sx={getTextStyles('/dashboard')}>
            Dashboard
          </Typography>
        </Box>

        {/* Job Order Request */}
        <Box
          sx={getMenuItemStyles('/job-orders')}
          onClick={() => navigate('/job-orders')}
        >
          <Assignment sx={getIconStyles('/job-orders')} />
          <Typography sx={getTextStyles('/job-orders')}>
            Job Order Request
          </Typography>
        </Box>

        {/* Only show these if NOT private_entity */}
        {!isPrivateEntity && (
          <>
            <Box
              sx={getMenuItemStyles('/collection-points')}
              onClick={() => navigate('/collection-points')}
            >
              <LocationOn sx={getIconStyles('/collection-points')} />
              <Typography sx={getTextStyles('/collection-points')}>
                Collection Points
              </Typography>
            </Box>

            <Box
              sx={getMenuItemStyles('/schedule')}
              onClick={() => navigate('/schedule')}
            >
              <CalendarToday sx={getIconStyles('/schedule')} />
              <Typography sx={getTextStyles('/schedule')}>
                Collection Schedule
              </Typography>
            </Box>
          </>
        )}

        {/* Management Section */}
        <Typography
          sx={{
            px: 1.5,
            py: 1,
            mt: 2,
            color: '#64748B',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Management
        </Typography>

        {/* Barangays */}
        {!isPrivateEntity && (
          <Box
            sx={getMenuItemStyles('/barangays')}
            onClick={() => navigate('/barangays')}
          >
            <Home sx={getIconStyles('/barangays')} />
            <Typography sx={{ ...getTextStyles('/barangays'), fontSize: '16px' }}>
              Barangays
            </Typography>
          </Box>
        )}

        {/* Trucks */}
        <Box
          sx={getMenuItemStyles('/trucks')}
          onClick={() => navigate('/trucks')}
        >
          <LocalShipping sx={getIconStyles('/trucks')} />
          <Typography sx={getTextStyles('/trucks')}>
            Trucks
          </Typography>
        </Box>

        {/* Users */}
        {!isPrivateEntity && (
          <Box
            sx={getMenuItemStyles('/users')}
            onClick={() => navigate('/users')}
          >
            <Person sx={getIconStyles('/users')} />
            <Typography sx={getTextStyles('/users')}>
              Users
            </Typography>
          </Box>
        )}

        {/* User Profile */}
        <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 1.5,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#f3f4f6',
                borderRadius: 1,
              },
              ...(isActive('/profile') && {
                bgcolor: '#e6f4ea',
                '&:hover': {
                  bgcolor: '#e6f4ea',
                },
              }),
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar 
              src="/migz.jpg"
              sx={{ 
                width: 40, 
                height: 40,
                mr: 2
              }}
            />
            <Box>
              <Typography 
                sx={{ 
                  color: isActive('/profile') ? '#4CAF50' : '#333',
                  fontSize: '14px',
                  fontWeight: isActive('/profile') ? 600 : 500,
                  lineHeight: 1.2
                }}
              >
                {userProfile.firstName && userProfile.lastName 
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : 'User Profile'}
              </Typography>
              <Typography 
                sx={{ 
                  color: '#64748B',
                  fontSize: '12px',
                  lineHeight: 1.2
                }}
              >
                {userProfile.email || 'No email set'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box 
        component="main"
        sx={{ 
          flexGrow: 1,
          p: 3,
          bgcolor: '#f8f9fa',
          minHeight: '100vh',
          marginLeft: '240px',
          width: 'calc(100vw - 240px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout; 