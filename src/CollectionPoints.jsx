import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CollectionPoints.css';
import L from 'leaflet';
import AdminLayout from './components/AdminLayout';
import { Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

// API base URL - updating to match backend URL
const API_BASE_URL = 'http://localhost:8080';

// Get JWT token from localStorage
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

  // Fetch all collection points and private entities on component mount
  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
        fetchCollectionPoints();
        fetchPrivateEntities(); // Fetch private entities
        fetchJobOrders(); // Fetch job orders
    }
  }, [navigate]);

  const fetchCollectionPoints = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/pickup-locations`,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      console.log('Raw response from fetch (pickup-locations):', response.data);

      if (response.data && response.data.success) {
        // Extract the locations array from the response
        const locations = response.data.locations || [];
        console.log('Processed pickup-locations:', locations);

        setMarkers(locations);
      } else {
        console.error('Invalid response structure (pickup-locations):', response.data);
        showNotification('Failed to fetch collection points', 'error');
      }
    } catch (error) {
      console.error('Error fetching collection points:', error);
      showNotification('Error fetching collection points', 'error');
    }
  };

  const fetchPrivateEntities = async () => {
      try {
          const response = await axios.get(
              `${API_BASE_URL}/api/private-entities`, // Assuming this endpoint exists
              {
                  headers: getAuthHeader(),
                  withCredentials: true
              }
          );

          console.log('Raw response from fetch (private-entities):', response.data);

          if (response.data && Array.isArray(response.data.entities)) { // Check if response data exists and contains an entities array
               console.log('Processed private-entities:', response.data);
               // Filter out entities that don't have latitude and longitude
               const validEntities = response.data.entities.filter(entity => entity.latitude && entity.longitude);
               setPrivateEntityMarkers(validEntities);
           } else {
               console.error('Invalid response structure (private-entities):', response.data);
               showNotification('Failed to fetch private entities', 'error');
           }
       } catch (error) {
           console.error('Error fetching private entities:', error);
           // Don't show a notification for this error to avoid clutter if the endpoint doesn't exist yet
           // showNotification('Error fetching private entities', 'error');
           setPrivateEntityMarkers([]); // Ensure state is reset on error
       }
  };

  const fetchJobOrders = async () => {
      try {
          const response = await axios.get(
              `${API_BASE_URL}/api/payments`, // Endpoint for job orders/payments
              {
                  headers: getAuthHeader(),
                  withCredentials: true
              }
          );

          console.log('Raw response from fetch (payments):', response.data);

          if (response.data && Array.isArray(response.data)) { // Assuming the payments endpoint returns an array directly
               console.log('Processed payments:', response.data);
               // Filter out payments that don't have latitude and longitude
               const validJobOrders = response.data.filter(order => order.latitude && order.longitude);
               setJobOrderMarkers(validJobOrders);
           } else {
               console.error('Invalid response structure (payments):', response.data);
               showNotification('Failed to fetch job orders', 'error');
           }
       } catch (error) {
           console.error('Error fetching job orders:', error);
           showNotification('Error fetching job orders', 'error');
           setJobOrderMarkers([]); // Ensure state is reset on error
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
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Function to handle adding new markers
  const handleAddMarker = async (lat, lng) => {
    console.log('handleAddMarker called with:', lat, lng);

    try {
      // Reverse geocoding using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.display_name;

      setSelectedLocation({ lat, lng, address });
      setFormData(prev => ({ ...prev, address }));
    } catch (error) {
      console.error('Error fetching address:', error);
      setSelectedLocation({ lat, lng, address: 'Address not found' });
      showNotification('Error fetching address', 'error');
    }
  };

  // Function to save marker
  const handleSaveMarker = async () => {
    if (!selectedLocation || !formData.siteName || !formData.wasteType) {
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

      console.log('Sending data:', locationData);

      const response = await axios.post(
        `${API_BASE_URL}/api/pickup-locations`, 
        locationData,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      console.log('Response from save:', response.data);

      // Add the new marker to the local state first
      const newMarker = {
        ...locationData,
        id: response.data.id
      };

      console.log('New marker created:', newMarker);

      // Update local state immediately
      setMarkers(prevMarkers => [...prevMarkers, newMarker]);
      showNotification('Collection point added successfully');

      // Reset form and selection
      setFormData({ siteName: '', wasteType: '', address: '' });
      setSelectedLocation(null);
      setIsAddingMarker(false);

      // Fetch fresh data from server to ensure consistency
      await fetchCollectionPoints();

    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        showNotification(error.response.data.message || 'Error saving collection point', 'error');
      } else {
        console.error('Error details:', error);
        showNotification('Error saving collection point', 'error');
      }
    }
  };

  // Function to handle cancel
  const handleCancel = () => {
    setSelectedLocation(null);
    setFormData({ siteName: '', wasteType: '', address: '' });
    setIsAddingMarker(false);
  };

  // Function to delete a marker
  const handleDeleteMarker = async (id) => {
    try {
      // Log the marker we're trying to delete
      const markerToDelete = markers.find(m => m.id === id);
      console.log('Attempting to delete marker:', markerToDelete);

      if (!id || typeof id !== 'string') {
        console.error('Invalid ID format:', id);
        showNotification('Invalid marker ID format', 'error');
        return;
      }

      const response = await axios({
        method: 'delete',
        url: `${API_BASE_URL}/api/pickup-locations/${id}`,
        headers: getAuthHeader(),
        withCredentials: true
      });

      console.log('Delete response:', response);

      if (response.status === 200) {
        // Remove from local state
        setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
        showNotification('Collection point deleted successfully');
        // Close any open popups
        setSelectedLocation(null);
      } else {
        showNotification('Failed to delete collection point', 'error');
      }
    } catch (error) {
      console.error('Delete error:', {
        error,
        id,
        status: error.response?.status,
        data: error.response?.data
      });
      showNotification('Error deleting collection point', 'error');
    }
  };

  // Function to handle edit marker
  const handleEditMarker = async (markerId) => {
    try {
      if (!editingMarker || !formData.siteName || !formData.wasteType) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const updateData = {
        siteName: formData.siteName,
        wasteType: formData.wasteType,
        address: formData.address,
        latitude: editingMarker.latitude,
        longitude: editingMarker.longitude
      };

      console.log('Sending update data:', updateData);

      const response = await axios.put(
        `${API_BASE_URL}/api/pickup-locations/${markerId}`,
        updateData,
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      console.log('Update response:', response.data);

      if (response.data && response.data.success) {
        // Update the marker in local state
        setMarkers(prevMarkers =>
          prevMarkers.map(marker =>
            marker.id === markerId
              ? { ...marker, ...updateData }
              : marker
          )
        );

        showNotification('Collection point updated successfully');
        setEditingMarker(null);
        setFormData({ siteName: '', wasteType: '', address: '' });

        // Refresh the markers to ensure consistency
        await fetchCollectionPoints();
      } else {
        showNotification('Failed to update collection point', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showNotification(
        error.response?.data?.message || 'Error updating collection point',
        'error'
      );
    }
  };

  // Function to start editing a marker
  const startEditing = (marker) => {
    setEditingMarker(marker);
    setFormData({
      siteName: marker.siteName,
      wasteType: marker.wasteType,
      address: marker.address
    });
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingMarker(null);
    setFormData({ siteName: '', wasteType: '', address: '' });
  };

  // Filtered job orders based on filter
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
          bgcolor: '#f8f9fa',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '2rem',
                  backgroundColor: 'white',
                  mr: 2
                }}
              >
                Collection Points
              </Typography>
              {/* Legend */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#3388ff', borderRadius: '50%' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#475569', ml: 0.5 }}>Public Dumpsites</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#dc2626', borderRadius: '50%' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#475569', ml: 0.5 }}>Private Entities</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#22c55e', borderRadius: '50%' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: '#475569', ml: 0.5 }}>Job Orders</Typography>
                </Box>
              </Box>
              {/* Filter Orders Dropdown */}
              <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
                <InputLabel id="job-order-status-label">Filter Orders</InputLabel>
                <Select
                  labelId="job-order-status-label"
                  id="job-order-status-select"
                  value={jobOrderStatusFilter}
                  label="Filter Orders"
                  onChange={e => setJobOrderStatusFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Accepted">Accepted</MenuItem>
                  <MenuItem value="In-Progress">In-Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <button
              onClick={() => {
                setIsAddingMarker(!isAddingMarker);
                if (!isAddingMarker) {
                  setSelectedLocation(null);
                  setFormData({ siteName: '', wasteType: '', address: '' });
                }
              }}
              className={`px-4 py-2 rounded ${
                isAddingMarker
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isAddingMarker ? 'Cancel Adding' : 'Add Collection Point'}
            </button>
          </Box>
        </Box>

        <Box sx={{ position: 'absolute', top: '64px', left: 0, right: 0, bottom: 0, p: 2 }}>
          <div className="map-wrapper">
            <div className="map-container">
              <MapContainer
                center={[10.2447, 123.8505]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
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
                        // Edit Form
                        <div className="p-2">
                          <h3 className="font-bold text-lg mb-2">Edit Collection Point</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Site Name</label>
                              <input
                                type="text"
                                value={formData.siteName}
                                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Waste Type</label>
                              <select
                                value={formData.wasteType}
                                onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                              >
                                <option value="">Select waste type</option>
                                <option value="General Waste">General Waste</option>
                                <option value="Plastic">Plastic</option>
                                <option value="Paper">Paper</option>
                                <option value="Glass">Glass</option>
                                <option value="Metal">Metal</option>
                                <option value="Organic">Organic</option>
                                <option value="Electronic">Electronic</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Address</label>
                              <textarea
                                value={formData.address}
                                readOnly
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                                rows={2}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditMarker(marker.id)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="p-2">
                          <h3 className="font-bold text-lg mb-2">{marker.siteName}</h3>
                          <p className="mb-1"><strong>Waste Type:</strong> {marker.wasteType}</p>
                          <p className="mb-3"><strong>Address:</strong> {marker.address}</p>
                          <p className="mb-1 text-sm text-gray-500">ID: {marker.id}</p>
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditing(marker);
                              }}
                              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${marker.siteName}"?`)) {
                                  console.log('Attempting to delete marker:', marker);
                                  handleDeleteMarker(marker.id);
                                }
                              }}
                              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </Popup>
                  </Marker>
                ))}

                {/* Private Entity markers */}
                {privateEntityMarkers && privateEntityMarkers.length > 0 && privateEntityMarkers.map((entity) => (
                    <Marker
                        key={entity.entityId} // Assuming entityId is unique
                        position={[parseFloat(entity.latitude), parseFloat(entity.longitude)]}
                        icon={redIcon} // Use the custom red icon
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold text-lg mb-2">{entity.entityName || 'Private Entity'}</h3>
                                <p className="mb-1"><strong>Waste Type:</strong> {entity.entityWasteType || 'N/A'}</p>
                                <p className="mb-1"><strong>Status:</strong> {entity.entityStatus || 'N/A'}</p>
                                <p className="mb-3"><strong>Address:</strong> {entity.address || 'N/A'}</p>
                                {/* You can add more details from the entity object here if needed */}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Job Order markers (Green Pins) */}
                {filteredJobOrderMarkers && filteredJobOrderMarkers.length > 0 && filteredJobOrderMarkers.map((order) => (
                    <Marker
                        key={order.id} // Assuming each payment has a unique id
                        position={[parseFloat(order.latitude), parseFloat(order.longitude)]}
                        icon={greenIcon} // Use the custom green icon
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold text-lg mb-2">Job Order #{order.id}</h3>
                                <p className="mb-1"><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
                                <p className="mb-1"><strong>Address:</strong> {order.address || 'N/A'}</p>
                                <p className="mb-1"><strong>Amount:</strong> ₱{order.amount ? Number(order.amount).toLocaleString() : 'N/A'}</p>
                                <p className="mb-1"><strong>Status:</strong> {order.jobOrderStatus || 'N/A'}</p>
                                {/* Add other relevant job order details here */}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Temporary marker for new location */}
                {selectedLocation && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                    <Popup>
                      <div className="bg-white rounded-lg p-4 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Add Collection Point</h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Site Name</label>
                            <input
                              type="text"
                              value={formData.siteName}
                              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Waste Type</label>
                            <select
                              value={formData.wasteType}
                              onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                              <option value="">Select waste type</option>
                              <option value="General Waste">General Waste</option>
                              <option value="Plastic">Plastic</option>
                              <option value="Paper">Paper</option>
                              <option value="Glass">Glass</option>
                              <option value="Metal">Metal</option>
                              <option value="Organic">Organic</option>
                              <option value="Electronic">Electronic</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                              value={formData.address}
                              readOnly
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveMarker}
                              className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
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
    </AdminLayout>
  );
}

export default CollectionPoints; 