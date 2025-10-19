import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Zoom,
  Fade,
  IconButton,
} from '@mui/material';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const BarangayPage = () => {
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [barangayToDelete, setBarangayToDelete] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBarangayName, setNewBarangayName] = useState('');
  const [newBarangayDescription, setNewBarangayDescription] = useState('');
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  // Fetch barangays from backend
  const fetchBarangays = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/barangays');
      if (Array.isArray(response.data)) {
        setBarangays(response.data);
      } else {
        setBarangays([]);
      }
    } catch (error) {
      console.error('Error fetching barangays:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Access denied. Please log in again with admin privileges.');
      } else {
        setError('Failed to fetch barangays. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchBarangays();
    }
  }, [navigate]);

  // Handle Add Barangay
  const handleAddBarangay = async () => {
    if (!newBarangayName.trim()) {
      setAddError('Barangay name cannot be empty.');
      return;
    }
    try {
      setAddError('');
      await api.post('/barangays', { 
        name: newBarangayName, 
        description: newBarangayDescription 
      });
      setNewBarangayName('');
      setNewBarangayDescription('');
      setAddDialogOpen(false);
      fetchBarangays();
    } catch (error) {
      console.error('Error adding barangay:', error);
      setAddError(error.response?.data?.error || 'Failed to add barangay.');
    }
  };

  // Handle Reactivate Barangay
  const handleReactivateBarangay = async (barangayId) => {
    try {
      await api.put(`/barangays/${barangayId}/reactivate`);
      fetchBarangays();
    } catch (error) {
      console.error('Error reactivating barangay:', error);
      setError(error.response?.data?.error || 'Failed to reactivate barangay.');
    }
  };

  // Handle Deactivate Barangay (soft delete)
  const handleDeactivateBarangay = async (barangayId) => {
    try {
      await api.delete(`/barangays/${barangayId}`);
      setDeleteDialogOpen(false);
      setBarangayToDelete(null);
      fetchBarangays();
    } catch (error) {
      console.error('Error deactivating barangay:', error);
      setError(error.response?.data?.error || 'Failed to deactivate barangay.');
    }
  };

  const openDeleteDialog = (barangay) => {
    setBarangayToDelete(barangay);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBarangayToDelete(null);
  };

  // Helper to format Firestore Timestamp, ISO string, or Date object
  const formatDate = (createdAt) => {
    if (!createdAt) return 'N/A';
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleString();
    }
    if (createdAt._seconds) {
      return new Date(createdAt._seconds * 1000).toLocaleString();
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString();
    }
    if (typeof createdAt === 'string') {
      const date = new Date(createdAt);
      if (!isNaN(date)) return date.toLocaleString();
    }
    if (createdAt instanceof Date) {
      return createdAt.toLocaleString();
    }
    return 'N/A';
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

  if (error) {
    return (
      <AdminLayout>
        <Box sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
          minHeight: '100vh',
        }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            {error}
          </Alert>
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
                    <LocationCityIcon sx={{ fontSize: 36, color: 'white' }} />
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
                      Barangay Management
                    </Typography>
                    
                  </Box>
                </Box>

                <Button 
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)} 
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
                  Add New Barangay
                </Button>
              </Box>
            </Paper>
          </Fade>

          {/* Statistics Cards */}
          <Zoom in timeout={600}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
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
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Barangays</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{barangays.length}</Typography>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(86, 171, 47, 0.3)',
              }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Active Barangays</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {barangays.filter(b => b.active === true || b.active === 'true').length}
                </Typography>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(247, 151, 30, 0.3)',
              }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Inactive Barangays</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {barangays.filter(b => b.active === false || b.active === 'false').length}
                </Typography>
              </Paper>
            </Box>
          </Zoom>

          {/* Table Section */}
          <Zoom in timeout={700}>
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
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: '0.95rem',
                      py: 2.5,
                    }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: '0.95rem',
                    }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: '0.95rem',
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: '0.95rem',
                    }}>
                      Created At
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: 'white',
                      fontSize: '0.95rem',
                    }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {barangays.map((barangay, index) => (
                    <TableRow 
                      key={barangay.barangayId}
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
                          label={barangay.barangayId}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                            color: '#2e7d32',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#212121' }}>
                          {barangay.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={barangay.active === true || barangay.active === 'true' ? 
                            <CheckCircleIcon sx={{ fontSize: 16 }} /> : 
                            <CancelIcon sx={{ fontSize: 16 }} />
                          }
                          label={barangay.active === true || barangay.active === 'true' ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: barangay.active === true || barangay.active === 'true' ? 
                              'rgba(67, 160, 71, 0.15)' : 'rgba(245, 124, 0, 0.15)',
                            color: barangay.active === true || barangay.active === 'true' ? 
                              '#43a047' : '#f57c00',
                            fontWeight: 700,
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                          {formatDate(barangay.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleReactivateBarangay(barangay.barangayId)} 
                            disabled={barangay.active === true || barangay.active === 'true'}
                            sx={{
                              borderColor: '#43a047',
                              color: '#43a047',
                              fontWeight: 600,
                              borderRadius: '10px',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#2e7d32',
                                bgcolor: 'rgba(67, 160, 71, 0.08)',
                              },
                              '&.Mui-disabled': {
                                borderColor: '#e0e0e0',
                                color: '#bdbdbd',
                              },
                            }}
                          >
                            Reactivate
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => openDeleteDialog(barangay)} 
                            disabled={!(barangay.active === true || barangay.active === 'true')}
                            sx={{
                              borderColor: '#f44336',
                              color: '#f44336',
                              fontWeight: 600,
                              borderRadius: '10px',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#d32f2f',
                                bgcolor: 'rgba(244, 67, 54, 0.08)',
                              },
                              '&.Mui-disabled': {
                                borderColor: '#e0e0e0',
                                color: '#bdbdbd',
                              },
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Zoom>
        </Box>

        {/* Add Barangay Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          PaperProps={{ 
            sx: { 
              borderRadius: '24px', 
              p: 2,
              minWidth: { xs: '90%', sm: '500px' },
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 700,
            color: '#1b5e20',
            pb: 2,
          }}>
            Add New Barangay
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {addError && (
                <Alert severity="error" sx={{ borderRadius: '12px' }}>
                  {addError}
                </Alert>
              )}
              <TextField
                label="Barangay Name"
                fullWidth
                value={newBarangayName}
                onChange={(e) => setNewBarangayName(e.target.value)}
                variant="outlined"
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
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                value={newBarangayDescription}
                onChange={(e) => setNewBarangayDescription(e.target.value)}
                variant="outlined"
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
              onClick={() => setAddDialogOpen(false)}
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
              onClick={handleAddBarangay}
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
              Add Barangay
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          PaperProps={{ 
            sx: { 
              borderRadius: '24px', 
              p: 2,
              minWidth: { xs: '90%', sm: '400px' },
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 700,
            color: '#d32f2f',
            pb: 2,
          }}>
            Confirm Deletion
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
              Are you sure you want to delete barangay <strong>"{barangayToDelete?.name}"</strong>? This will soft delete it and mark it as inactive.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button 
              onClick={closeDeleteDialog}
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
              onClick={() => handleDeactivateBarangay(barangayToDelete?.barangayId)}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                px: 4,
                py: 1,
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                  boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)',
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default BarangayPage;