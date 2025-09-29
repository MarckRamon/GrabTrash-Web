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
} from '@mui/material';
import { Search } from '@mui/icons-material';
import AdminLayout from './components/AdminLayout';
import axios from 'axios';
import api from './api/axios';

const JobOrderRequest = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [driverMap, setDriverMap] = useState({}); // { driverId: {firstName, lastName, ...} }
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

  // Fetch drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const allUsers = await api.fetchAllUsers();
        const driverList = allUsers.filter(u => u.role && u.role.toLowerCase() === 'driver');
        setDrivers(driverList);
        // Build a map for quick lookup
        const map = {};
        driverList.forEach(d => { map[d.userId] = d; });
        setDriverMap(map);
      } catch (e) {
        setDrivers([]);
      }
    };
    fetchDrivers();
  }, []);

  // Add new useEffect for fetching trucks
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const data = await api.fetchAllTrucks();
        setTrucks(data);
        // Build a map for quick lookup
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

  // Map backend fields to table fields
  const mappedOrders = orders.map((order, idx) => ({
    id: order.id || idx,
    name: order.customerName || '',
    receiptNo: order.paymentReference || '',
    phoneNo: order.phoneNumber || '',
    location: order.address || '',
    totalAmount: order.totalAmount || '',
    paymentMethod: order.paymentMethod || '',
    driverId: order.driverId || '',
    truckId: order.truckId || '',
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAssignModal = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setAssignModalOpen(true);
  };
  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedPaymentId(null);
  };
  const handleAssignDriver = async (driverId) => {
    setAssignLoading(true);
    try {
      await api.assignDriverToPayment(selectedPaymentId, driverId);
      // Refresh orders after assignment
      const response = await api.get('/payments');
      setOrders(response.data);
      handleCloseAssignModal();
    } catch (e) {
      // Optionally show error
      setAssignLoading(false);
    }
    setAssignLoading(false);
  };

  // Add new handlers for truck assignment
  const handleOpenAssignTruckModal = (paymentId) => {
    setSelectedPaymentForTruck(paymentId);
    setAssignTruckModalOpen(true);
  };

  const handleCloseAssignTruckModal = () => {
    setAssignTruckModalOpen(false);
    setSelectedPaymentForTruck(null);
  };

  const handleAssignTruck = async (truckId) => {
    setAssignTruckLoading(true);
    try {
      await api.assignTruckToPayment(selectedPaymentForTruck, truckId);
      // Refresh orders after assignment
      const response = await api.get('/payments');
      setOrders(response.data);
      handleCloseAssignTruckModal();
    } catch (error) {
      console.error('Error assigning truck:', error);
    }
    setAssignTruckLoading(false);
  };

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: '100%', bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: 1 }}>
            Job Order Request
          </Typography>
        </Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
            Job Orders Request
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
                <MenuItem value="location">Location</MenuItem>
              </Select>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(30,41,59,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Receipt No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Phone No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Assigned Truck</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                <TableRow key={order.id} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: '#e0f2fe' } }}>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.receiptNo}</TableCell>
                  <TableCell>{order.phoneNo}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{order.totalAmount !== '' ? `₱${Number(order.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    {order.truckId ? (
                      truckMap[order.truckId]
                        ? `${truckMap[order.truckId].plateNumber} (${truckMap[order.truckId].make} ${truckMap[order.truckId].model})`
                        : order.truckId
                    ) : (
                      <Button variant="contained" size="small" onClick={() => handleOpenAssignTruckModal(order.id)}>
                        Assign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[8, 16, 24]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}
          />
        </TableContainer>
      </Box>


      {/* Add new Assign Truck Modal */}
      <Dialog open={assignTruckModalOpen} onClose={handleCloseAssignTruckModal} PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogTitle>Assign Truck</DialogTitle>
        <DialogContent>
          {assignTruckLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {trucks.filter(truck => truck.status === 'AVAILABLE').length === 0 && (
                <ListItem>No available trucks found.</ListItem>
              )}
              {trucks
                .filter(truck => truck.status === 'AVAILABLE')
                .map(truck => (
                  <ListItem 
                    button 
                    key={truck.truckId} 
                    onClick={() => handleAssignTruck(truck.truckId)}
                  >
                    <ListItemText 
                      primary={`${truck.plateNumber} (${truck.make} ${truck.model})`}
                      secondary={`Size: ${truck.size} | Waste Type: ${truck.wasteType}`}
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignTruckModal}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default JobOrderRequest; 