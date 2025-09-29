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
  Stack
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { useNavigate } from 'react-router-dom';
import api from './api/axios';
import logo from '/logo.png'; // Assuming your logo is in the public folder

// Mock data for the chart
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
  const [status, setStatus] = useState('closed'); // Default to closed
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [barangays, setBarangays] = useState([]); // Add state for barangays

  // Get current user ID and entity ID
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;
  const entityId = currentUser.entityId; // Assuming entityId is stored in user object

  // Fetch dashboard data and initial status
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

        // Fetch stats relevant to private entity
        const statsResponse = await api.get('/payments/dashboard/stats');
        setTotalPickupTrash(statsResponse.data.totalPickupTrashOrdered || 0);

        // Fetch collection points
        try {
          const collectionPointsResponse = await api.get('/pickup-locations');
          const locations = collectionPointsResponse.data.locations || [];
          setTotalCollectionPoints(locations.length);
        } catch (error) {
          setTotalCollectionPoints(0);
          console.error('Error fetching public collection points:', error);
        }

        // Fetch top locations
        const topRes = await api.get('/payments/top-barangays');
        setTopLocations(Array.isArray(topRes.data) ? topRes.data : []);

        // Fetch all barangays
        try {
          const barangaysRes = await api.get('/barangays'); // Assuming this endpoint exists
          setBarangays(Array.isArray(barangaysRes.data) ? barangaysRes.data : []);
        } catch (barangaysError) {
          console.error('Error fetching barangays:', barangaysError);
          setBarangays([]); // Default to empty array on error
        }

        // Fetch initial private entity status
        if (userId) {
          try {
            const entityResponse = await api.get(`/private-entities/${userId}`);
            if (entityResponse.data && entityResponse.data.entityStatus) {
              setStatus(entityResponse.data.entityStatus.toLowerCase());
            } else {
              // If no entity found or status missing, assume default status
              setStatus('closed');
            }
          } catch (entityError) {
            console.error('Error fetching private entity status:', entityError);
            // If fetching entity fails, default to closed status
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
  }, [userId, entityId]); // Depend on userId and entityId

  // Handle status toggle
  const handleStatusChange = async (event) => {
    const newStatus = event.target.checked ? 'open' : 'closed';
    const previousStatus = status; // Store previous status in case of API error
    setStatus(newStatus); // Optimistically update status
    setError(''); // Clear previous errors

    if (!userId) {
      setError('User ID not found. Cannot update status.');
      setStatus(previousStatus); // Revert status
      return;
    }

    try {
      // Send status to backend using userId instead of entityId
      await api.put(`/private-entities/${userId}`, { entityStatus: newStatus.toUpperCase() });
    } catch (err) {
      setError(`Failed to update status to ${newStatus}. Please try again.`);
      console.error('Status update error:', err);
      setStatus(previousStatus); // Revert status on error
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firestoreAuthToken'); // Assuming you use this too
    navigate('/', { replace: true }); // Redirect to login page and clear history
  };

  // Handle navigate to profile
  const handleGoToProfile = () => {
    navigate('/profile');
  };

  // Handle navigate to edit pin page
  const handleGoToEditPin = () => {
    // Navigate to the new edit pin page
    // We don't need to pass entityId in the route if we fetch it from local storage in the new page
    navigate('/private-dashboard/edit-pin');
  };

  // Helper to find barangay name by ID
  const getBarangayName = (barangayId) => {
    const barangay = barangays.find(b => b.barangayId === barangayId);
    return barangay ? barangay.name : barangayId || 'Unknown';
  };

  // Prepare data for Pie Chart
  const pieChartData = topLocations.map(loc => ({
    id: loc.barangayId,
    value: loc.count,
    label: getBarangayName(loc.barangayId),
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{
        p: 3,
        bgcolor: '#f8f9fa',
        width: '100%', // Take full width of parent
        overflowY: 'auto', // Enable vertical scrolling
        boxSizing: 'border-box', // Include padding in width/height
      }}
    >
      {/* Inner Box for Centering Content */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}> {/* Centered content within the scrollable box */}
        {/* Add the logo here */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <img 
            src={logo} 
            alt="GrabTrash Logo" 
            style={{
              maxWidth: '200px', // Adjust size as needed
              height: 'auto',
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
            Private Entity Dashboard
          </Typography>
          <Stack direction="row" spacing={2}> {/* Use Stack for buttons */}
               <Button 
                  variant="outlined" 
                  onClick={handleGoToProfile}
                  sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': {
                          bgcolor: '#E8F5E9',
                          borderColor: '#43A047',
                      }
                  }}
               >
                  Edit Profile
              </Button>
              {/* Add Edit Pin button */}
               <Button 
                  variant="outlined" 
                  onClick={handleGoToEditPin}
                  sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderColor: '#1976d2', // Using a blue color for this button
                      color: '#1976d2',
                      '&:hover': {
                          bgcolor: '#e3f2fd',
                          borderColor: '#1565c0',
                      }
                  }}
               >
                  Edit Pin
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleLogout}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                }}
              >
                Logout
              </Button>
          </Stack>
        </Box>

        {/* Status Bar */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', bgcolor: status === 'open' ? '#E8F5E9' : '#FFEBEE' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={status === 'open'}
                  onChange={handleStatusChange}
                  color="success"
                />
              }
              label={status === 'open' ? 'Open for Delivery' : 'Not Available for Delivery'}
              sx={{
                '.MuiTypography-root': {
                  fontWeight: 600,
                  color: status === 'open' ? '#388e3c' : '#d32f2f',
                  fontSize: '1.1rem',
                },
              }}
            />
          </Paper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {/* Stats Section Header */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
          Overview
        </Typography>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
                Total Pickup Trash Ordered
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                {totalPickupTrash.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
                Total Collection Points
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                {totalCollectionPoints.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Top Locations Section Header and Content */}
         <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
          Top Most Ordered Locations
        </Typography>

        <Grid container spacing={3}> {/* Use Grid to layout list and pie chart */}
          {/* Top Most Ordered Location Pickup List */}
          <Grid item xs={12} md={6}> {/* Takes 6 columns on medium and up screens */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                bgcolor: 'white',
                height: '100%', // Ensure equal height if needed
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
                Top Most Ordered Location Pickup
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {topLocations.length === 0 && (
                  <Typography color="text.secondary">No data available.</Typography>
                )}
                {topLocations.map((loc, idx) => (
                  <Box key={loc.barangayId || idx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        component="span"
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f1f5f9',
                          borderRadius: 1,
                          mr: 2,
                          fontSize: '24px'
                        }}
                      >
                        🚛
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#333', 
                          fontWeight: 500,
                          fontSize: '16px',
                        }}
                      >
                        {getBarangayName(loc.barangayId)}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', height: 8, width: '100%', mb: 1 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          borderRadius: 4,
                          bgcolor: '#E8F5E9',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: `${(loc.count / (topLocations[0]?.count || 1)) * 100}%`, // Ensure denominator is not zero
                          height: '100%',
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #4CAF50 0%, #43A047 100%)',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#333', 
                          fontWeight: 500,
                          fontSize: '16px',
                        }}
                      >
                        {loc.count.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          {/* Pie Chart for Top Locations */}
          <Grid item xs={12} md={6}> {/* Takes 6 columns on medium and up screens */}
             <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                bgcolor: 'white',
                height: '100%', // Ensure equal height if needed
                display: 'flex', // Use flex to center chart vertically
                flexDirection: 'column',
                alignItems: 'center', // Center chart horizontally
                justifyContent: 'center', // Center chart vertically
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                Location Distribution
              </Typography>
              {topLocations.length > 0 ? (
                 <Box sx={{ width: '100%', height: 300 }}> {/* Container for the Pie Chart */}
                   <PieChart
                     series={[
                       {
                         data: pieChartData,
                         highlightScope: { faded: 'global', highlighted: 'item' },
                         faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                         arcLabel: (item) => `(${(item.value / totalPickupTrash * 100).toFixed(1)}%)`, // Display percentage
                         outerRadius: 120,
                         innerRadius: 60,
                         paddingAngle: 5,
                         cornerRadius: 5,
                         startAngle: -90,
                         endAngle: 180,
                       },
                     ]}
                     height={300}
                     margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                     // Optional: Add legend
                     legend={{ hidden: false, direction: 'column', position: { vertical: 'top', horizontal: 'right' } }}
                   />
                 </Box>
              ) : (
                <Typography color="text.secondary">No data available for chart.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PrivateEntityDashboard; 