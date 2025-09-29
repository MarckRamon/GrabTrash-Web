import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Link,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import api from './api/axios';
import './AdminLogin.css';
import { styled } from '@mui/system';

// Styles for the container to center content
const CenteredContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
});

// Styles for the login form paper
const LoginFormPaper = styled(Box)({
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '400px',
  bgcolor: 'white', // Add a solid background color to make it opaque
});

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for existing token and user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user && user.role) {
      console.log('Existing token and user data found. Role:', user.role);
      // Redirect based on existing role
      if (user.role.toLowerCase() === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role.toLowerCase() === 'private_entity') {
        navigate('/private-dashboard', { replace: true });
      } else {
        // If role is something else or not recognized, clear and go to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('firestoreAuthToken'); // assuming you use this too
        console.log('Existing user data with unrecognized role. Cleared local storage.');
        // Stay on login page
      }
    } else if (token) {
         // If token exists but user data doesn't, something is wrong, clear storage
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         localStorage.removeItem('firestoreAuthToken');
         console.log('Existing token found without user data. Cleared local storage.');
    }
     else {
      console.log('No existing token or user data found. Staying on login page.');
      // Stay on login page
    }
  }, [navigate]); // Dependency array includes navigate

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/users/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      console.log('Login API response:', response.data);

      const { token } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store the token immediately
      localStorage.setItem('token', token);

      // Decode the token to get user information
      const decodedToken = decodeToken(token);

      if (!decodedToken) {
        throw new Error('Invalid token received');
      }

      // Extract role from decoded token
      const userRole = decodedToken.role;
      const normalizedRole = userRole ? userRole.toLowerCase().trim() : undefined;
      console.log('Decoded token:', decodedToken);
      console.log('Extracted userRole:', userRole);
      console.log('Normalized role:', normalizedRole);

      if (userRole) {
        if (normalizedRole.includes('admin') || normalizedRole === 'private_entity') {
          // Extract user info from the decoded token
          const userInfo = {
            userId: decodedToken.userId,
            firstName: decodedToken.firstName,
            lastName: decodedToken.lastName,
            email: decodedToken.email,
            role: userRole
          };

          // If firstName or lastName is missing, fetch the latest profile from backend
          if (!userInfo.firstName || !userInfo.lastName) {
            try {
              const profileResponse = await api.get(`/users/profile/${userInfo.userId}`);
              const profile = profileResponse.data;
              userInfo.firstName = profile.firstName || userInfo.firstName;
              userInfo.lastName = profile.lastName || userInfo.lastName;
              userInfo.email = profile.email || userInfo.email;
            } catch (e) {
              // If fetching profile fails, fallback to token info
              console.warn('Could not fetch full user profile, using token info.');
            }
          }

           // --- Start: Add entityId for private entities ---
           // Check if the response contains entityId and the user is a private entity
           if (normalizedRole === 'private_entity') {
               console.log('Private entity login response data:', response.data); // Log the response data
               if (response.data.entityId) {
                   userInfo.entityId = response.data.entityId; // Add entityId to the user object
               } else {
                   console.warn('Login response for private entity missing entityId.', response.data);
                   // Optionally set an error here if entityId is critical for private entities
                   // setError('Login successful, but entity data is incomplete.');
               }
           }
           // --- End: Add entityId for private entities ---

          localStorage.setItem('user', JSON.stringify(userInfo));
          localStorage.setItem('firestoreAuthToken', token);

          // Redirect based on role
          if (normalizedRole === 'private_entity') {
            // Removed the check for entityId in local storage here, as the check is now above
            console.log('Navigating private entity to /private-dashboard.');
            navigate('/private-dashboard', { replace: true });

          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          setError('Access denied. Only administrators or private entities are allowed to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('firestoreAuthToken');
        }
      } else {
        setError('Access denied. No role found in token.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('firestoreAuthToken');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Access denied. Please check your credentials and permissions.');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('firestoreAuthToken');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/loginbg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(70%)',
          zIndex: 0,
        }}
      />
      <Container
        maxWidth="xs"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 420,
            borderRadius: 5,
            bgcolor: 'white',
            border: '1.5px solid #e3e8ee',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            sx={{
              height: 80,
              mb: 2,
            }}
            alt="GrabTrash Logo"
            src="/loginlogo.jpg"
          />
          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 1.5,
              fontWeight: 'bold',
              letterSpacing: 1,
              color: '#2ecc40',
              textShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            Welcome Back!
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: '1rem',
              textAlign: 'center',
            }}
          >
            Please sign in to your account
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 1 }}>{error}</Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={handleChange}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#2ecc40',
                  },
                  '&:hover': {
                    color: '#2ecc40',
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#2ecc40',
                  },
                  '&:hover': {
                    color: '#2ecc40',
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: '#2ecc40',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#27ae38',
                },
                fontWeight: 'bold',
                fontSize: '1rem',
                letterSpacing: 1,
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Log in'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin; 