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
  TextField
} from '@mui/material';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';

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
        setBarangays([]); // fallback
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
    // Check for admin role, similar to other admin pages
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard'); // Redirect if not admin
    } else {
      fetchBarangays(); // Fetch data only if admin
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
      // Assuming your backend POST /api/barangays expects a JSON body with 'name' and 'description'
      await api.post('/barangays', { name: newBarangayName, description: newBarangayDescription });
      setNewBarangayName('');
      setNewBarangayDescription('');
      setAddDialogOpen(false);
      fetchBarangays(); // Refresh list
    } catch (error) {
      console.error('Error adding barangay:', error);
      setAddError(error.response?.data?.error || 'Failed to add barangay.');
    }
  };

  // Handle Delete Barangay
  const handleDeleteBarangay = async (barangayId) => {
    try {
      await api.delete(`/barangays/${barangayId}`);
      setDeleteDialogOpen(false);
      fetchBarangays(); // Refresh list
    } catch (error) {
      console.error('Error deleting barangay:', error);
      setError(error.response?.data?.error || 'Failed to delete barangay.');
    }
  };

  // Handle Reactivate Barangay (assuming backend handles this via PUT /reactivate)
  const handleReactivateBarangay = async (barangayId) => {
    try {
      // Assuming your backend PUT /api/barangays/{barangayId}/reactivate handles reactivation
      await api.put(`/barangays/${barangayId}/reactivate`);
      fetchBarangays(); // Refresh list
    } catch (error) {
      console.error('Error reactivating barangay:', error);
      setError(error.response?.data?.error || 'Failed to reactivate barangay.');
    }
  };

  // Handle Deactivate Barangay (soft delete)
  const handleDeactivateBarangay = async (barangayId) => {
    try {
      await api.delete(`/barangays/${barangayId}`);
      fetchBarangays(); // Refresh list
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
    // Firestore Timestamp (native)
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleString();
    }
    // Firestore Timestamp (plain object)
    if (createdAt._seconds) {
      return new Date(createdAt._seconds * 1000).toLocaleString();
    }
    // Firestore Timestamp (seconds)
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString();
    }
    // ISO string
    if (typeof createdAt === 'string') {
      const date = new Date(createdAt);
      if (!isNaN(date)) return date.toLocaleString();
    }
    // JS Date object
    if (createdAt instanceof Date) {
      return createdAt.toLocaleString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: '100%', bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e293b', letterSpacing: 1 }}>
          Barangay Management
        </Typography>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
            Barangays
          </Typography>
          <Button variant="contained" onClick={() => setAddDialogOpen(true)} sx={{ fontWeight: 600, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>Add New Barangay</Button>
        </Box>
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(30,41,59,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {barangays.map((barangay) => (
                <TableRow key={barangay.barangayId} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: '#e0f2fe' } }}>
                  <TableCell>{barangay.barangayId}</TableCell>
                  <TableCell>{barangay.name}</TableCell>
                  <TableCell>{barangay.active === true || barangay.active === 'true' ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{formatDate(barangay.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" color="secondary" onClick={() => handleReactivateBarangay(barangay.barangayId)} disabled={barangay.active === true || barangay.active === 'true'}>
                      Reactivate
                    </Button>
                    <Button variant="outlined" size="small" color="error" onClick={() => openDeleteDialog(barangay)} disabled={!(barangay.active === true || barangay.active === 'true')} sx={{ ml: 1 }}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
          <DialogContent>
            <Typography id="alert-dialog-description">
              Are you sure you want to delete barangay "{barangayToDelete?.name}"? This will soft delete it.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} color="primary">Cancel</Button>
            <Button onClick={() => handleDeleteBarangay(barangayToDelete?.barangayId)} color="error" autoFocus>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Add Barangay Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
          <DialogTitle>Add New Barangay</DialogTitle>
          <DialogContent>
            {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              label="Barangay Name"
              type="text"
              fullWidth
              value={newBarangayName}
              onChange={(e) => setNewBarangayName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              value={newBarangayDescription}
              onChange={(e) => setNewBarangayDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)} color="primary">Cancel</Button>
            <Button onClick={handleAddBarangay} color="primary">Add</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </AdminLayout>
  );
};

export default BarangayPage; 