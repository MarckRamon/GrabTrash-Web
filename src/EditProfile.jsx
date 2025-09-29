import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
// import AdminLayout from './components/AdminLayout'; // Remove AdminLayout import
import api from './api/axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Get user data from localStorage as fallback
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Attempt to fetch the latest profile data from the backend
        try {
          const profileResponse = await api.get(`/users/profile/${userData.userId}`);
          const latestProfile = profileResponse.data;
          setFormData({
            firstName: latestProfile.firstName || userData.firstName || '',
            lastName: latestProfile.lastName || userData.lastName || '',
            email: latestProfile.email || userData.email || '',
          });
        } catch (fetchError) {
          console.error('Error fetching latest profile data:', fetchError);
          // If fetching fails, use data from localStorage
           setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
          });
          setSnackbar({
            open: true,
            message: 'Could not fetch latest profile data. Using local data.',
            severity: 'warning',
          });
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading profile data',
          severity: 'error',
        });
         // If token is invalid or missing, redirect to login
         if (error.response?.status === 401 || error.response?.status === 403) {
             navigate('/');
         }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firestoreAuthToken'); // Assuming this is used
    navigate('/', { replace: true });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Get the current user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.userId;

      if (!userId) {
        throw new Error('User ID not found');
      }

      // Update user profile in the backend
      const response = await api.put(`/users/profile/${userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email // Always send email to prevent it from becoming null
      });

      if (response.data) {
        // Update local storage with new data
        const updatedUserData = {
          ...userData,
          firstName: formData.firstName,
          lastName: formData.lastName,
          // Keep original email from localStorage if not updated by backend
          email: userData.email,
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        // Optional: Dispatch a custom event if other components need to react to profile updates
        // const event = new CustomEvent('profileUpdated', {
        //   detail: {
        //     firstName: formData.firstName,
        //     lastName: formData.lastName,
        //     email: userData.email,
        //   }
        // });
        // window.dispatchEvent(event);

        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating profile',
        severity: 'error',
      });
       // If token is invalid or missing, redirect to login
         if (error.response?.status === 401 || error.response?.status === 403) {
             navigate('/');
         }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 480,
        bgcolor: 'white',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(30,41,59,0.10)',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 24,
            left: 24,
            color: '#4CAF50',
            fontWeight: 600,
            bgcolor: 'transparent',
            '&:hover': { bgcolor: '#f1f5f9', color: '#388e3c' },
            textTransform: 'none',
          }}
        >
          Back
        </Button>
        {/* Header with Avatar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
          <AccountCircleIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            Edit Profile
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 16 }}>
            Update your personal information
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              First Name
            </Typography>
            <TextField
              fullWidth
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              variant="outlined"
              size="medium"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              Last Name
            </Typography>
            <TextField
              fullWidth
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              variant="outlined"
              size="medium"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              value={formData.email}
              variant="outlined"
              size="medium"
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: '#f1f5f9', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#388e3c' },
                textTransform: 'none',
                px: 4,
                py: 1.5,
                mt: 2,
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(76,175,80,0.08)'
              }}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { 
                  borderColor: '#dc2626',
                  bgcolor: '#fee2e2',
                },
                textTransform: 'none',
                px: 4,
                py: 1.5,
                mt: 1,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
              }}
              fullWidth
            >
              Logout
            </Button>
          </Grid>
        </Grid>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default EditProfile;