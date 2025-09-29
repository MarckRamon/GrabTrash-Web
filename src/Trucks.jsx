import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Search, Edit, Delete, Add, PersonAdd, PersonRemove } from '@mui/icons-material';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';

const Trucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]); // Store all trucks before filtering
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unassigned, assigned
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    size: '',
    wasteType: '',
    status: 'AVAILABLE',
    make: '',
    model: '',
    plateNumber: '',
    truckPrice: '',
    capacity: '',
  });

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      return;
    }

    // Check if token is expired
    const decoded = api.getCurrentUser();
    if (!decoded) {
      setError('Authentication token is invalid or expired. Please log in again.');
      return;
    }

    // Check user role
    const role = api.getUserRole();
    if (!role || !role.toLowerCase().includes('admin')) {
      setError('Access denied. Admin privileges required.');
      return;
    }

    fetchTrucks();
    fetchDrivers();
  }, []);

  const fetchTrucks = async () => {
    try {
      const data = await api.fetchAllTrucks();
      
      // Fetch drivers to map driverId to driver names
      const driversData = await api.fetchAllUsers();
      const driverUsers = driversData.filter(user => 
        user.role && user.role.toLowerCase().includes('driver')
      );
      
      // Create a map of driverId to driver info
      const driverMap = {};
      driverUsers.forEach(driver => {
        driverMap[driver.userId] = {
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email
        };
      });
      
      // Enhance truck data with driver names
      const enhancedTrucks = data.map(truck => {
        const driverName = truck.driverId && driverMap[truck.driverId] 
          ? `${driverMap[truck.driverId].firstName} ${driverMap[truck.driverId].lastName}`
          : null;
        
        console.log(`Truck ${truck.plateNumber}: driverId=${truck.driverId}, driverName=${driverName}`);
        
        return {
          ...truck,
          driverName
        };
      });
      
      setAllTrucks(enhancedTrucks);
      setTrucks(enhancedTrucks);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else {
        setError('Failed to fetch trucks. Please try again later.');
      }
      setTrucks([]);
      setAllTrucks([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await api.fetchAllUsers();
      // Filter users with driver role
      const driverUsers = data.filter(user => 
        user.role && user.role.toLowerCase().includes('driver')
      );
      setDrivers(driverUsers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const applyFilters = () => {
    let filteredTrucks = [...allTrucks];

    // Apply filter type
    if (filterType === 'unassigned') {
      filteredTrucks = filteredTrucks.filter(truck => !truck.driverId);
    } else if (filterType === 'assigned') {
      filteredTrucks = filteredTrucks.filter(truck => truck.driverId);
    }

    // Apply search query
    if (searchQuery) {
      filteredTrucks = filteredTrucks.filter(truck =>
        truck.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (truck.driverName && truck.driverName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setTrucks(filteredTrucks);
  };

  useEffect(() => {
    applyFilters();
  }, [allTrucks, filterType, searchQuery]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOpenDialog = (truck = null) => {
    if (truck) {
      setSelectedTruck(truck);
      setFormData({
        size: truck.size,
        wasteType: truck.wasteType,
        status: truck.status,
        make: truck.make,
        model: truck.model,
        plateNumber: truck.plateNumber,
        truckPrice: truck.truckPrice || '',
      });
    } else {
      setSelectedTruck(null);
      setFormData({
        size: '',
        wasteType: '',
        status: 'AVAILABLE',
        make: '',
        model: '',
        plateNumber: '',
        truckPrice: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTruck(null);
    setFormData({
      size: '',
      wasteType: '',
      status: 'AVAILABLE',
      make: '',
      model: '',
      plateNumber: '',
      truckPrice: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTruck) {
        await api.updateTruck(selectedTruck.truckId, formData);
      } else {
        await api.createTruck(formData);
      }
      handleCloseDialog();
      fetchTrucks();
    } catch (error) {
      console.error('Error saving truck:', error);
      setError('Failed to save truck. Please try again.');
    }
  };

  const handleDelete = async (truckId) => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      try {
        await api.deleteTruck(truckId);
        fetchTrucks();
        setSuccess('Truck deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting truck:', error);
        setError('Failed to delete truck. Please try again.');
      }
    }
  };

  const handleAssignDriver = (truck) => {
    setSelectedTruck(truck);
    setSelectedDriver(truck.driverId || '');
    setAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog(false);
    setSelectedTruck(null);
    setSelectedDriver('');
  };

  const handleAssignSubmit = async () => {
    if (!selectedTruck || !selectedDriver) return;

    try {
      await api.assignDriverToTruck(selectedTruck.truckId, selectedDriver);
      await fetchTrucks(); // Refresh truck data to get updated driver names
      handleCloseAssignDialog();
      setSuccess('Driver assigned successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error assigning driver:', error);
      setError('Failed to assign driver. Please try again.');
    }
  };

  const handleRemoveDriver = async (truckId) => {
    if (window.confirm('Are you sure you want to remove the driver from this truck?')) {
      try {
        await api.removeDriverFromTruck(truckId);
        await fetchTrucks(); // Refresh truck data to get updated driver names
        setSuccess('Driver removed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error removing driver:', error);
        setError('Failed to remove driver. Please try again.');
      }
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: '100%', bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: 1 }}>
            Trucks Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ fontWeight: 600, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Add New Truck
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>
        )}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search trucks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <ToggleButtonGroup
            value={filterType}
            exclusive
            onChange={(e, newFilter) => setFilterType(newFilter)}
            aria-label="filter type"
            sx={{ height: '56px' }}
          >
            <ToggleButton value="all">All Trucks</ToggleButton>
            <ToggleButton value="unassigned">Unassigned</ToggleButton>
            <ToggleButton value="assigned">Assigned</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(30,41,59,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell>Plate Number</TableCell>
                <TableCell>Make</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Waste Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trucks.map(truck => (
                <TableRow key={truck.truckId} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: '#e0f2fe' } }}>
                  <TableCell>{truck.plateNumber}</TableCell>
                  <TableCell>{truck.make}</TableCell>
                  <TableCell>{truck.model}</TableCell>
                  <TableCell>{truck.size}</TableCell>
                  <TableCell>{truck.capacity ? `${truck.capacity}kg` : '-'}</TableCell>
                  <TableCell>{truck.truckPrice !== undefined && truck.truckPrice !== null ? `₱${Number(truck.truckPrice).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{truck.wasteType}</TableCell>
                  <TableCell>
                    <Chip 
                      label={truck.status} 
                      color={truck.status === 'AVAILABLE' ? 'success' : truck.status === 'CURRENTLY_IN_USE' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {truck.driverName ? (
                      <Chip 
                        label={truck.driverName} 
                        color="primary" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        label="Unassigned" 
                        color="default" 
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(truck)} size="small" title="Edit Truck">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleAssignDriver(truck)} size="small" title="Assign Driver">
                      <PersonAdd />
                    </IconButton>
                    {truck.driverId && (
                      <IconButton onClick={() => handleRemoveDriver(truck.truckId)} size="small" title="Remove Driver">
                        <PersonRemove />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDelete(truck.truckId)} size="small" title="Delete Truck">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
          <DialogTitle>{selectedTruck ? 'Edit Truck' : 'Add New Truck'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                label="Plate Number"
                value={formData.plateNumber}
                onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Make"
                value={formData.make}
                onChange={e => setFormData({ ...formData, make: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Model"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Size</InputLabel>
                <Select
                  value={formData.size}
                  onChange={e => setFormData({ ...formData, size: e.target.value })}
                  label="Size"
                >
                  <MenuItem value="SMALL">Small</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LARGE">Large</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Waste Type</InputLabel>
                <Select
                  value={formData.wasteType}
                  onChange={e => setFormData({ ...formData, wasteType: e.target.value })}
                  label="Waste Type"
                >
                  <MenuItem value="PLASTIC">Plastic</MenuItem>
                  <MenuItem value="PAPER">Paper</MenuItem>
                  <MenuItem value="METAL">Metal</MenuItem>
                  <MenuItem value="GLASS">Glass</MenuItem>
                  <MenuItem value="ELECTRONIC">Electronic</MenuItem>
                  <MenuItem value="ORGANIC">Organic</MenuItem>
                  <MenuItem value="MIXED">Mixed</MenuItem>
                  <MenuItem value="HAZARDOUS">Hazardous</MenuItem>
                  <MenuItem value="RECYCLABLE">Recyclable</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="CURRENTLY_IN_USE">Currently In Use</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Price"
                type="number"
                value={formData.truckPrice}
                onChange={e => setFormData({ ...formData, truckPrice: e.target.value })}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  inputProps: { min: 0 }
                }}
              />
              <TextField
                label="Capacity (kg)"
                type="number"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  inputProps: { min: 0, step: 0.1 }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained">{selectedTruck ? 'Save Changes' : 'Add Truck'}</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Driver Assignment Dialog */}
        <Dialog open={assignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
          <DialogTitle>
            {selectedTruck?.driverId ? 'Change Driver' : 'Assign Driver'} - {selectedTruck?.plateNumber}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                label="Select Driver"
              >
                {drivers.map(driver => (
                  <MenuItem key={driver.userId} value={driver.userId}>
                    {driver.firstName} {driver.lastName} ({driver.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {drivers.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No drivers found. Please add drivers with 'driver' role first.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignDialog}>Cancel</Button>
            <Button 
              onClick={handleAssignSubmit} 
              variant="contained"
              disabled={!selectedDriver || drivers.length === 0}
            >
              {selectedTruck?.driverId ? 'Change Driver' : 'Assign Driver'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default Trucks; 