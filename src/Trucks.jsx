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
  Avatar,
  Tooltip,
  Fade,
  Zoom,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  PersonAdd,
  PersonRemove,
  LocalShipping,
  DirectionsCar,
  Speed,
  AttachMoney,
  CheckCircle,
  Warning,
  Build,
} from '@mui/icons-material';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';

const Trucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
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
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    const decoded = api.getCurrentUser();
    if (!decoded) {
      setError('Authentication token is invalid or expired. Please log in again.');
      setLoading(false);
      return;
    }

    const role = api.getUserRole();
    if (!role || !role.toLowerCase().includes('admin')) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchTrucks();
    fetchDrivers();
  }, []);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const data = await api.fetchAllTrucks();

      // Try to build a map of drivers from all users (OPTIONAL – trucks may already contain driverName)
      let driverMap = {};
      try {
        const driversData = await api.fetchAllUsers();
        const driverUsers = driversData.filter(user =>
          user.role && user.role.toLowerCase().includes('driver')
        );
        driverUsers.forEach(driver => {
          const key = driver.userId || driver.id || driver.uid;
          if (!key) return;
          const name =
            `${driver.firstName || ''} ${driver.lastName || ''}`.trim() ||
            driver.username ||
            driver.email ||
            'Driver';
          driverMap[key] = name;
        });
      } catch (err) {
        console.warn('Unable to fetch drivers list, falling back to truck data only:', err);
      }

      const enhancedTrucks = data.map(truck => {
        let driverId = truck.driverId || truck.driverID || (truck.driver && (truck.driver.userId || truck.driver.id));
        if (driverId === 'null' || driverId === 'undefined') driverId = null; // Basic cleanup
        const nameFromMap = driverId ? driverMap[driverId] : null;
        const nameFromTruck = truck.driverName || truck.assignedDriverName || null;

        // Keep the status from the database as-is (no automatic status changes based on driver assignment)
        return {
          ...truck,
          driverId,
          driverName: nameFromMap || nameFromTruck || null,
        };
      });

      setAllTrucks(enhancedTrucks);
      applyFilters(enhancedTrucks, filterType, searchQuery);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else {
        setError('Failed to fetch trucks. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const users = await api.fetchAllUsers();
      const driverUsers = users.filter(user =>
        user.role && user.role.toLowerCase().includes('driver')
      );
      setDrivers(driverUsers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const applyFilters = (trucksToFilter, filter, search) => {
    let filtered = [...trucksToFilter];

    if (filter === 'unassigned') {
      filtered = filtered.filter(truck => !truck.driverId);
    } else if (filter === 'assigned') {
      filtered = filtered.filter(truck => truck.driverId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(truck =>
        truck.plateNumber?.toLowerCase().includes(searchLower) ||
        truck.make?.toLowerCase().includes(searchLower) ||
        truck.model?.toLowerCase().includes(searchLower) ||
        truck.wasteType?.toLowerCase().includes(searchLower) ||
        truck.driverName?.toLowerCase().includes(searchLower)
      );
    }

    setTrucks(filtered);
  };

  useEffect(() => {
    applyFilters(allTrucks, filterType, searchQuery);
  }, [filterType, searchQuery]);

  const handleOpenDialog = (truck = null) => {
    if (truck) {
      setSelectedTruck(truck);
      setFormData({
        size: truck.size || '',
        wasteType: truck.wasteType || '',
        status: truck.status || 'AVAILABLE',
        make: truck.make || '',
        model: truck.model || '',
        plateNumber: truck.plateNumber || '',
        truckPrice: truck.truckPrice || '',
        capacity: truck.capacity || '',
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
        capacity: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTruck(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTruck) {
        await api.updateTruck(selectedTruck.truckId, formData);
        setSuccess('Truck updated successfully');
      } else {
        await api.createTruck(formData);
        setSuccess('Truck added successfully');
      }
      fetchTrucks();
      handleCloseDialog();
      setTimeout(() => setSuccess(''), 3000);
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
      // Status is not automatically updated - user can manually change it

      await fetchTrucks();
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
        setSuccess('Driver removed successfully');
      } catch (error) {
        console.warn('Primary remove driver failed, attempting fallback update:', error);

        // Fallback: Try to update the truck directly to remove driver
        try {
          const truck = trucks.find(t => t.truckId === truckId);
          if (truck) {
            const updateData = {
              ...truck,
              driverId: null,
              driverName: null
              // Status is not automatically updated - user can manually change it
            };
            // Ensure we don't send derived fields that might confuse the backend
            delete updateData.driverName;

            await api.updateTruck(truckId, updateData);
            setSuccess('Driver removed successfully (via update)');
          } else {
            throw error; // Throw original error if we can't find truck
          }
        } catch (fallbackError) {
          console.error('Error removing driver:', fallbackError);
          setError('Failed to remove driver. Please try again.');
        }
      }

      // Always refresh
      await fetchTrucks();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'CURRENTLY_IN_USE':
        return <Warning sx={{ fontSize: 16 }} />;
      case 'MAINTENANCE':
        return <Build sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'rgba(67, 160, 71, 0.15)', color: '#43a047' };
      case 'CURRENTLY_IN_USE':
        return { bg: 'rgba(245, 124, 0, 0.15)', color: '#f57c00' };
      case 'MAINTENANCE':
        return { bg: 'rgba(244, 67, 54, 0.15)', color: '#f44336' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.15)', color: '#9e9e9e' };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
        }}>
          <CircularProgress sx={{ color: '#2e7d32' }} size={60} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #e8f5e9 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(104, 159, 56, 0.05) 100%)',
          borderRadius: '0 0 50% 50%',
          zIndex: 0,
        },
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header Section */}
          <Fade in timeout={800}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 70,
                    height: 70,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(46, 125, 50, 0.4)',
                  }}>
                    <LocalShipping sx={{ fontSize: 36, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-1px',
                        mb: 0.5,
                      }}
                    >
                      Trucks Management
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                      Manage your fleet of waste collection vehicles
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: '16px',
                    textTransform: 'none',
                    boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 25px rgba(46, 125, 50, 0.4)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  Add New Truck
                </Button>
              </Box>
            </Paper>
          </Fade>

          {/* Alerts */}
          {error && (
            <Fade in>
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {error}
              </Alert>
            </Fade>
          )}
          {success && (
            <Fade in>
              <Alert
                severity="success"
                onClose={() => setSuccess('')}
                sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {success}
              </Alert>
            </Fade>
          )}

          {/* Statistics Cards */}
          <Zoom in timeout={600}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4,
            }}>
              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(46, 125, 50, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Trucks</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{allTrucks.length}</Typography>
                  </Box>
                  <LocalShipping sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(86, 171, 47, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Available</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {allTrucks.filter(t => t.status === 'AVAILABLE').length}
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(247, 151, 30, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>In Use</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {allTrucks.filter(t => t.status === 'CURRENTLY_IN_USE').length}
                    </Typography>
                  </Box>
                  <Warning sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(238, 9, 121, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Maintenance</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {allTrucks.filter(t => t.status === 'MAINTENANCE').length}
                    </Typography>
                  </Box>
                  <Build sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>
            </Box>
          </Zoom>

          {/* Search and Filter Section */}
          <Zoom in timeout={700}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: '24px',
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Search trucks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flexGrow: 1,
                    minWidth: '250px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      bgcolor: '#f8f9fa',
                      '&:hover': {
                        bgcolor: '#fff',
                      },
                      '&.Mui-focused': {
                        bgcolor: '#fff',
                        '& fieldset': {
                          borderColor: '#2e7d32',
                        },
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#2e7d32' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <ToggleButtonGroup
                  value={filterType}
                  exclusive
                  onChange={(e, newFilter) => newFilter && setFilterType(newFilter)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 3,
                      py: 1.5,
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 600,
                      border: '2px solid rgba(46, 125, 50, 0.2)',
                      color: '#2e7d32',
                      '&.Mui-selected': {
                        bgcolor: '#2e7d32',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#1b5e20',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(46, 125, 50, 0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="all">All Trucks</ToggleButton>
                  <ToggleButton value="unassigned">Unassigned</ToggleButton>
                  <ToggleButton value="assigned">Assigned</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Paper>
          </Zoom>

          {/* Table Section */}
          <Zoom in timeout={800}>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                background: 'white',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{
                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                  }}>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', py: 2.5 }}>
                      Plate Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Make
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Model
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Size
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Capacity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Waste Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Driver
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trucks.map((truck, index) => (
                    <TableRow
                      key={truck.truckId}
                      sx={{
                        transition: 'all 0.3s',
                        bgcolor: index % 2 === 0 ? 'white' : 'rgba(46, 125, 50, 0.02)',
                        '&:hover': {
                          bgcolor: 'rgba(46, 125, 50, 0.08)',
                          transform: 'scale(1.01)',
                        },
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={truck.plateNumber}
                          sx={{
                            fontWeight: 700,
                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                            color: '#2e7d32',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {truck.make}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                          {truck.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={truck.size}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(33, 150, 243, 0.1)',
                            color: '#2196f3',
                            fontWeight: 600,
                            borderRadius: '8px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                          {truck.capacity ? `${truck.capacity}kg` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '0.9rem' }}>
                          {truck.truckPrice !== undefined && truck.truckPrice !== null
                            ? `₱${Number(truck.truckPrice).toLocaleString()}`
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={truck.wasteType}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                            color: '#9c27b0',
                            fontWeight: 600,
                            borderRadius: '8px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(truck.status)}
                          label={truck.status === 'CURRENTLY_IN_USE' ? 'In Use' : truck.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(truck.status).bg,
                            color: getStatusColor(truck.status).color,
                            fontWeight: 700,
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {truck.driverName ? (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: '12px',
                            bgcolor: 'rgba(46, 125, 50, 0.08)',
                          }}>
                            <Avatar sx={{
                              bgcolor: '#2e7d32',
                              width: 32,
                              height: 32,
                              fontSize: '0.85rem',
                            }}>
                              {truck.driverName.charAt(0)}
                            </Avatar>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                              {truck.driverName}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Unassigned"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(158, 158, 158, 0.15)',
                              color: '#9e9e9e',
                              fontWeight: 600,
                              borderRadius: '8px',
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {/* Edit truck details */}
                          <Tooltip title="Edit Truck">
                            <IconButton
                              onClick={() => handleOpenDialog(truck)}
                              size="small"
                              sx={{
                                color: '#2196f3',
                                '&:hover': {
                                  bgcolor: 'rgba(33, 150, 243, 0.08)',
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Assign or Change driver */}
                          <Tooltip title={truck.driverId ? 'Change Driver' : 'Assign Driver'}>
                            <IconButton
                              onClick={() => handleAssignDriver(truck)}
                              size="small"
                              sx={{
                                color: '#4CAF50',
                                '&:hover': {
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                },
                              }}
                            >
                              <PersonAdd fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Remove driver (only if assigned) */}
                          {truck.driverId && (
                            <Tooltip title="Remove Driver">
                              <IconButton
                                onClick={() => handleRemoveDriver(truck.truckId)}
                                size="small"
                                sx={{
                                  color: '#ff9800',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 152, 0, 0.1)',
                                  },
                                }}
                              >
                                <PersonRemove fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Delete truck */}
                          <Tooltip title="Delete Truck">
                            <IconButton
                              onClick={() => handleDelete(truck.truckId)}
                              size="small"
                              sx={{
                                color: '#f44336',
                                '&:hover': {
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Zoom>
        </Box>

        {/* Add/Edit Truck Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              p: 2,
            }
          }}
        >
          <DialogTitle sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1b5e20',
            pb: 2,
          }}>
            {selectedTruck ? 'Edit Truck' : 'Add New Truck'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <TextField
                  label="Plate Number"
                  value={formData.plateNumber}
                  onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#2e7d32',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2e7d32',
                    },
                  }}
                />
                <TextField
                  label="Make"
                  value={formData.make}
                  onChange={e => setFormData({ ...formData, make: e.target.value })}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#2e7d32',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2e7d32',
                    },
                  }}
                />
                <TextField
                  label="Model"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#2e7d32',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2e7d32',
                    },
                  }}
                />
                <FormControl fullWidth required>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#2e7d32' } }}>Size</InputLabel>
                  <Select
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    label="Size"
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                    }}
                  >
                    <MenuItem value="SMALL">Small</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LARGE">Large</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#2e7d32' } }}>Waste Type</InputLabel>
                  <Select
                    value={formData.wasteType}
                    onChange={e => setFormData({ ...formData, wasteType: e.target.value })}
                    label="Waste Type"
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                    }}
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
                <FormControl fullWidth required>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#2e7d32' } }}>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                    }}
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
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#2e7d32',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2e7d32',
                    },
                  }}
                />
                <TextField
                  label="Capacity (kg)"
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#2e7d32',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#2e7d32',
                    },
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
              <Button
                onClick={handleCloseDialog}
                sx={{
                  color: '#666',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.05)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                  color: 'white',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                  },
                }}
              >
                {selectedTruck ? 'Save Changes' : 'Add Truck'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Assign Driver Dialog */}
        <Dialog
          open={assignDialog}
          onClose={handleCloseAssignDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              p: 2,
            }
          }}
        >
          <DialogTitle sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1b5e20',
            pb: 2,
          }}>
            {selectedTruck?.driverId ? 'Change Driver' : 'Assign Driver'}
            <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 0.5 }}>
              Truck: {selectedTruck?.plateNumber}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {drivers.length === 0 ? (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: '12px',
                    mb: 2,
                  }}
                >
                  No drivers found. Please add drivers with 'driver' role first.
                </Alert>
              ) : (
                <FormControl fullWidth required>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#2e7d32' } }}>Select Driver</InputLabel>
                  <Select
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                    label="Select Driver"
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                    }}
                  >
                    {drivers.map(driver => (
                      <MenuItem key={driver.userId} value={driver.userId}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            bgcolor: '#2e7d32',
                            width: 32,
                            height: 32,
                            fontSize: '0.85rem',
                          }}>
                            {driver.firstName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {driver.firstName} {driver.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                              {driver.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={handleCloseAssignDialog}
              sx={{
                color: '#666',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              variant="contained"
              disabled={!selectedDriver}
              sx={{
                background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                px: 4,
                py: 1,
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                },
                '&.Mui-disabled': {
                  background: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              Assign Driver
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default Trucks;