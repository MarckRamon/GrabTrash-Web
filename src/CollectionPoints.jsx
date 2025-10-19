import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CollectionPoints.css';
import L from 'leaflet';
import AdminLayout from './components/AdminLayout';
import { 
  Box, 
  Typography, 
  Snackbar, 
  Alert, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  Button,
  Paper,
  Chip,
  TextField,
  Fade,
  Zoom,
  Avatar,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LocationOn, 
  Add, 
  Close,
  Edit,
  Delete,
  Public,
  Business,
  LocalShipping,
} from '@mui/icons-material';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Red Icon for Private Entities
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Green Icon for Job Orders
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const API_BASE_URL = 'https://grabtrash-backend.onrender.com/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Component for handling map clicks and adding markers
function MapEvents({ isAddingMarker, onAddMarker }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (isAddingMarker) {
        console.log('Map clicked at:', e.latlng);
        onAddMarker(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

function CollectionPoints() {
  const [markers, setMarkers] = useState([]);
  const [privateEntityMarkers, setPrivateEntityMarkers] = useState([]);
  const [jobOrderMarkers, setJobOrderMarkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [formData, setFormData] = useState({
    siteName: '',
    wasteType: '',
    address: '',
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null);
  const [jobOrderStatusFilter, setJobOrderStatusFilter] = useState('All');

  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchCollectionPoints();
      fetchPrivateEntities();
      fetchJobOrders();
    }
  }, [navigate]);

  const fetchCollectionPoints = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/pickup-locations`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      if (response.data && response.data.success) {
        const locations = response.data.locations || [];
        setMarkers(locations);
      }
    } catch (error) {
      console.error('Error fetching collection points:', error);
      showNotification('Error fetching collection points', 'error');
    }
  };

  const fetchPrivateEntities = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/private-entities`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      setPrivateEntityMarkers(response.data || []);
    } catch (error) {
      console.error('Error fetching private entities:', error);
    }
  };

  const fetchJobOrders = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payments`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      setJobOrderMarkers(response.data || []);
    } catch (error) {
      console.error('Error fetching job orders:', error);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleAddMarker = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      const address = response.data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      setSelectedLocation({ lat, lng });
      setFormData({ ...formData, address });
    } catch (error) {
      console.error('Error getting address:', error);
      setSelectedLocation({ lat, lng });
      setFormData({ ...formData, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };

  const handleSaveMarker = async () => {
    if (!formData.siteName || !formData.wasteType || !selectedLocation) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const locationData = {
        siteName: formData.siteName,
        wasteType: formData.wasteType,
        address: formData.address,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      };

      const response = await axios.post(
        `${API_BASE_URL}/pickup-locations`, 
        locationData,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      const newMarker = {
        ...locationData,
        id: response.data.id
      };

      setMarkers(prevMarkers => [...prevMarkers, newMarker]);
      showNotification('Collection point added successfully');

      setFormData({ siteName: '', wasteType: '', address: '' });
      setSelectedLocation(null);
      setIsAddingMarker(false);

      await fetchCollectionPoints();
    } catch (error) {
      console.error('Save error:', error);
      showNotification(error.response?.data?.message || 'Error saving collection point', 'error');
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setFormData({ siteName: '', wasteType: '', address: '' });
    setIsAddingMarker(false);
  };

  const handleDeleteMarker = async (id) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/pickup-locations/${id}`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
      showNotification('Collection point deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Error deleting collection point', 'error');
    }
  };

  const handleUpdateMarker = async (id) => {
    if (!formData.siteName || !formData.wasteType) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      const updateData = {
        siteName: formData.siteName,
        wasteType: formData.wasteType,
        address: formData.address
      };

      const response = await axios.put(
        `${API_BASE_URL}/pickup-locations/${id}`,
        updateData,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      if (response.data.success) {
        setMarkers(prevMarkers =>
          prevMarkers.map(marker =>
            marker.id === id
              ? { ...marker, ...updateData }
              : marker
          )
        );

        showNotification('Collection point updated successfully');
        setEditingMarker(null);
        setFormData({ siteName: '', wasteType: '', address: '' });

        await fetchCollectionPoints();
      }
    } catch (error) {
      console.error('Update error:', error);
      showNotification('Error updating collection point', 'error');
    }
  };

  const startEditing = (marker) => {
    setEditingMarker(marker);
    setFormData({
      siteName: marker.siteName,
      wasteType: marker.wasteType,
      address: marker.address
    });
  };

  const cancelEditing = () => {
    setEditingMarker(null);
    setFormData({ siteName: '', wasteType: '', address: '' });
  };

  const filteredJobOrderMarkers = jobOrderStatusFilter === 'All'
    ? jobOrderMarkers
    : jobOrderMarkers.filter(order => (order.jobOrderStatus || '').toLowerCase() === jobOrderStatusFilter.toLowerCase());

  if (allowed === null) return null;

  return (
    <AdminLayout>
      <Box
        sx={{
          position: 'fixed',
          left: '240px',
          top: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderBottom: '2px solid rgba(46, 125, 50, 0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              {/* Left Side: Title and Legend */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                  }}>
                    <LocationOn sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    Collection Points
                  </Typography>
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, ml: 2 }}>
                  <Chip 
                    icon={<Public sx={{ fontSize: 16 }} />}
                    label="Public Dumpsites"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(33, 150, 243, 0.15)',
                      color: '#2196f3',
                      fontWeight: 600,
                      borderRadius: '10px',
                      '& .MuiChip-icon': { color: '#2196f3' },
                    }}
                  />
                  <Chip 
                    icon={<Business sx={{ fontSize: 16 }} />}
                    label="Private Entities"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(244, 67, 54, 0.15)',
                      color: '#f44336',
                      fontWeight: 600,
                      borderRadius: '10px',
                      '& .MuiChip-icon': { color: '#f44336' },
                    }}
                  />
                  <Chip 
                    icon={<LocalShipping sx={{ fontSize: 16 }} />}
                    label="Job Orders"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(67, 160, 71, 0.15)',
                      color: '#43a047',
                      fontWeight: 600,
                      borderRadius: '10px',
                      '& .MuiChip-icon': { color: '#43a047' },
                    }}
                  />
                </Box>

                {/* Filter Dropdown */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#2e7d32' } }}>Filter Orders</InputLabel>
                  <Select
                    value={jobOrderStatusFilter}
                    label="Filter Orders"
                    onChange={e => setJobOrderStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Accepted">Accepted</MenuItem>
                    <MenuItem value="In-Progress">In-Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Right Side: Add Button */}
              <Button
                variant="contained"
                startIcon={isAddingMarker ? <Close /> : <Add />}
                onClick={() => {
                  setIsAddingMarker(!isAddingMarker);
                  if (!isAddingMarker) {
                    setSelectedLocation(null);
                    setFormData({ siteName: '', wasteType: '', address: '' });
                  }
                }}
                sx={{
                  background: isAddingMarker 
                    ? 'linear-gradient(135deg, #f44336 0%, #e53935 100%)'
                    : 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                  color: 'white',
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: isAddingMarker 
                    ? '0 4px 15px rgba(244, 67, 54, 0.3)'
                    : '0 4px 15px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    background: isAddingMarker 
                      ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                      : 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: isAddingMarker 
                      ? '0 6px 20px rgba(244, 67, 54, 0.4)'
                      : '0 6px 20px rgba(46, 125, 50, 0.4)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                {isAddingMarker ? 'Cancel Adding' : 'Add Collection Point'}
              </Button>
            </Box>
          </Paper>
        </Fade>

        {/* Map Container */}
        <Box sx={{ 
          position: 'absolute', 
          top: '90px', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          p: 2,
        }}>
          <Zoom in timeout={700}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="map-wrapper" style={{ height: '100%' }}>
                <div className="map-container" style={{ height: '100%' }}>
                  <MapContainer
                    center={[10.2447, 123.8505]}
                    zoom={14}
                    style={{ height: '100%', width: '100%', borderRadius: '20px' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MapEvents isAddingMarker={isAddingMarker} onAddMarker={handleAddMarker} />

                    {/* Existing saved (public) markers */}
                    {markers && markers.length > 0 && markers.map((marker) => (
                      <Marker
                        key={marker.id}
                        position={[parseFloat(marker.latitude), parseFloat(marker.longitude)]}
                      >
                        <Popup>
                          {editingMarker?.id === marker.id ? (
                            <Box sx={{ p: 2, minWidth: 300 }}>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2e7d32' }}>
                                Edit Collection Point
                              </Typography>
                              <TextField
                                label="Site Name"
                                value={formData.siteName}
                                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                                fullWidth
                                size="small"
                                sx={{ mb: 2 }}
                              />
                              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Waste Type</InputLabel>
                                <Select
                                  value={formData.wasteType}
                                  onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                                  label="Waste Type"
                                >
                                  <MenuItem value="General Waste">General Waste</MenuItem>
                                  <MenuItem value="Plastic">Plastic</MenuItem>
                                  <MenuItem value="Paper">Paper</MenuItem>
                                  <MenuItem value="Glass">Glass</MenuItem>
                                  <MenuItem value="Metal">Metal</MenuItem>
                                  <MenuItem value="Organic">Organic</MenuItem>
                                  <MenuItem value="Electronic">Electronic</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Address"
                                value={formData.address}
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                sx={{ mb: 2 }}
                                InputProps={{ readOnly: true }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  onClick={cancelEditing}
                                  fullWidth
                                  sx={{ borderColor: '#666', color: '#666' }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => handleUpdateMarker(marker.id)}
                                  fullWidth
                                  sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                                >
                                  Save
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ p: 2, minWidth: 250 }}>
                              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#2e7d32' }}>
                                {marker.siteName}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Waste Type:</strong> {marker.wasteType}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Address:</strong> {marker.address}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  startIcon={<Edit />}
                                  onClick={() => startEditing(marker)}
                                  fullWidth
                                  sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
                                >
                                  Edit Details
                                </Button>
                                <Button
                                  variant="contained"
                                  startIcon={<Delete />}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${marker.siteName}"?`)) {
                                      handleDeleteMarker(marker.id);
                                    }
                                  }}
                                  fullWidth
                                  sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Popup>
                      </Marker>
                    ))}

                    {/* Private Entity markers */}
                    {privateEntityMarkers && privateEntityMarkers.length > 0 && privateEntityMarkers.map((entity) => (
                      <Marker
                        key={entity.entityId}
                        position={[parseFloat(entity.latitude), parseFloat(entity.longitude)]}
                        icon={redIcon}
                      >
                        <Popup>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#f44336' }}>
                              {entity.entityName || 'Private Entity'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Waste Type:</strong> {entity.entityWasteType || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Status:</strong> {entity.entityStatus || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Address:</strong> {entity.address || 'N/A'}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Job Order markers (Green Pins) */}
                    {filteredJobOrderMarkers && filteredJobOrderMarkers.length > 0 && filteredJobOrderMarkers.map((order) => (
                      <Marker
                        key={order.id}
                        position={[parseFloat(order.latitude), parseFloat(order.longitude)]}
                        icon={greenIcon}
                      >
                        <Popup>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#43a047' }}>
                              Job Order #{order.id}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Customer:</strong> {order.customerName || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Address:</strong> {order.address || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Amount:</strong> ₱{order.amount ? Number(order.amount).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Status:</strong> {order.jobOrderStatus || 'N/A'}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Temporary marker for new location */}
                    {selectedLocation && (
                      <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                        <Popup>
                          <Box sx={{ p: 2, minWidth: 300 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2e7d32' }}>
                              Add Collection Point
                            </Typography>
                            <TextField
                              label="Site Name"
                              value={formData.siteName}
                              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                              fullWidth
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                              <InputLabel>Waste Type</InputLabel>
                              <Select
                                value={formData.wasteType}
                                onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                                label="Waste Type"
                              >
                                <MenuItem value="General Waste">General Waste</MenuItem>
                                <MenuItem value="Plastic">Plastic</MenuItem>
                                <MenuItem value="Paper">Paper</MenuItem>
                                <MenuItem value="Glass">Glass</MenuItem>
                                <MenuItem value="Metal">Metal</MenuItem>
                                <MenuItem value="Organic">Organic</MenuItem>
                                <MenuItem value="Electronic">Electronic</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              label="Address"
                              value={formData.address}
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              sx={{ mb: 2 }}
                              InputProps={{ readOnly: true }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={handleCancel}
                                fullWidth
                                sx={{ borderColor: '#666', color: '#666' }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleSaveMarker}
                                fullWidth
                                sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                              >
                                Save
                              </Button>
                            </Box>
                          </Box>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            </Paper>
          </Zoom>
        </Box>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ borderRadius: '12px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
}

export default CollectionPoints;