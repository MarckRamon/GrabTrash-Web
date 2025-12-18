import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import AdminLayout from './components/AdminLayout';
import api from './api/axios';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RecyclingIcon from '@mui/icons-material/Recycling';
import RepeatIcon from '@mui/icons-material/Repeat';
import schedulesService from './services/schedulesService';

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
  const [selectedDateSchedules, setSelectedDateSchedules] = useState([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState([
    { month: 'JAN', value: 0 },
    { month: 'FEB', value: 0 },
    { month: 'MAR', value: 0 },
    { month: 'APR', value: 0 },
    { month: 'MAY', value: 0 },
    { month: 'JUN', value: 0 },
    { month: 'JUL', value: 0 },
    { month: 'AUG', value: 0 },
    { month: 'SEP', value: 0 },
    { month: 'OCT', value: 0 },
    { month: 'NOV', value: 0 },
    { month: 'DEC', value: 0 },
  ]);
  const [topBarangaysDynamic, setTopBarangaysDynamic] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin) {
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
          setTotalActiveUsers(0);
          setTotalPickupTrash(0);
          setTotalCollectionPoints(0);
        }
      } catch (error) {
        setTotalActiveUsers(0);
        setTotalPickupTrash(0);
        setTotalCollectionPoints(0);
      }
    };
    fetchDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchBarangays = async () => {
      try {
        const res = await api.get('/barangays');
        const brgys = Array.isArray(res.data) ? res.data : [];
        setBarangays(brgys);
        if (brgys.length > 0) {
          setSelectedBarangay(brgys[0].barangay_id || brgys[0].barangayId);
        }
      } catch (err) {
        console.error('Error fetching barangays:', err);
      }
    };
    fetchBarangays();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedBarangay || !isAdmin) return;
    const fetchBarangaySchedules = async () => {
      try {
        const res = await api.get(`/collection-schedules/barangay/${selectedBarangay}`);
        const schedules = Array.isArray(res.data) ? res.data : [];
        setBarangaySchedules(schedules);
      } catch (err) {
        console.error('Error fetching barangay schedules:', err);
        setBarangaySchedules([]);
      }
    };
    fetchBarangaySchedules();
  }, [selectedBarangay, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchTopBarangays = async () => {
      try {
        const res = await api.get('/payments/top-barangays');
        const top = Array.isArray(res.data) ? res.data : [];
        console.log('🏆 Top Barangays Response:', top);
        setTopBarangays(top);
      } catch (err) {
        console.error('Error fetching top barangays:', err);
        setTopBarangays([]);
      }
    };
    fetchTopBarangays();
  }, [isAdmin]);

  useEffect(() => {
    const fetchAndProcessMonthlyData = async () => {
      try {
        const schedules = await schedulesService.getAllSchedules();
        // Prepare a map for month aggregation
        const monthlyCounts = Array(12).fill(0);
        const nowYear = new Date().getFullYear();
        schedules.forEach(sch => {
          // Only count active schedules
          const isActive = sch.isActive !== undefined ? sch.isActive : (sch.active !== undefined ? sch.active : true);
          if (!isActive) return;
          if (sch.collectionDateTime) {
            // Parse date for each schedule
            const date = new Date(sch.collectionDateTime);
            if (!isNaN(date) && date.getFullYear() === nowYear) {
              const m = date.getMonth();
              monthlyCounts[m]++;
            }
          }
        });
        const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const newData = monthNames.map((m, idx) => ({month: m, value: monthlyCounts[idx]}));
        setMonthlyData(newData);
      } catch (err) {
        setMonthlyData([
          { month: 'JAN', value: 0 },
          { month: 'FEB', value: 0 },
          { month: 'MAR', value: 0 },
          { month: 'APR', value: 0 },
          { month: 'MAY', value: 0 },
          { month: 'JUN', value: 0 },
          { month: 'JUL', value: 0 },
          { month: 'AUG', value: 0 },
          { month: 'SEP', value: 0 },
          { month: 'OCT', value: 0 },
          { month: 'NOV', value: 0 },
          { month: 'DEC', value: 0 },
        ]);
        console.error('Error loading schedules for chart:', err);
      }
    };
    fetchAndProcessMonthlyData();
  }, [isAdmin]);

  useEffect(() => {
    const fetchAndProcessTopBarangays = async () => {
      try {
        const schedules = await schedulesService.getAllSchedules();
        const barangayCounts = {};
        schedules.forEach(sch => {
          const isActive = sch.isActive !== undefined ? sch.isActive : (sch.active !== undefined ? sch.active : true);
          if (!isActive) return;
          // Use barangayName (fallback: 'Unknown')
          const name = sch.barangayName || sch.barangay_name || sch.name || 'Unknown';
          barangayCounts[name] = (barangayCounts[name] || 0) + 1;
        });
        // Convert to array and sort by count descending
        const sorted = Object.entries(barangayCounts)
          .map(([name, count]) => ({ barangayName: name, count }))
          .sort((a, b) => b.count - a.count);
        setTopBarangaysDynamic(sorted);
      } catch (error) {
        setTopBarangaysDynamic([]);
        console.error('Error fetching top barangays for Top Locations:', error);
      }
    };
    fetchAndProcessTopBarangays();
  }, [isAdmin]);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  const isDateBooked = (dayNum) => {
    const displayDay = dayNum + 1;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
    const checkDate = new Date(currentYear, currentMonth, displayDay);
    const dayOfWeek = dayNames[checkDate.getDay()];

    return barangaySchedules.some(s => {
      // Check if schedule is active
      const isActive = s.isActive !== undefined ? s.isActive : (s.active !== undefined ? s.active : true);
      if (!isActive) return false;

      // Check for recurring schedules
      const isRecurring = s.isRecurring === true || s.isRecurring === 'true' || s.recurring === true || s.recurring === 'true';
      if (isRecurring) {
        const recurringDay = (s.recurringDay || s.recurring_day || '').toUpperCase();
        return recurringDay === dayOfWeek;
      }

      // Check for one-time schedules with date matching
      const collectionDate = s.collection_date || s.collectionDateTime;
      if (collectionDate) {
        // Handle ISO format or other date formats
        const scheduleDate = new Date(collectionDate);
        if (!isNaN(scheduleDate.getTime())) {
          return scheduleDate.getFullYear() === currentYear &&
                 scheduleDate.getMonth() === currentMonth &&
                 scheduleDate.getDate() === displayDay;
        }
        // Fallback to string comparison
        return collectionDate.startsWith(dateStr);
      }
      return false;
    });
  };

  const getSchedulesForDate = (dayNum) => {
    const displayDay = dayNum + 1;
    const checkDate = new Date(currentYear, currentMonth, displayDay);
    const dayOfWeek = dayNames[checkDate.getDay()];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;

    return barangaySchedules.filter(s => {
      const isActive = s.isActive !== undefined ? s.isActive : (s.active !== undefined ? s.active : true);
      if (!isActive) return false;

      const isRecurring = s.isRecurring === true || s.isRecurring === 'true' || s.recurring === true || s.recurring === 'true';
      if (isRecurring) {
        const recurringDay = (s.recurringDay || s.recurring_day || '').toUpperCase();
        return recurringDay === dayOfWeek;
      }

      const collectionDate = s.collection_date || s.collectionDateTime;
      if (collectionDate) {
        const scheduleDate = new Date(collectionDate);
        if (!isNaN(scheduleDate.getTime())) {
          return scheduleDate.getFullYear() === currentYear &&
                 scheduleDate.getMonth() === currentMonth &&
                 scheduleDate.getDate() === displayDay;
        }
        return collectionDate.startsWith(dateStr);
      }
      return false;
    });
  };

  const handleDateClick = (dayNum) => {
    const schedules = getSchedulesForDate(dayNum);
    if (schedules.length > 0) {
      const displayDay = dayNum + 1;
      const dateLabel = new Date(currentYear, currentMonth, displayDay).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setSelectedDateSchedules(schedules);
      setSelectedDateLabel(dateLabel);
      setScheduleDialogOpen(true);
    }
  };

  const formatScheduleTime = (schedule) => {
    if (schedule.recurringTime) {
      const [hours, minutes] = schedule.recurringTime.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    if (schedule.collectionDateTime) {
      const date = new Date(schedule.collectionDateTime);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return 'N/A';
  };

  const StatCard = ({ title, value, icon: Icon, gradient, percentage, delay }) => (
    <Paper
      sx={{
        p: 3.5,
        borderRadius: '24px',
        background: gradient,
        border: 'none',
        boxShadow: '0 10px 40px rgba(46, 125, 50, 0.12)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideUp 0.6s ease-out ${delay}s backwards`,
        '@keyframes slideUp': {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '&:hover': {
          transform: 'translateY(-12px) scale(1.02)',
          boxShadow: '0 20px 60px rgba(46, 125, 50, 0.2)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(40%, -40%)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '0.7rem',
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-2px',
                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          }}>
            <Icon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.8,
          bgcolor: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          px: 1.5,
          py: 0.8,
          backdropFilter: 'blur(10px)',
          width: 'fit-content',
        }}>
          <ArrowUpwardIcon sx={{ color: 'white', fontSize: 16, fontWeight: 'bold' }} />
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
            {percentage}% from last month
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

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
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 6,
                height: 48,
                background: 'linear-gradient(180deg, #2e7d32 0%, #43a047 100%)',
                borderRadius: '10px',
              }} />
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-1px',
                  }}
                >
                  Dashboard Overview
                </Typography>
                <Typography variant="body1" sx={{ color: '#558b2f', fontWeight: 500, mt: 0.5 }}>
                  Monitor your waste management operations in real-time
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mt: 3,
            }}>
              <Chip 
                icon={<CalendarTodayIcon />}
                label={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                sx={{
                  bgcolor: 'white',
                  color: '#2e7d32',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 2.5,
                  px: 1,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)',
                  '& .MuiChip-icon': { color: '#43a047' },
                }}
              />
              <Select
                value="all-time"
                sx={{
                  minWidth: 220,
                  bgcolor: 'white',
                  borderRadius: '16px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover': { boxShadow: '0 6px 20px rgba(46, 125, 50, 0.15)' },
                }}
              >
                <MenuItem value="all-time">📊 Timeframe: All-time</MenuItem>
                <MenuItem value="month">📅 This Month</MenuItem>
                <MenuItem value="week">📆 This Week</MenuItem>
                <MenuItem value="today">⏰ Today</MenuItem>
              </Select>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Active Users"
                value={totalActiveUsers}
                icon={PeopleIcon}
                gradient="linear-gradient(135deg, #66bb6a 0%, #43a047 100%)"
                percentage="12"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Pickup Orders"
                value={totalPickupTrash}
                icon={DeleteIcon}
                gradient="linear-gradient(135deg, #26a69a 0%, #00897b 100%)"
                percentage="18"
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Collection Points"
                value={totalCollectionPoints}
                icon={LocationOnIcon}
                gradient="linear-gradient(135deg, #7cb342 0%, #689f38 100%)"
                percentage="8"
                delay={0.2}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 4,
                  borderRadius: '24px',
                  background: 'white',
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(46, 125, 50, 0.12)',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #66bb6a 0%, #43a047 100%)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b5e20', mb: 0.5 }}>
                      🏆 Top Locations
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                      Most active pickup points
                    </Typography>
                  </Box>
                  <IconButton sx={{ bgcolor: '#f1f8f4', '&:hover': { bgcolor: '#e8f5e9' } }}>
                    <MoreVertIcon sx={{ color: '#43a047' }} />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {topBarangaysDynamic.length === 0 ? (
                    <Typography sx={{ color: '#757575', textAlign: 'center', py: 4 }}>
                      No data available
                    </Typography>
                  ) : (
                    topBarangaysDynamic.slice(0, 3).map((barangay, index) => {
                      const barangayName = barangay.barangayName || 'Unknown';
                      const percentage = (barangay.count / (topBarangaysDynamic[0]?.count || 1)) * 100;
                      const colors = [
                        { bg: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)', badge: '#1b5e20' },
                        { bg: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)', badge: '#2e7d32' },
                        { bg: 'linear-gradient(135deg, #a5d6a7 0%, #81c784 100%)', badge: '#388e3c' },
                      ];
                      return (
                        <Box key={`top-barangay-${index}`}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{
                                width: 50,
                                height: 50,
                                background: colors[index].bg,
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                              }}>
                                #{index + 1}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ color: '#212121', fontWeight: 700, fontSize: '1rem' }}>
                                  {barangayName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#757575' }}>
                                  {percentage.toFixed(0)}% of total schedules
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={barangay.count.toLocaleString()}
                              sx={{
                                bgcolor: colors[index].badge,
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                height: '32px',
                              }}
                            />
                          </Box>
                          <Box sx={{ position: 'relative', height: 10, bgcolor: '#f5f5f5', borderRadius: '10px', overflow: 'hidden' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${percentage}%`,
                                height: '100%',
                                background: colors[index].bg,
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                                transition: 'width 1s ease-out',
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Grid>

            {isAdmin && (
              <Grid item xs={12} md={7}>
                <Paper sx={{
                  p: 4,
                  borderRadius: '24px',
                  background: 'white',
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(46, 125, 50, 0.12)',
                  mb: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #26a69a 0%, #00897b 100%)',
                  },
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b5e20', mb: 0.5 }}>
                        📈 Activity Overview
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#757575' }}>
                        Monthly collection statistics
                      </Typography>
                    </Box>
                    <Select value="month" size="small" sx={{
                      minWidth: 130,
                      borderRadius: '12px',
                      bgcolor: '#f1f8f4',
                      fontWeight: 600,
                      border: 'none',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '&:hover': { bgcolor: '#e8f5e9' },
                    }}>
                      <MenuItem value="month">Monthly</MenuItem>
                      <MenuItem value="week">Weekly</MenuItem>
                      <MenuItem value="year">Yearly</MenuItem>
                    </Select>
                  </Box>
                  <BarChart
                    xAxis={[{ scaleType: 'band', data: monthlyData.map(d => d.month), categoryGapRatio: 0.4 }]}
                    series={[{ data: monthlyData.map(d => d.value), color: '#43a047' }]}
                    height={320}
                    sx={{
                      '& .MuiChartsAxis-line': { stroke: '#e0e0e0', strokeWidth: 2 },
                      '& .MuiChartsAxis-tick': { stroke: '#e0e0e0' },
                      '& .MuiChartsAxis-tickLabel': { fontWeight: 600, fill: '#757575' },
                    }}
                  />
                </Paper>

                <Paper sx={{
                  p: 4,
                  borderRadius: '24px',
                  background: 'white',
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(46, 125, 50, 0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #7cb342 0%, #689f38 100%)',
                  },
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b5e20', mb: 0.5 }}>
                        📅 Collection Calendar
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#757575' }}>{monthName}</Typography>
                    </Box>
                    <Select
                      value={selectedBarangay || ''}
                      onChange={(e) => setSelectedBarangay(e.target.value)}
                      size="small"
                      sx={{
                        minWidth: 160,
                        borderRadius: '12px',
                        bgcolor: '#f1f8f4',
                        fontWeight: 600,
                        border: 'none',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover': { bgcolor: '#e8f5e9' },
                      }}
                    >
                      {barangays.map((b) => (
                        <MenuItem key={b.barangay_id || b.barangayId} value={b.barangay_id || b.barangayId}>
                          📍 {b.barangay_name || b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5, mb: 2 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <Box key={day} sx={{
                        textAlign: 'center',
                        py: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#43a047',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {day}
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
                    {Array.from({ length: 42 }, (_, i) => {
                      const dayNum = i - firstDay;
                      const isValid = dayNum >= 0 && dayNum < daysInMonth;
                      const isToday = isValid && dayNum === today.getDate() - 1;
                      const isBooked = isValid && isDateBooked(dayNum);
                      const displayDay = dayNum + 1;

                      return (
                        <Box
                          key={`calendar-day-${i}`}
                          sx={{
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '16px',
                            cursor: isBooked ? 'pointer' : 'default',
                            // FIXED: Solid background for today instead of gradient
                            bgcolor: isToday ? '#43a047' : isBooked ? '#e8f5e9' : 'transparent',
                            border: isBooked && !isToday ? '2px solid #81c784' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            boxShadow: isToday ? '0 4px 12px rgba(67, 160, 71, 0.4)' : 'none',
                            '&:hover': {
                              bgcolor: isBooked && !isToday ? '#c8e6c9' : isToday ? '#2e7d32' : '#f5f5f5',
                              transform: isBooked || isToday ? 'scale(1.1)' : 'none',
                              boxShadow: isBooked || isToday ? '0 4px 12px rgba(46, 125, 50, 0.3)' : 'none',
                              zIndex: 10,
                            },
                          }}
                          onClick={() => isBooked && handleDateClick(dayNum)}
                        >
                          {isValid && (
                            <>
                              <Typography sx={{ 
                                fontSize: '0.9rem', 
                                color: isToday ? 'white' : '#212121', 
                                fontWeight: isToday ? 900 : 600,
                                textShadow: isToday ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                              }}>
                                {displayDay}
                              </Typography>
                              {isBooked && !isToday && (
                                <Box sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: '#43a047',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }} />
                              )}
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </Box>

                  <Box sx={{ mt: 3, pt: 3, borderTop: '2px dashed #e0e0e0', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#757575' }}>Today</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#43a047' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#757575' }}>Scheduled</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Schedule Details Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <CalendarTodayIcon />
          Schedules for {selectedDateLabel}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedDateSchedules.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No schedules found for this date.</Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {selectedDateSchedules.map((schedule, index) => {
                const isRecurring = schedule.isRecurring === true || schedule.isRecurring === 'true' || schedule.recurring === true || schedule.recurring === 'true';
                const wasteType = schedule.wasteType || schedule.waste_type || 'NON_BIODEGRADABLE';
                const isBiodegradable = wasteType === 'BIODEGRADABLE';
                
                return (
                  <React.Fragment key={schedule.scheduleId || schedule.id || index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 2.5,
                        px: 3,
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: isBiodegradable ? '#e8f5e9' : '#ffebee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <RecyclingIcon sx={{ color: isBiodegradable ? '#43a047' : '#e53935', fontSize: 24 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1b5e20' }}>
                              {schedule.barangayName || schedule.barangay_name || 'Unknown Barangay'}
                            </Typography>
                            {isRecurring && (
                              <Chip
                                icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                                label="Recurring"
                                size="small"
                                sx={{
                                  bgcolor: '#e3f2fd',
                                  color: '#1976d2',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 24,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color: '#757575' }} />
                              <Typography variant="body2" sx={{ color: '#757575' }}>
                                {formatScheduleTime(schedule)}
                              </Typography>
                            </Box>
                            <Chip
                              label={isBiodegradable ? 'Biodegradable' : 'Non-Biodegradable'}
                              size="small"
                              sx={{
                                bgcolor: isBiodegradable ? '#e8f5e9' : '#ffebee',
                                color: isBiodegradable ? '#2e7d32' : '#c62828',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                width: 'fit-content',
                                height: 22,
                              }}
                            />
                            {schedule.notes && (
                              <Typography variant="body2" sx={{ color: '#757575', fontStyle: 'italic', mt: 0.5 }}>
                                {schedule.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={() => setScheduleDialogOpen(false)}
            sx={{
              color: '#757575',
              fontWeight: 600,
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setScheduleDialogOpen(false);
              navigate('/schedule');
            }}
            sx={{
              background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
              fontWeight: 600,
              borderRadius: '10px',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #43a047 100%)',
              },
            }}
          >
            View All Schedules
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;