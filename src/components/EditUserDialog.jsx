import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
} from '@mui/material';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
if (L.Icon.Default && L.Icon.Default.prototype) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const EditUserDialog = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    role: user?.role || '',
    location: user?.location || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Map state
  const [markerPosition, setMarkerPosition] = useState(
    user?.latitude && user?.longitude
      ? { lat: parseFloat(user.latitude), lng: parseFloat(user.longitude) }
      : null
  );

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || '',
        location: user.location || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      });
      setMarkerPosition(
        user.latitude && user.longitude
          ? { lat: parseFloat(user.latitude), lng: parseFloat(user.longitude) }
          : null
      );
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear any previous messages
    setError('');
    setSuccess('');
  };

  // Map click event handler
  function MapClickEvent({ onMapClick }) {
    useMapEvents({
      click: (e) => {
        onMapClick(e.latlng);
      },
    });
    return null;
  }

  // Handle map click to set marker and fetch address
  const handleMapClick = async (latlng) => {
    setMarkerPosition(latlng);
    setFormData((prev) => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    // Fetch address from OpenStreetMap
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      const address = data.display_name || '';
      setFormData((prev) => ({ ...prev, location: address }));
    } catch (error) {
      setFormData((prev) => ({ ...prev, location: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate user ID
      if (!user || !user.userId) {
        setError('Invalid user data');
        return;
      }

      // Validate role is not empty
      if (!formData.role) {
        setError('Please select a role');
        return;
      }

      // Prepare update payload
      const locationPayload = {
        userId: user.userId,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      // Call the backend API to update the user's location
      const response = await api.put(`/users/location`, locationPayload);

      if (response.data?.message) {
        setSuccess(response.data.message || 'Location updated successfully');
        onSave({
          ...user,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          role: formData.role
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating user location:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Only admin users can update locations.');
      } else if (error.response?.status === 404) {
        setError('User not found. Please refresh the page and try again.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to update user location. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          borderBottom: '1px solid #e5e7eb',
          px: 3,
          py: 2,
          fontWeight: 600,
          color: '#333',
          fontSize: '1.25rem',
          lineHeight: 1.6,
        }}
      >
        Edit User Location
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Display user info (non-editable) */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ 
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              mb: 0.5
            }}>
              User ID
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
              {user?.userId || 'N/A'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ 
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              mb: 0.5
            }}>
              Name
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
              {user ? `${user.firstName} ${user.lastName}` : 'N/A'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ 
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              mb: 0.5
            }}>
              Email
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
              {user?.email || 'N/A'}
            </Typography>
          </Box>

          <FormControl 
            fullWidth 
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e5e7eb',
                },
                '&:hover fieldset': {
                  borderColor: '#d1d5db',
                },
              },
            }}
          >
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="collector">Collector</MenuItem>
            </Select>
          </FormControl>

          {/* Add map for picking location */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: '#374151', fontSize: '14px', fontWeight: 500, mb: 0.5 }}>
              Set Location (click on the map to place a pin)
            </Typography>
            <Box sx={{ height: 200, width: '100%', borderRadius: 2, overflow: 'hidden', mb: 1 }}>
              <MapContainer
                center={markerPosition || { lat: 10.3157, lng: 123.8854 }}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickEvent onMapClick={handleMapClick} />
                {markerPosition && (
                  <Marker position={markerPosition} />
                )}
              </MapContainer>
            </Box>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {formData.location ? `Selected Address: ${formData.location}` : 'No location selected.'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {markerPosition ? `Lat: ${markerPosition.lat.toFixed(6)}, Lng: ${markerPosition.lng.toFixed(6)}` : ''}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 1 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #e5e7eb',
        px: 3,
        py: 2,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            color: '#6b7280',
            borderColor: '#d1d5db',
            '&:hover': {
              borderColor: '#9ca3af',
              bgcolor: '#f9fafb',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#4CAF50',
            '&:hover': {
              bgcolor: '#45a049',
            },
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog; 