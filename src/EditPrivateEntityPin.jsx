import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  Button, 
  TextField, 
  MenuItem,
  Paper,
  Card,
  CardContent,
  Divider,
  Fade,
  Zoom,
  Chip,
  Stack
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CollectionPoints.css'; // Reuse map styles
import L from 'leaflet';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Hook to handle marker drag events
function DraggableMarkerEvents({ onDragEnd }) {
  const markerRef = React.useRef(null);
  const map = L.useMap(); // Access the map instance if needed

  React.useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.on('dragend', (event) => {
        const position = marker.getLatLng();
        onDragEnd(position);
      });
    }

    // Cleanup event listener
    return () => {
      if (marker) {
        marker.off('dragend');
      }
    };
  }, [onDragEnd]);

  return null; // This component doesn't render anything itself
}

// Custom Hook to handle map click events for placing marker
function MapClickEvent({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng); // Pass the clicked latlng to the handler
        },
    });
    return null; // This component doesn't render anything itself
}

const EditPrivateEntityPin = () => {
  const navigate = useNavigate();
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markerPosition, setMarkerPosition] = useState(null);
  const [formData, setFormData] = useState({
      entityName: '',
      entityWasteType: '',
      address: '',
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get entity ID and User ID from local storage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId; 
  const entityId = currentUser.entityId; // Still keep entityId in case it's needed elsewhere or for specific backend endpoints

  useEffect(() => {
    // Redirect if userId is not available (was checking for entityId before)
    if (!userId) {
      setError('User ID not found. Cannot edit pin.');
      setLoading(false);
      // Maybe redirect back to dashboard or login
      navigate('/private-dashboard', { replace: true });
      return;
    }

    const fetchEntityData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/private-entities/${userId}`);

        console.log('Fetched entity data:', response.data);

        if (response.data) {
          setEntityData(response.data);
          // Populate form data with fetched entity data, defaulting to '' if null
          setFormData({
              entityName: response.data.entityName || '',
              entityWasteType: response.data.entityWasteType 
                                 ? response.data.entityWasteType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) 
                                 : '',
              address: response.data.address || '',
          });
          // Set initial marker position from fetched data, default to 0 if missing
          if (response.data.latitude && response.data.longitude) {
            setMarkerPosition({ lat: parseFloat(response.data.latitude), lng: parseFloat(response.data.longitude) });
          } else {
              setError('Entity location data missing. Please reposition the pin.');
              setMarkerPosition({ lat: 10.2447, lng: 123.8505 }); // Default center
          }
        } else {
          setError('Failed to fetch entity data.');
        }
      } catch (err) {
        setError('Error fetching entity data.');
        console.error('Fetch entity data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntityData();

  }, [entityId, navigate]); // Depend on entityId and navigate

   const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Handle form field changes
  const handleInputChange = (event) => {
      const { name, value } = event.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle marker drag end
  const handleMarkerDragEnd = async (position) => {
    console.log('Marker dragged to:', position);
    setMarkerPosition(position); // Update marker position state

    // Implement reverse geocoding to get address
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
        );
        const data = await response.json();
        const address = data.display_name || 'Address not found';
        setFormData(prev => ({ ...prev, address })); // Update address in form data
        showNotification('Address updated from pin location.', 'info');
    } catch (error) {
        console.error('Error fetching address on drag:', error);
        setFormData(prev => ({ ...prev, address: 'Address not found' }));
        showNotification('Could not fetch address for new location.', 'warning');
    }
  };

  // Handle map click to set marker position
  const handleMapClick = async (position) => {
    console.log('Map clicked at:', position);
    setMarkerPosition(position); // Update marker position state

    // Implement reverse geocoding to get address (reuse logic from handleMarkerDragEnd)
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
        );
        const data = await response.json();
        const address = data.display_name || 'Address not found';
        setFormData(prev => ({ ...prev, address })); // Update address in form data
        showNotification('Address updated from clicked location.', 'info');
    } catch (error) {
        console.error('Error fetching address on click:', error);
        setFormData(prev => ({ ...prev, address: 'Address not found' }));
        showNotification('Could not fetch address for new location.', 'warning');
    }
  };

    // Handle Save button click
    const handleSave = async () => {
        // Use default values if any field is missing
        const safeFormData = {
            entityName: formData.entityName || '',
            entityWasteType: formData.entityWasteType || '',
            address: formData.address || '',
        };
        const safeMarkerPosition = markerPosition || { lat: 0, lng: 0 };
        if (!entityData || !safeMarkerPosition || !safeFormData.entityName || !safeFormData.entityWasteType || !safeFormData.address) {
            showNotification('Please ensure all details are filled and the pin is placed.', 'warning');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const updatedData = {
                ...entityData, // Start with existing data
                entityName: safeFormData.entityName,
                entityWasteType: safeFormData.entityWasteType,
                address: safeFormData.address,
                latitude: safeMarkerPosition.lat || 0, // Use new latitude, default 0
                longitude: safeMarkerPosition.lng || 0, // Use new longitude, default 0
            };

            // Remove entityId from the update data if your PUT endpoint doesn't expect it in the body
            delete updatedData.entityId; // Adjust based on your backend requirements

            console.log('Saving updated entity data:', updatedData);

            const response = await api.put(`/private-entities/${userId}`, updatedData);

            console.log('Save response:', response.data);

            // Check for success based on the message field from the backend
            if (response.data && response.data.message === 'Private entity information updated successfully') {
                // Backend indicates success, display a success notification
                showNotification('Entity details updated successfully!', 'success');
                // Optionally, update entityData with the response if backend sends updated entity (it doesn't in this case, based on logs)
                // setEntityData(response.data.entity);
            } else if (response.data && response.data.message) {
                 // Backend returned a message, but not the specific success one
                 showNotification(`Update failed: ${response.data.message}`, 'error');
            }
            else {
                // No specific message, assume a generic failure
                showNotification('Failed to update entity details.', 'error');
            }
        } catch (err) {
            setError('Error saving entity data.');
            console.error('Save entity data error:', err.response?.data || err);
            showNotification(`Error saving entity details: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
          p: 3 
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: '#4CAF50',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          p: 3,
          height: '100vh',
          background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 500,
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2, color: '#d32f2f', fontWeight: 600 }}>
              ⚠️ Error
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate('/private-dashboard')} 
              sx={{
                textTransform: 'none',
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #4CAF50 100%)',
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                },
              }}
            >
              Go back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!entityData || !markerPosition) {
      return (
          <Box sx={{ p: 3 }}>
              <Alert severity="info">Loading entity data...</Alert>
          </Box>
      );
  }

  return (
    <Box
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #E8F5E9 100%)',
        width: '100%',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Inner Box for Centering Content */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f4 100%)',
              border: '2px solid #C8E6C9',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.12)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  fontSize: '28px',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                }}
              >
                📍
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #4CAF50 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Edit Entity Location
                </Typography>
                <Typography variant="body2" sx={{ color: '#5a7a5d', mt: 0.5 }}>
                  Update your private entity address and pin location
                </Typography>
              </Box>
            </Box>

            {/* Back Button */}
            <Button
              variant="outlined"
              onClick={() => navigate('/private-dashboard')}
              sx={{
                mt: 2,
                textTransform: 'none',
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                fontWeight: 600,
                borderColor: '#4CAF50',
                color: '#4CAF50',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: '#E8F5E9',
                  borderColor: '#388e3c',
                  transform: 'translateX(-4px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              ← Back to Dashboard
            </Button>
          </Paper>
        </Fade>

        {/* Map Section */}
        <Zoom in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 3,
              overflow: 'hidden',
              border: '3px solid #4CAF50',
              boxShadow: '0 12px 32px rgba(76, 175, 80, 0.2)',
            }}
          >
            <Box 
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                📍 Interactive Map - Click or Drag to Set Location
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                Click anywhere on the map to place your pin, or drag the existing marker to adjust
              </Typography>
            </Box>
            <Box sx={{ height: '500px', width: '100%' }}>
              {markerPosition && (
                <MapContainer
                  center={[markerPosition.lat, markerPosition.lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Add MapClickEvent component to listen for clicks */}
                  <MapClickEvent onMapClick={handleMapClick} />

                  {markerPosition && (
                    <Marker
                      position={[markerPosition.lat, markerPosition.lng]}
                    >
                      <Popup>
                        {/* Popup content - display current info */}
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
                            {entityData.entityName || 'Private Entity'}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Waste Type:</strong> {entityData.entityWasteType || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Status:</strong>{' '}
                            <Chip 
                              label={entityData.entityStatus || 'N/A'} 
                              size="small"
                              sx={{ 
                                bgcolor: entityData.entityStatus === 'OPEN' ? '#C8E6C9' : '#FFCDD2',
                                color: entityData.entityStatus === 'OPEN' ? '#2e7d32' : '#c62828',
                                fontWeight: 600,
                                fontSize: '11px',
                              }}
                            />
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '12px', color: '#666' }}>
                            <strong>Address:</strong> {entityData.address || 'N/A'}
                          </Typography>
                        </Box>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              )}
            </Box>
          </Paper>
        </Zoom>

        {/* Form Section */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f4 100%)',
              border: '2px solid #C8E6C9',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.12)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #66BB6A 0%, #81C784 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  fontSize: '24px',
                  boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
                }}
              >
                ✏️
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#2e7d32',
                  letterSpacing: '-0.3px',
                }}
              >
                Entity Details
              </Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: '#C8E6C9' }} />

            <Box component="form" noValidate autoComplete="off">
              <TextField
                label="Entity Name"
                name="entityName"
                value={formData.entityName}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4CAF50',
                  },
                }}
              />
              <TextField
                label="Waste Type"
                name="entityWasteType"
                value={formData.entityWasteType}
                onChange={handleInputChange}
                select
                fullWidth
                margin="normal"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4CAF50',
                  },
                }}
              >
                <MenuItem value="General Waste">♻️ General Waste</MenuItem>
                <MenuItem value="Plastic">🔷 Plastic</MenuItem>
                <MenuItem value="Paper">📄 Paper</MenuItem>
                <MenuItem value="Glass">🥃 Glass</MenuItem>
                <MenuItem value="Metal">🔩 Metal</MenuItem>
                <MenuItem value="Organic">🍃 Organic</MenuItem>
                <MenuItem value="Electronic">💻 Electronic</MenuItem>
              </TextField>
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#4CAF50',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4CAF50',
                  },
                }}
              />

              {/* Coordinates Display */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: '#E8F5E9',
                  border: '2px solid #C8E6C9',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600, mb: 2 }}>
                  📌 Current Coordinates
                </Typography>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#5a7a5d', fontWeight: 500, mb: 0.5 }}>
                      Latitude
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                      {markerPosition.lat.toFixed(6)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ borderColor: '#C8E6C9' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#5a7a5d', fontWeight: 500, mb: 0.5 }}>
                      Longitude
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                      {markerPosition.lng.toFixed(6)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Save Button */}
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  py: 1.8,
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #4CAF50 100%)',
                    boxShadow: '0 8px 28px rgba(76, 175, 80, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: '#C8E6C9',
                    color: '#fff',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  '💾 Save Changes'
                )}
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '24px',
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditPrivateEntityPin;