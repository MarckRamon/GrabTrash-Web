import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import AdminLayout from './components/AdminLayout';
import EditUserDialog from './components/EditUserDialog';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';
import CreateUserDialog from './components/CreateUserDialog';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [allowed, setAllowed] = useState(null);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/users/all');
      // Accept both { users: [...] } and [...] as valid responses
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data?.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]); // fallback
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Access denied. Please log in again with admin privileges.');
      } else {
        setError('Failed to fetch users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (user) => {
    // Ensure we have the complete user object with userId
    if (!user || !user.userId) {
      console.error('Invalid user data:', user);
      return;
    }
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!userId) {
      alert('Invalid user ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in again.');
          navigate('/');
          return;
        }

        // Add /api prefix and ensure we're using the correct endpoint
        const response = await api.delete(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data?.message) {
          alert(response.data.message);
        }
        
        // Refresh the users list after successful deletion
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error.response?.status === 403) {
          alert('Access denied. Only admin users can delete accounts.');
        } else if (error.response?.status === 404) {
          alert('User not found. The user might have been already deleted.');
        } else if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('Failed to delete user. Please try again.');
        }
      }
    }
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      // Close the dialog first
      setEditDialogOpen(false);
      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Sort users based on selected option
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'role':
        return a.role.localeCompare(b.role);
      case 'oldest':
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case 'newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  if (allowed === null) return null;

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: '100%', bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1e293b', letterSpacing: 1 }}>
          Users
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        )}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
            All Users
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Create New User
            </Button>
            <TextField
              placeholder="Search"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: '240px',
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
                Sort by:
              </Typography>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e5e7eb',
                  },
                }}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(30,41,59,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                <TableRow key={user.userId} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: '#e0f2fe' } }}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEdit(user)}
                        sx={{
                          color: '#059669',
                          borderColor: '#059669',
                          '&:hover': {
                            borderColor: '#047857',
                            bgcolor: '#f0fdf4',
                          },
                        }}
                      >
                        EDIT
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleDelete(user.userId)}
                        sx={{
                          color: '#dc2626',
                          borderColor: '#dc2626',
                          '&:hover': {
                            borderColor: '#b91c1c',
                            bgcolor: '#fef2f2',
                          },
                        }}
                      >
                        DELETE
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[8, 16, 24]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}
          />
        </TableContainer>
        <EditUserDialog
          open={editDialogOpen}
          onClose={handleCloseDialog}
          user={selectedUser}
          onSave={handleSaveUser}
          PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
        />
        <CreateUserDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onUserCreated={fetchUsers}
          PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
        />
      </Box>
    </AdminLayout>
  );
};

export default Users; 