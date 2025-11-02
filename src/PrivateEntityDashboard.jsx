import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  Fade,
  Zoom,
  Chip,
  Avatar
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { useNavigate } from 'react-router-dom';
import api from './api/axios';
import logo from '/logo.png';

const monthlyData = [
  { month: 'JAN', value: 100 },
  { month: 'FEB', value: 150 },
  { month: 'MAR', value: 140 },
  { month: 'APR', value: 250 },
  { month: 'MAY', value: 280 },
  { month: 'JUN', value: 200 },
  { month: 'JUL', value: 220 },
  { month: 'AUG', value: 100 },
  { month: 'SEP', value: 180 },
  { month: 'OCT', value: 260 },
  { month: 'NOV', value: 300 },
  { month: 'DEC', value: 350 },
];

const PrivateEntityDashboard = () => {
  const navigate = useNavigate();
  const [totalPickupTrash, setTotalPickupTrash] = useState(0);
  const [totalCollectionPoints, setTotalCollectionPoints] = useState(0);
  const [topLocations, setTopLocations] = useState([]);
  const [status, setStatus] = useState('closed');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [barangays, setBarangays] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;
  const entityId = currentUser.entityId;

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const statsResponse = await api.get('/payments/dashboard/stats');
        setTotalPickupTrash(statsResponse.data.totalPickupTrashOrdered || 0);

        try {
          const collectionPointsResponse = await api.get('/pickup-locations');
          const locations = collectionPointsResponse.data.locations || [];
          setTotalCollectionPoints(locations.length);
        } catch (error) {
          setTotalCollectionPoints(0);
          console.error('Error fetching public collection points:', error);
        }

        const topRes = await api.get('/payments/top-barangays');
        setTopLocations(Array.isArray(topRes.data) ? topRes.data : []);

        try {
          const barangaysRes = await api.get('/barangays');
          setBarangays(Array.isArray(barangaysRes.data) ? barangaysRes.data : []);
        } catch (barangaysError) {
          console.error('Error fetching barangays:', barangaysError);
          setBarangays([]);
        }

        if (userId) {
          try {
            const entityResponse = await api.get(`/private-entities/${userId}`);
            if (entityResponse.data && entityResponse.data.entityStatus) {
              setStatus(entityResponse.data.entityStatus.toLowerCase());
            } else {
              setStatus('closed');
            }
          } catch (entityError) {
            console.error('Error fetching private entity status:', entityError);
            setStatus('closed');
          }
        } else {
            console.warn('User ID not found in user data.');
            setStatus('closed');
        }

      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, entityId]);

  const handleStatusChange = async (event) => {
    const newStatus = event.target.checked ? 'open' : 'closed';
    const previousStatus = status;
    setStatus(newStatus);
    setError('');

    if (!userId) {
      setError('User ID not found. Cannot update status.');
      setStatus(previousStatus);
      return;
    }

    try {
      await api.put(`/private-entities/${userId}`, { entityStatus: newStatus.toUpperCase() });
    } catch (err) {
      setError(`Failed to update status to ${newStatus}. Please try again.`);
      console.error('Status update error:', err);
      setStatus(previousStatus);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firestoreAuthToken');
    navigate('/', { replace: true });
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoToEditPin = () => {
    navigate('/private-dashboard/edit-pin');
  };

  const getBarangayName = (barangayId) => {
    const barangay = barangays.find(b => b.barangayId === barangayId);
    return barangay ? barangay.name : barangayId || 'Unknown';
  };

  const pieChartData = topLocations.map(loc => ({
    id: loc.barangayId,
    value: loc.count,
    label: getBarangayName(loc.barangayId),
  }));

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)',
          p: 3 
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 100,
            height: 100,
            mb: 4,
          }}
        >
          <CircularProgress 
            size={100} 
            thickness={3}
            sx={{ 
              color: '#4CAF50',
              position: 'absolute',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '40px',
              animation: 'bounce 2s ease-in-out infinite',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
                '50%': { transform: 'translate(-50%, -60%) scale(1.1)' },
              },
            }}
          >
            📊
          </Box>
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#2e7d32',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Loading Dashboard
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#5a7a5d',
            fontWeight: 500,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        >
          Please wait while we fetch your data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 30%, #E8F5E9 70%, #C8E6C9 100%)',
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: 'radial-gradient(circle at 50% 0%, rgba(76, 175, 80, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Enhanced Logo Section */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                bgcolor: 'white',
                borderRadius: 4,
                boxShadow: '0 12px 40px rgba(76, 175, 80, 0.2)',
                display: 'inline-block',
                border: '3px solid rgba(200, 230, 201, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)',
                },
              }}
            >
              <img 
                src={logo} 
                alt="GrabTrash Logo" 
                style={{
                  maxWidth: '220px',
                  height: 'auto',
                  display: 'block',
                  filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.2))',
                }}
              />
            </Paper>
          </Box>
        </Fade>
        
        {/* Enhanced Header Section */}
        <Zoom in timeout={700}>
          <Paper
            elevation={0}
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 3,
              mb: 4,
              p: 4,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)',
              border: '2px solid rgba(200, 230, 201, 0.5)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                }}
              >
                📊
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #2e7d32 0%, #4CAF50 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-1px',
                }}
              >
                Dashboard
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button 
                variant="contained"
                onClick={handleGoToProfile}
                sx={{
                  textTransform: 'none',
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4CAF50 0%, #388e3c 100%)',
                    boxShadow: '0 8px 28px rgba(76, 175, 80, 0.45)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box sx={{ fontSize: '20px' }}>👤</Box>
                Edit Profile
              </Button>
              <Button 
                variant="contained"
                onClick={handleGoToEditPin}
                sx={{
                  textTransform: 'none',
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
                  boxShadow: '0 6px 20px rgba(129, 199, 132, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
                    boxShadow: '0 8px 28px rgba(129, 199, 132, 0.45)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box sx={{ fontSize: '20px' }}>📍</Box>
                Edit Pin
              </Button>
              <Button 
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  textTransform: 'none',
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '15px',
                  borderColor: '#ef5350',
                  color: '#ef5350',
                  borderWidth: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#d32f2f',
                    bgcolor: 'rgba(239, 83, 80, 0.08)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box sx={{ fontSize: '20px' }}>🚪</Box>
                Logout
              </Button>
            </Stack>
          </Paper>
        </Zoom>

        {/* Enhanced Status Bar */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                borderRadius: 4,
                background: status === 'open' 
                  ? 'linear-gradient(135deg, rgba(200, 230, 201, 0.8) 0%, rgba(165, 214, 167, 0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 205, 210, 0.8) 0%, rgba(239, 154, 154, 0.6) 100%)',
                border: `3px solid ${status === 'open' ? '#4CAF50' : '#ef5350'}`,
                boxShadow: status === 'open' 
                  ? '0 12px 40px rgba(76, 175, 80, 0.25)'
                  : '0 12px 40px rgba(239, 83, 80, 0.25)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: status === 'open'
                    ? 'radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 20% 50%, rgba(239, 83, 80, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={status === 'open'}
                    onChange={handleStatusChange}
                    sx={{
                      width: 70,
                      height: 40,
                      padding: 0,
                      '& .MuiSwitch-switchBase': {
                        padding: 0,
                        margin: '4px',
                        transitionDuration: '300ms',
                        '&.Mui-checked': {
                          transform: 'translateX(30px)',
                          color: '#fff',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#4CAF50',
                            opacity: 1,
                            border: 0,
                          },
                        },
                      },
                      '& .MuiSwitch-thumb': {
                        boxSizing: 'border-box',
                        width: 32,
                        height: 32,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      },
                      '& .MuiSwitch-track': {
                        borderRadius: 20,
                        backgroundColor: '#ef5350',
                        opacity: 1,
                        transition: 'background-color 300ms',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: status === 'open' ? '#4CAF50' : '#ef5350',
                        boxShadow: `0 0 20px ${status === 'open' ? '#4CAF50' : '#ef5350'}`,
                        animation: 'pulse-glow 2s ease-in-out infinite',
                        '@keyframes pulse-glow': {
                          '0%, 100%': { 
                            boxShadow: `0 0 20px ${status === 'open' ? '#4CAF50' : '#ef5350'}`,
                            transform: 'scale(1)',
                          },
                          '50%': { 
                            boxShadow: `0 0 30px ${status === 'open' ? '#4CAF50' : '#ef5350'}`,
                            transform: 'scale(1.1)',
                          },
                        },
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: status === 'open' ? '#2e7d32' : '#c62828',
                          fontSize: '1.4rem',
                          letterSpacing: '0.5px',
                          lineHeight: 1.2,
                        }}
                      >
                        {status === 'open' ? 'Open for Delivery' : 'Not Available for Delivery'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: status === 'open' ? '#5a7a5d' : '#a94442',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {status === 'open' ? 'Accepting pickup requests' : 'Currently unavailable'}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Paper>
          </Box>
        </Fade>

        {error && (
          <Fade in>
            <Alert 
              severity="error"
              variant="filled"
              sx={{ 
                mb: 4,
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(211, 47, 47, 0.25)',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Stats Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, ml: 1 }}>
          <Box sx={{ fontSize: '28px' }}>📈</Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              color: '#2e7d32',
              letterSpacing: '-0.5px',
            }}
          >
            Overview
          </Typography>
        </Box>

        {/* Enhanced Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6}>
            <Zoom in timeout={600}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(200, 230, 201, 0.5)',
                  boxShadow: '0 12px 40px rgba(76, 175, 80, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 56px rgba(76, 175, 80, 0.25)',
                    borderColor: '#4CAF50',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        fontSize: '32px',
                        boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)',
                      }}
                    >
                      🗑️
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#5a7a5d',
                        fontWeight: 700,
                        fontSize: '16px',
                        letterSpacing: '0.3px',
                        lineHeight: 1.4,
                      }}
                    >
                      Total Pickup Trash Ordered
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #2e7d32 0%, #4CAF50 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-2px',
                    }}
                  >
                    {totalPickupTrash.toLocaleString()}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#81C784',
                      fontWeight: 700,
                      fontSize: '13px',
                      mt: 1,
                      display: 'block',
                    }}
                  >
                    All time total
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Zoom in timeout={800}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(200, 230, 201, 0.5)',
                  boxShadow: '0 12px 40px rgba(76, 175, 80, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 56px rgba(76, 175, 80, 0.25)',
                    borderColor: '#4CAF50',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'linear-gradient(90deg, #66BB6A 0%, #81C784 100%)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #66BB6A 0%, #81C784 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        fontSize: '32px',
                        boxShadow: '0 8px 20px rgba(102, 187, 106, 0.4)',
                      }}
                    >
                      📍
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#5a7a5d',
                        fontWeight: 700,
                        fontSize: '16px',
                        letterSpacing: '0.3px',
                        lineHeight: 1.4,
                      }}
                    >
                      Total Collection Points
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #2e7d32 0%, #4CAF50 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-2px',
                    }}
                  >
                    {totalCollectionPoints.toLocaleString()}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#81C784',
                      fontWeight: 700,
                      fontSize: '13px',
                      mt: 1,
                      display: 'block',
                    }}
                  >
                    Active locations
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Top Locations Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, ml: 1 }}>
          <Box sx={{ fontSize: '28px' }}>🏆</Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              color: '#2e7d32',
              letterSpacing: '-0.5px',
            }}
          >
            Top Locations
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Enhanced Top Locations List */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 5,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(200, 230, 201, 0.5)',
                  boxShadow: '0 12px 40px rgba(76, 175, 80, 0.15)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 3,
                      fontSize: '28px',
                      boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                    }}
                  >
                    📊
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      color: '#2e7d32',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Most Ordered Locations
                  </Typography>
                </Box>
                <Divider sx={{ mb: 4, borderColor: 'rgba(200, 230, 201, 0.5)' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {topLocations.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ fontSize: '64px', mb: 2, opacity: 0.5 }}>📦</Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#81C784',
                          fontWeight: 600,
                        }}
                      >
                        No data available yet
                      </Typography>
                    </Box>
                  )}
                  {topLocations.map((loc, idx) => (
                    <Box 
                      key={loc.barangayId || idx}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(249, 253, 249, 0.8) 0%, rgba(232, 245, 233, 0.4) 100%)',
                        border: '2px solid rgba(200, 230, 201, 0.5)',
                        position: 'relative',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(232, 245, 233, 0.9) 0%, rgba(200, 230, 201, 0.5) 100%)',
                          transform: 'translateX(12px)',
                          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
                          borderColor: '#4CAF50',
                        },
                        '&::before': {
                          content: `"${idx + 1}"`,
                          position: 'absolute',
                          top: -12,
                          left: 16,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: idx === 0 
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                            : idx === 1
                            ? 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)'
                            : idx === 2
                            ? 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)'
                            : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '14px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, mt: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            width: 56,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)',
                            borderRadius: 3,
                            mr: 3,
                            fontSize: '28px',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.25)',
                          }}
                        >
                          🚛
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#2e7d32',
                              fontWeight: 700,
                              fontSize: '18px',
                              letterSpacing: '0.2px',
                              mb: 0.5,
                            }}
                          >
                            {getBarangayName(loc.barangayId)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#5a7a5d',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            {loc.count} {loc.count === 1 ? 'pickup' : 'pickups'}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: '#2e7d32',
                            fontWeight: 800,
                            fontSize: '28px',
                          }}
                        >
                          {loc.count.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', height: 12, width: '100%', mb: 1 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            borderRadius: 6,
                            bgcolor: 'rgba(232, 245, 233, 0.8)',
                            border: '1px solid rgba(200, 230, 201, 0.5)',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${(loc.count / (topLocations[0]?.count || 1)) * 100}%`,
                            height: '100%',
                            borderRadius: 6,
                            background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%)',
                            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)',
                            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#81C784',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          {((loc.count / (topLocations[0]?.count || 1)) * 100).toFixed(1)}% of top location
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Fade>
          </Grid>
          
          {/* Enhanced Pie Chart */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1200}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 5,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(200, 230, 201, 0.5)',
                  boxShadow: '0 12px 40px rgba(76, 175, 80, 0.15)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, width: '100%' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #66BB6A 0%, #81C784 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 3,
                      fontSize: '28px',
                      boxShadow: '0 6px 16px rgba(102, 187, 106, 0.4)',
                    }}
                  >
                    📈
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      color: '#2e7d32',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Distribution
                  </Typography>
                </Box>
                <Divider sx={{ mb: 4, width: '100%', borderColor: 'rgba(200, 230, 201, 0.5)' }} />
                {topLocations.length > 0 ? (
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: pieChartData,
                          highlightScope: { faded: 'global', highlighted: 'item' },
                          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                          arcLabel: (item) => `${(item.value / totalPickupTrash * 100).toFixed(1)}%`,
                          outerRadius: 140,
                          innerRadius: 75,
                          paddingAngle: 3,
                          cornerRadius: 10,
                          startAngle: -90,
                          endAngle: 270,
                          cx: '50%',
                          cy: '50%',
                        },
                      ]}
                      colors={['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#2e7d32', '#43A047', '#388e3c']}
                      height={400}
                      margin={{ top: 10, bottom: 10, left: 10, right: 120 }}
                      slotProps={{
                        legend: {
                          direction: 'column',
                          position: { vertical: 'middle', horizontal: 'right' },
                          padding: 0,
                          itemMarkWidth: 14,
                          itemMarkHeight: 14,
                          markGap: 8,
                          itemGap: 10,
                          labelStyle: {
                            fontSize: 14,
                            fill: '#2e7d32',
                            fontWeight: 600,
                          },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Box 
                      sx={{ 
                        fontSize: '80px',
                        mb: 3,
                        opacity: 0.3,
                        animation: 'float 3s ease-in-out infinite',
                        '@keyframes float': {
                          '0%, 100%': { transform: 'translateY(0)' },
                          '50%': { transform: 'translateY(-20px)' },
                        },
                      }}
                    >
                      📊
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#81C784',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      No chart data available
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#A5D6A7',
                        fontWeight: 500,
                      }}
                    >
                      Data will appear once pickups are ordered
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PrivateEntityDashboard;