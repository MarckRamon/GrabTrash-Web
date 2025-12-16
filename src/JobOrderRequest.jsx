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
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  Avatar,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Search,
  LocalShipping,
  Receipt,
  Phone,
  LocationOn,
  Payment,
  CheckCircle,
  PendingActions,
  TrendingUp,
} from '@mui/icons-material';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';

const JobOrderRequest = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [trucks, setTrucks] = useState([]);
  const [truckMap, setTruckMap] = useState({});
  const [assignTruckModalOpen, setAssignTruckModalOpen] = useState(false);
  const [selectedPaymentForTruck, setSelectedPaymentForTruck] = useState(null);
  const [assignTruckLoading, setAssignTruckLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/payments');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching job orders:', error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const data = await api.fetchAllTrucks();
        setTrucks(data);
        const map = {};
        data.forEach(t => { map[t.truckId] = t; });
        setTruckMap(map);
      } catch (error) {
        console.error('Error fetching trucks:', error);
        setTrucks([]);
        setTruckMap({});
      }
    };
    fetchTrucks();
  }, []);

  const mappedOrders = orders.map((order, idx) => ({
    id: order.id || idx,
    name: order.customerName || '',
    receiptNo: order.paymentReference || '',
    phoneNo: order.phoneNumber || '',
    location: order.address || '',
    totalAmount: order.totalAmount || '',
    paymentMethod: order.paymentMethod || '',
    truckId: order.truckId || '',
    trashWeight: order.trashWeight || '',
    notes: order.notes || '',
  }));

  const filteredOrders = mappedOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.name.toLowerCase().includes(searchLower) ||
      order.receiptNo.toLowerCase().includes(searchLower) ||
      order.phoneNo.toLowerCase().includes(searchLower) ||
      order.location.toLowerCase().includes(searchLower) ||
      order.paymentMethod.toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics
  const totalOrders = filteredOrders.length;
  const assignedOrders = filteredOrders.filter(o => o.truckId).length;
  const pendingOrders = totalOrders - assignedOrders;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAssignTruckModal = (paymentId) => {
    setSelectedPaymentForTruck(paymentId);
    setAssignTruckModalOpen(true);
  };

  const handleCloseAssignTruckModal = () => {
    setAssignTruckModalOpen(false);
    setSelectedPaymentForTruck(null);
  };

  const handleAssignTruck = async (truckId) => {
    if (!selectedPaymentForTruck) return;
    setAssignTruckLoading(true);
    try {
      await api.assignTruckToPayment(selectedPaymentForTruck, truckId);

      const response = await api.get('/payments');
      setOrders(response.data);

      const trucksData = await api.fetchAllTrucks();
      setTrucks(trucksData);
      const map = {};
      trucksData.forEach(t => { map[t.truckId] = t; });
      setTruckMap(map);

      handleCloseAssignTruckModal();
    } catch (error) {
      console.error('Error assigning truck:', error);
      alert(error.response?.data?.message || 'Failed to assign truck. Please try again.');
    } finally {
      setAssignTruckLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4 },

        background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
        minHeight: '100vh',
      }}>
        {/* Header Section with Glassmorphism */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                width: 70,
                height: 70,
                borderRadius: '20px',

                background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                boxShadow: '0 10px 30px rgba(27, 94, 32, 0.4)',

              }}>
                <Receipt sx={{ fontSize: 36, color: 'white' }} />
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
                  Job Order Requests
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                  Manage and track all waste collection orders
                </Typography>
              </Box>
            </Box>

            {/* Statistics Cards */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3,
            }}>
              <Zoom in timeout={600}>
                <Paper sx={{
                  p: 2.5,
                  borderRadius: '20px',

                  background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',

                  color: 'white',
                  boxShadow: '0 8px 20px rgba(46, 125, 50, 0.3)',

                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Orders</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalOrders}</Typography>
                    </Box>
                    <Receipt sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </Paper>
              </Zoom>

              <Zoom in timeout={700}>
                <Paper sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(86, 171, 47, 0.3)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Assigned</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{assignedOrders}</Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </Paper>
              </Zoom>

              <Zoom in timeout={800}>
                <Paper sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(247, 151, 30, 0.3)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Pending</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{pendingOrders}</Typography>
                    </Box>
                    <PendingActions sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </Paper>
              </Zoom>

              <Zoom in timeout={900}>
                <Paper sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(67, 233, 123, 0.3)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Revenue</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>₱{totalRevenue.toLocaleString()}</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </Paper>
              </Zoom>
            </Box>

            {/* Search and Filter */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search by name, receipt, phone, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">

                      <Search sx={{ color: '#2e7d32' }} />

                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  minWidth: '300px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    bgcolor: '#f8f9fa',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover': {
                      bgcolor: '#f0f2f5',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',

                      boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.1)',
                    },
                  },
                }}
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  minWidth: 180,
                  borderRadius: '15px',
                  bgcolor: '#f8f9fa',
                  fontWeight: 600,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover': { bgcolor: '#f0f2f5' },
                }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="amount">Amount High-Low</MenuItem>
              </Select>
            </Box>
          </Paper>
        </Fade>

        {/* Orders Table */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '30px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{

                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                  }}>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', py: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt sx={{ fontSize: 20 }} />
                        Receipt #
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 20 }} />
                        Phone
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ fontSize: 20 }} />
                        Location
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Payment sx={{ fontSize: 20 }} />
                        Payment
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping sx={{ fontSize: 20 }} />
                        Truck Status
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Trash Weight</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((order, index) => (
                      <TableRow
                        key={order.id}
                        sx={{
                          bgcolor: index % 2 === 0 ? 'white' : 'rgba(46, 125, 50, 0.02)',
                          '&:hover': {
                            bgcolor: 'rgba(46, 125, 50, 0.08)',
                            transform: 'scale(1.01)',
                          },
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={order.receiptNo}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: 'rgba(46, 125, 50, 0.1)',
                              color: '#2e7d32',
                              borderRadius: '10px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {order.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                            {order.phoneNo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', color: '#666', maxWidth: 200 }}>
                            {order.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#2e7d32', fontSize: '0.95rem' }}>
                            ₱{parseFloat(order.totalAmount).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.paymentMethod === 'CASH_ON_HAND' ? 'Cash' : 'GCash'}
                            size="small"
                            sx={{
                              bgcolor: order.paymentMethod === 'CASH_ON_HAND'
                                ? 'rgba(86, 171, 47, 0.1)'
                                : 'rgba(56, 239, 125, 0.1)',
                              color: order.paymentMethod === 'CASH_ON_HAND' ? '#56ab2f' : '#38ef7d',
                              fontWeight: 600,
                              borderRadius: '10px',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {order.truckId ? (
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: '15px',
                              bgcolor: 'rgba(56, 171, 47, 0.08)',
                              border: '2px solid rgba(56, 171, 47, 0.2)',
                            }}>
                              <Avatar sx={{
                                bgcolor: '#56ab2f',
                                width: 40,
                                height: 40,
                              }}>
                                <LocalShipping sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#56ab2f' }}>
                                  {truckMap[order.truckId]?.plateNumber || order.truckId}
                                </Typography>
                                {truckMap[order.truckId] && (
                                  <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                                    {truckMap[order.truckId].make} {truckMap[order.truckId].model}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOpenAssignTruckModal(order.id)}
                              startIcon={<LocalShipping />}
                              sx={{

                                background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',

                                color: 'white',
                                fontWeight: 700,
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 2.5,
                                py: 1,
                                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',


                                },
                              }}
                            >
                              Assign Truck
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                            {order.trashWeight ? `${order.trashWeight} kg` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.9rem', color: '#666', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.notes}>
                            {order.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[8, 16, 24, 50]}
              component="div"
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                bgcolor: 'rgba(46, 125, 50, 0.03)',
                borderTop: '2px solid rgba(46, 125, 50, 0.1)',

                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 600,
                  color: '#2e7d32',
                },
              }}
            />
          </Paper>
        </Fade>

        {/* Assign Truck Modal */}
        <Dialog
          open={assignTruckModalOpen}
          onClose={handleCloseAssignTruckModal}
          TransitionComponent={Zoom}
          PaperProps={{
            sx: {
              borderRadius: '30px',
              p: 2,
              minWidth: '500px',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 800,
            fontSize: '1.8rem',

            background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2,
          }}>
            <Avatar sx={{
              width: 60,
              height: 60,
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            }}>
              <LocalShipping sx={{ fontSize: 30 }} />
            </Avatar>
            Select a Truck
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {assignTruckLoading ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
                gap: 2,
              }}>
                <CircularProgress
                  size={60}
                  thickness={4}
                  sx={{
                    color: '#2e7d32',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }}
                />
                <Typography sx={{ color: '#666', fontWeight: 600 }}>
                  Assigning truck...
                </Typography>
              </Box>
            ) : (
              <Box>
                {trucks.filter(truck => truck.status === 'AVAILABLE').length === 0 ? (
                  <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    color: '#999',
                  }}>
                    <LocalShipping sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No trucks available
                    </Typography>
                    <Typography variant="body2">
                      All trucks are currently assigned to other orders
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 1 }}>
                    {trucks
                      .filter(truck => truck.status === 'AVAILABLE')
                      .map((truck, index) => (
                        <Zoom in key={truck.truckId} timeout={300 + index * 100}>
                          <ListItem
                            onClick={() => handleAssignTruck(truck.truckId)}
                            sx={{
                              borderRadius: '20px',
                              mb: 2,
                              p: 2.5,
                              background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.05) 0%, rgba(56, 239, 125, 0.05) 100%)',
                              border: '2px solid rgba(17, 153, 142, 0.1)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%)',
                                borderColor: '#11998e',
                                transform: 'translateX(10px) scale(1.02)',
                                boxShadow: '0 8px 25px rgba(17, 153, 142, 0.2)',
                              },
                            }}
                          >
                            <Avatar sx={{
                              mr: 2.5,
                              width: 65,
                              height: 65,
                              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)',
                            }}>
                              <LocalShipping sx={{ fontSize: 32 }} />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography sx={{
                                  fontWeight: 800,
                                  fontSize: '1.1rem',
                                  color: '#11998e',
                                  mb: 0.5,
                                }}>
                                  {truck.plateNumber}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'block' }}>
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    sx={{
                                      color: '#666',
                                      display: 'block',
                                      fontWeight: 600,
                                      mb: 1,
                                    }}
                                  >
                                    {truck.make} {truck.model}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                      label={truck.size}
                                      size="small"
                                      sx={{
                                        bgcolor: 'rgba(56, 171, 47, 0.15)',
                                        color: '#56ab2f',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                      }}
                                    />
                                    <Chip
                                      label={truck.wasteType}
                                      size="small"
                                      sx={{
                                        bgcolor: 'rgba(247, 151, 30, 0.15)',
                                        color: '#f7971e',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                      }}
                                    />
                                    <Chip
                                      label="Available"
                                      size="small"
                                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                      sx={{
                                        bgcolor: 'rgba(67, 233, 123, 0.15)',
                                        color: '#43e97b',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                      }}
                                    />
                                  </Box>
                                </Box>
                              }
                              secondaryTypographyProps={{
                                component: 'div'
                              }}
                            />
                          </ListItem>
                        </Zoom>
                      ))}
                  </List>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={handleCloseAssignTruckModal}
              sx={{
                color: '#2e7d32',
                fontWeight: 700,
                fontSize: '1rem',
                px: 3,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(17, 153, 142, 0.08)',
                },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default JobOrderRequest;