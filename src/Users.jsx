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
  Chip,
  Avatar,
  Fade,
  Zoom,
  Tooltip,
} from '@mui/material';
import {
  Search,
  PersonAdd,
  Edit,
  Delete,
  People,
  AdminPanelSettings,
  LocalShipping,
  Business,
  Person,
} from '@mui/icons-material';
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/users/all');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data?.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
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
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in again.');
          navigate('/');
          return;
        }

        const response = await api.delete(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data?.message) {
          alert(response.data.message);
        }

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

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again.');
        navigate('/');
        return;
      }

      await api.put(`/users/${updatedUser.userId}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'name') {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    } else if (sortBy === 'role') {
      return a.role.localeCompare(b.role);
    }
    return 0;
  });

  const getRoleIcon = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin')) return <AdminPanelSettings sx={{ fontSize: 18 }} />;
    if (roleLower.includes('driver')) return <LocalShipping sx={{ fontSize: 18 }} />;
    if (roleLower.includes('private')) return <Business sx={{ fontSize: 18 }} />;
    return <Person sx={{ fontSize: 18 }} />;
  };

  const getRoleColor = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin')) return { bg: 'rgba(156, 39, 176, 0.15)', color: '#9c27b0' };
    if (roleLower.includes('driver')) return { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196f3' };
    if (roleLower.includes('private')) return { bg: 'rgba(255, 152, 0, 0.15)', color: '#ff9800' };
    return { bg: 'rgba(67, 160, 71, 0.15)', color: '#43a047' };
  };

  const getRoleLabel = (role) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'user' || roleLower === 'customer') return 'Customer';
    if (roleLower === 'private_entity') return 'Private Entity';
    if (roleLower === 'collector') return 'Collector';
    if (roleLower === 'driver') return 'Driver';
    if (roleLower === 'admin') return 'Admin';
    return role || 'N/A';
  };

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role.toLowerCase().includes('admin')).length,
    drivers: users.filter(u => u.role.toLowerCase().includes('driver')).length,
    customers: users.filter(u => u.role.toLowerCase().includes('customer')).length,
    privateEntities: users.filter(u => u.role.toLowerCase().includes('private')).length,
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

  if (!allowed) return null;

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
                    <People sx={{ fontSize: 36, color: 'white' }} />
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
                      Users Management
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                      Manage all system users and roles
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setCreateDialogOpen(true)}
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
                  Create New User
                </Button>
              </Box>
            </Paper>
          </Fade>

          {/* Error Alert */}
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

          {/* Statistics Cards */}
          <Zoom in timeout={600}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
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
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Users</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{userStats.total}</Typography>
                  </Box>
                  <People sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(156, 39, 176, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Admins</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{userStats.admins}</Typography>
                  </Box>
                  <AdminPanelSettings sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Drivers</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{userStats.drivers}</Typography>
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
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Customers</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{userStats.customers}</Typography>
                  </Box>
                  <Person sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>

              <Paper sx={{
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Private Entities</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{userStats.privateEntities}</Typography>
                  </Box>
                  <Business sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </Paper>
            </Box>
          </Zoom>

          {/* Search and Sort Section */}
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
                  placeholder="Search users..."
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, color: '#666', whiteSpace: 'nowrap' }}>
                    Sort by:
                  </Typography>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      minWidth: 150,
                      borderRadius: '16px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(46, 125, 50, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2e7d32',
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
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, index) => (
                    <TableRow
                      key={user.userId}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{
                            bgcolor: '#2e7d32',
                            width: 40,
                            height: 40,
                            fontWeight: 700,
                          }}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {`${user.firstName} ${user.lastName}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={getRoleLabel(user.role)}
                          size="small"
                          sx={{
                            bgcolor: getRoleColor(user.role).bg,
                            color: getRoleColor(user.role).color,
                            fontWeight: 700,
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit User">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Edit fontSize="small" />}
                              onClick={() => handleEdit(user)}
                              sx={{
                                borderColor: '#2e7d32',
                                color: '#2e7d32',
                                fontWeight: 600,
                                borderRadius: '10px',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: '#1b5e20',
                                  bgcolor: 'rgba(46, 125, 50, 0.08)',
                                },
                              }}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Delete fontSize="small" />}
                              onClick={() => handleDelete(user.userId)}
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
                              }}
                            >
                              Delete
                            </Button>
                          </Tooltip>
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
                sx={{
                  bgcolor: 'rgba(46, 125, 50, 0.02)',
                  borderTop: '2px solid rgba(46, 125, 50, 0.1)',
                }}
              />
            </TableContainer>
          </Zoom>
        </Box>

        {/* Dialogs */}
        <EditUserDialog
          open={editDialogOpen}
          onClose={handleCloseDialog}
          user={selectedUser}
          onSave={handleSaveUser}
          PaperProps={{ sx: { borderRadius: '24px', p: 2 } }}
        />
        <CreateUserDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onUserCreated={fetchUsers}
          PaperProps={{ sx: { borderRadius: '24px', p: 2 } }}
        />
      </Box>
    </AdminLayout>
  );
};

export default Users;