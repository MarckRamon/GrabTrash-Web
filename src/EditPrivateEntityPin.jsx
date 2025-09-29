import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Snackbar, Button, TextField, MenuItem } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CollectionPoints.css'; // Reuse map styles
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Get JWT token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

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
        const response = await axios.get(
          `${API_BASE_URL}/api/private-entities/${userId}`, // Use userId here for fetching
          {
            headers: getAuthHeader(),
            withCredentials: true,
          }
        );

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

            const response = await axios.put(
                `${API_BASE_URL}/api/private-entities/${userId}`,
                updatedData,
                {
                    headers: getAuthHeader(),
                    withCredentials: true,
                }
            );

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
         <Button variant="contained" onClick={() => navigate('/private-dashboard')} sx={{ mt: 2 }}>
            Go back to Dashboard
         </Button>
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
        bgcolor: '#f8f9fa',
        width: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Inner Box for Centering Content */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Private Entity Address</Typography>

        {/* Back Button */}
        <Button
          variant="outlined"
          onClick={() => navigate('/private-dashboard')}
          sx={{
            mt: 2, // Add some top margin
            mb: 3, // Add some bottom margin
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: '#616161', // A neutral color for back button
            color: '#616161',
            '&:hover': {
              bgcolor: '#eeeeee',
              borderColor: '#424242',
            }
          }}
        >
          Back to Dashboard
        </Button>

        <Box sx={{ height: '500px', width: '100%', mb: 3 }}> {/* Adjust map height as needed */}
          {markerPosition && (
             <MapContainer
               center={[markerPosition.lat, markerPosition.lng]} // Center map on the marker
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
                     <Box>
                       <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{entityData.entityName || 'Private Entity'}</Typography>
                       <Typography variant="body2">Waste Type: {entityData.entityWasteType || 'N/A'}</Typography>
                       <Typography variant="body2">Status: {entityData.entityStatus || 'N/A'}</Typography>
                       <Typography variant="body2">Address: {entityData.address || 'N/A'}</Typography>
                     </Box>
                   </Popup>
                 </Marker>
               )}
             </MapContainer>
          )}
        </Box>

        {/* Form to edit details */}
         <Box component="form" sx={{ mb: 3 }} noValidate autoComplete="off">
            <Typography variant="h5" sx={{ mb: 2 }}>Edit Details</Typography>
            <TextField
                label="Entity Name"
                name="entityName"
                value={formData.entityName}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
            />
             <TextField
                label="Waste Type"
                name="entityWasteType"
                value={formData.entityWasteType}
                onChange={handleInputChange}
                select // Use select for dropdown
                fullWidth
                margin="normal"
            >
                <MenuItem value="General Waste">General Waste</MenuItem>
                <MenuItem value="Plastic">Plastic</MenuItem>
                <MenuItem value="Paper">Paper</MenuItem>
                <MenuItem value="Glass">Glass</MenuItem>
                <MenuItem value="Metal">Metal</MenuItem>
                <MenuItem value="Organic">Organic</MenuItem>
                <MenuItem value="Electronic">Electronic</MenuItem>
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
            />
            <Typography variant="body1" sx={{ mt: 2 }}>Latitude: {markerPosition.lat.toFixed(6)}</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>Longitude: {markerPosition.lng.toFixed(6)}</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading} // Disable while saving
            >
                Save Changes
            </Button>

         </Box>

      </Box>
       <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
    </Box>
  );
};

export default EditPrivateEntityPin; 