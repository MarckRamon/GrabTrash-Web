import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';

// Mock data for the chart
const monthlyData = [
  { month: 'JAN', value: 100 },
  { month: 'FEB', value: 150 },
  { month: 'MAR', value: 140 },
  { month: 'APR', value: 250 },
  { month: 'MAY', value: 280 },
  { month: 'JUN', value: 200 },
  { month: 'JUL', value: 220 },
  { month: 'AUG', value: 100 },
  { month: 'SEP', value: 180 },
  { month: 'OCT', value: 260 },
  { month: 'NOV', value: 300 },
  { month: 'DEC', value: 350 },
];

const AdminDashboard = () => {
  const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
  const isAdmin = role === 'admin';

  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [totalPickupTrash, setTotalPickupTrash] = useState(0);
  const [totalCollectionPoints, setTotalCollectionPoints] = useState(0);
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [barangaySchedules, setBarangaySchedules] = useState([]);
  const [topBarangays, setTopBarangays] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin) {
          // Admin-only API calls
          const usersResponse = await api.get('/users/total-active');
          setTotalActiveUsers(usersResponse.data.totalActiveUsers || 0);

          const statsResponse = await api.get('/payments/dashboard/stats');
          setTotalPickupTrash(statsResponse.data.totalPickupTrashOrdered || 0);

          try {
            const collectionPointsResponse = await api.get('/pickup-locations');
            const locations = collectionPointsResponse.data.locations || [];
            setTotalCollectionPoints(locations.length);
          } catch (error) {
            setTotalCollectionPoints(0);
          }
        } else {
          // For private_entity, only fetch what is allowed (e.g., collection points)
          setTotalActiveUsers(0);
          setTotalPickupTrash(0);
          setTotalCollectionPoints(0);
        }
      } catch (error) {
        // Handle error
        setTotalActiveUsers(0);
        setTotalPickupTrash(0);
        setTotalCollectionPoints(0);
      }
    };
    fetchDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    // Fetch barangays for calendar
    if (!isAdmin) return; // Only admin can see barangay calendar
    const fetchBarangays = async () => {
      try {
        const res = await api.get('/barangays');
        const brgys = Array.isArray(res.data) ? res.data : [res.data];
        setBarangays(brgys);
        if (brgys.length > 0) setSelectedBarangay(brgys[0]);
      } catch (e) {
        setBarangays([]);
      }
    };
    fetchBarangays();
  }, [isAdmin]);

  useEffect(() => {
    // Fetch schedules for selected barangay
    if (!isAdmin) return;
    if (!selectedBarangay) return;
    const fetchSchedules = async () => {
      try {
        const res = await api.get(`/collection-schedules/barangay/${selectedBarangay.barangayId}`);
        setBarangaySchedules(Array.isArray(res.data) ? res.data : [res.data]);
      } catch (e) {
        setBarangaySchedules([]);
      }
    };
    fetchSchedules();
  }, [selectedBarangay, isAdmin]);

  useEffect(() => {
    // Fetch top barangays (allowed for both roles)
    const fetchTopBarangays = async () => {
      try {
        const res = await api.get('/payments/top-barangays');
        setTopBarangays(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setTopBarangays([]);
      }
    };
    fetchTopBarangays();
  }, []);

  // Helper: get all booked days in current month
  const getBookedDays = () => {
    const booked = new Set();
    barangaySchedules.forEach(sch => {
      if (sch.collectionDateTime) {
        const date = new Date(sch.collectionDateTime);
        booked.add(date.getDate());
      }
      // Optionally handle recurring schedules here
    });
    return booked;
  };
  const bookedDays = getBookedDays();

  return (
    <AdminLayout>
      {/* Reports Header */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        Reports
      </Typography>

      {/* Timeframe Selector */}
      <Box sx={{ mb: 4 }}>
        <Select
          value="all-time"
          fullWidth
          sx={{
            bgcolor: 'white',
            '& .MuiSelect-select': { py: 1.5 },
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <MenuItem value="all-time">Timeframe: All-time</MenuItem>
        </Select>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isAdmin && (
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
                Active Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                {totalActiveUsers}
              </Typography>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
              Total Pickup Trash Ordered
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
              {totalPickupTrash.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '14px' }}>
              Total Collection Points
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
              {totalCollectionPoints.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Location Stats */}
        <Grid item xs={12} md={5}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              height: 'fit-content',
              bgcolor: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
              Top Most Ordered Location Pickup
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {topBarangays.map((barangay, index) => {
                const barangayName = barangays.find(b => b.barangayId === barangay.barangayId)?.name || barangay.barangayId;
                return (
                  <Box key={barangay.barangayId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        component="span"
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f1f5f9',
                          borderRadius: 1,
                          mr: 2,
                          fontSize: '24px'
                        }}
                      >
                        🚛
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#333', 
                          fontWeight: 500,
                          fontSize: '16px',
                        }}
                      >
                        {barangayName}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', height: 8, width: '100%', mb: 1 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          borderRadius: 4,
                          bgcolor: '#E8F5E9',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: `${(barangay.count / (topBarangays[0]?.count || 1)) * 100}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #4CAF50 0%, #43A047 100%)',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#333', 
                          fontWeight: 500,
                          fontSize: '16px',
                        }}
                      >
                        {barangay.count.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Activity and Calendar */}
        {isAdmin && (
        <Grid item xs={12} md={7}>
          {/* Activity Chart */}
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                Activity
              </Typography>
              <Select
                value="month"
                size="small"
                sx={{ 
                  minWidth: 100,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4CAF50',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#43A047',
                  },
                  color: '#4CAF50',
                  fontSize: '14px',
                }}
              >
                <MenuItem value="month">Month</MenuItem>
              </Select>
            </Box>
            <Box sx={{ height: 250, mt: 2 }}>
              <BarChart
                series={[
                  {
                    data: monthlyData.map(item => item.value),
                    color: '#4CAF50',
                    highlightScope: {
                      highlighted: 'item',
                    },
                    barRoundness: 0.5,
                  },
                ]}
                xAxis={[{
                  data: monthlyData.map(item => item.month),
                  scaleType: 'band',
                  tickLabelStyle: {
                    color: '#64748B',
                    fontSize: 12,
                  },
                }]}
                yAxis={[{
                  tickLabelStyle: {
                    color: '#64748B',
                    fontSize: 12,
                  },
                }]}
                height={250}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                sx={{
                  '.MuiChartsAxis-line': { stroke: '#e2e8f0' },
                  '.MuiChartsAxis-tick': { stroke: '#e2e8f0' },
                  '.MuiBarElement-root:hover': {
                    filter: 'brightness(0.9)',
                  },
                }}
              />
            </Box>
          </Paper>

          {/* Calendar */}
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            {/* Barangay Selector */}
            <Box sx={{ mb: 2 }}>
              <Select
                value={selectedBarangay?.barangayId || ''}
                onChange={e => {
                  const brgy = barangays.find(b => b.barangayId === e.target.value);
                  setSelectedBarangay(brgy);
                }}
                fullWidth
                size="small"
                sx={{ bgcolor: 'white' }}
              >
                {barangays.map(b => (
                  <MenuItem key={b.barangayId} value={b.barangayId}>{b.name}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                March
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 400, color: '#333', ml: 1 }}>
                2021
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
              textAlign: 'center',
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Typography key={day} sx={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                  {day}
                </Typography>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 1;
                const isValid = dayNum >= 0 && dayNum < 31;
                const isToday = dayNum + 1 === new Date().getDate();
                const isBooked = bookedDays.has(dayNum + 1);
                return (
                  <Box 
                    key={i}
                    sx={{ 
                      p: 1.5,
                      position: 'relative',
                      cursor: isBooked ? 'pointer' : 'default',
                      borderRadius: 1,
                      bgcolor: isToday ? '#EEF2FF' : 'transparent',
                      border: isToday ? '1px solid #4CAF50' : 'none',
                      '&:hover': {
                        bgcolor: isToday ? '#EEF2FF' : isBooked ? '#E8F5E9' : '#f1f5f9',
                      },
                    }}
                    onClick={() => isBooked && navigate('/collection-schedule')}
                  >
                    {isValid && (
                      <>
                        <Typography 
                          sx={{ 
                            fontSize: '0.875rem', 
                            color: isToday ? '#4CAF50' : '#333',
                            fontWeight: isToday ? 600 : 400,
                          }}
                        >
                          {dayNum + 1}
                        </Typography>
                        {isBooked && (
                          <Typography 
                            sx={{ 
                              fontSize: '0.65rem',
                              color: '#388e3c',
                              mt: 0.5,
                              bgcolor: '#E8F5E9',
                              borderRadius: '4px',
                              py: 0.25,
                              px: 0.5,
                            }}
                          >
                            Booked
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
        )}
      </Grid>
    </AdminLayout>
  );
};

export default AdminDashboard; 