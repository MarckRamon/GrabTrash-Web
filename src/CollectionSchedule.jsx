import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminLayout from './components/AdminLayout';
import schedulesService from './services/schedulesService';
import ScheduleDialog from './components/ScheduleDialog';
import './CollectionSchedule.css';
import { useNavigate } from 'react-router-dom';

const CollectionSchedule = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [allowed, setAllowed] = useState(null);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const formatDayNumber = (date) => {
    return date.getDate();
  };

  const navigateTo = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const generateWeekDays = (date) => {
    const days = [];
    const dayOfWeek = date.getDay();
    const firstDay = new Date(date);
    firstDay.setDate(date.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleBarangayChange = (event) => {
    const value = event.target.value;
    setSelectedBarangay(value);
    applyFilters(allSchedules, value);
  };

  const applyFilters = (scheduleList, barangay) => {
    if (!scheduleList || !Array.isArray(scheduleList)) return;
    
    console.log(`Applying barangay filter: ${barangay}`);
    console.log(`Input schedules: ${scheduleList.length}`);
    
    let filtered = scheduleList.filter(schedule => 
      schedule.isActive === true || 
      schedule.isActive === "true" ||
      schedule.active === true ||
      schedule.active === "true");
    
    if (barangay) {
      filtered = filtered.filter(schedule =>
        schedule.barangayId === barangay || schedule.barangayName === barangay
      );
    }
    
    console.log(`Active schedules count: ${filtered.length}`);
    console.log(`Filtered schedules: ${filtered.length}`);
    setSchedules(filtered);
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📄 Fetching schedules from API');
      
      try {
        const barangayData = await schedulesService.getAllBarangays();
        console.log(`📊 Retrieved ${barangayData.length} barangays for the dropdown:`, 
          barangayData.slice(0, 3).map(b => b.name || b.barangayName));
        setBarangays(barangayData);
        if (
          !barangayData.some(b => b.barangayId === selectedBarangay || b.name === selectedBarangay)
        ) {
          setSelectedBarangay(barangayData[0]?.barangayId || '');
        }
      } catch (error) {
        console.error('Error fetching barangays:', error);
        showNotification(
          'Unable to retrieve barangays. Check API connection.',
          'warning'
        );
        setBarangays([]);
      }
      
      try {
        const scheduleData = await schedulesService.getAllSchedules();
        
        console.log(`📋 Retrieved ${scheduleData.length} schedules from API`);
        
        if (scheduleData.length > 0) {
          console.log('Sample schedule:', {
            id: scheduleData[0].scheduleId || scheduleData[0].id,
            barangay: scheduleData[0].barangayName,
            isActive: scheduleData[0].isActive !== undefined ? scheduleData[0].isActive : scheduleData[0].active,
            isRecurring: scheduleData[0].isRecurring !== undefined ? scheduleData[0].isRecurring : scheduleData[0].recurring
          });
        }
        
        setAllSchedules(scheduleData);
        applyFilters(scheduleData, selectedBarangay);
        
        if (scheduleData.length === 0) {
          setError('No collection schedules found. Please add schedules using the Add Schedule button.');
        }
      } catch (error) {
        console.error('Error fetching collection schedules:', error);
        
        if (error.code === 'permission-denied' || 
            error.message?.includes('permission') || 
            error.response?.status === 403) {
          
          setError('Permission denied accessing schedules. Please check that you are signed in with the correct account and have the necessary permissions.');
          showNotification(
            'API access denied. Please try signing out and signing back in.',
            'error'
          );
        } else if (error.response?.status === 404) {
          setError('Schedule API endpoint not found. Please check with your administrator if schedule management is enabled.');
          showNotification(
            'Schedule API endpoint not available. Please ensure your Spring backend is running and supports the collection-schedules endpoints.',
            'warning'
          );
        } else {
          setError('Unable to load collection schedules. Please check your network connection and API server status.');
          showNotification(
            'Unable to retrieve schedules. Check if your Spring backend is running at http://localhost:8080.',
            'error'
          );
        }
        
        setAllSchedules([]);
        setSchedules([]);
      }
    } catch (error) {
      console.error('General error in fetchSchedules:', error);
      setError('A general error occurred while loading data. Please refresh the page and try again.');
      setSchedules([]);
      setAllSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const formatTimeString = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours, 10);
      
      if (hoursNum === 12) return `12:${minutes} PM`;
      if (hoursNum > 12) return `${hoursNum - 12}:${minutes} PM`;
      return `${hoursNum}:${minutes} AM`;
    } catch (e) {
      return timeString;
    }
  };

  const getDayIndex = (dayString) => {
    if (!dayString) return -1;
    
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days.indexOf(dayString.toUpperCase());
  };

  const parseFirestoreDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      console.log(`Parsing date: ${dateString}`);
      
      const parts = dateString.split(' at ');
      if (parts.length !== 2) {
        console.error('Invalid date format:', dateString);
        return null;
      }
      
      const datePart = parts[0];
      const timePart = parts[1].split(' ')[0];
      const dateStr = `${datePart} ${timePart}`;
      console.log(`Parsed to: ${dateStr}`);
      
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateStr);
        return null;
      }
      
      return date;
    } catch (err) {
      console.error('Error parsing date:', err);
      return null;
    }
  };
  
  const getScheduleForTimeSlot = (day, hour) => {
    if (!schedules || schedules.length === 0) return null;
    
    const matchingSchedules = [];
    const dayStr = day.toLocaleDateString();
    const timeStr = `${hour}:00`;
    
    schedules.forEach(schedule => {
      if (!schedule) return;
      
      console.log(`🔍 Processing schedule: ${schedule.scheduleId}, isRecurring: ${schedule.isRecurring}, recurringDay: ${schedule.recurringDay}, recurringTime: ${schedule.recurringTime}`);
      
      try {
        if (schedule.isRecurring !== true && schedule.isRecurring !== "true") {
          if (schedule.collectionDateTime) {
            let scheduleDate = null;
            
            if (typeof schedule.collectionDateTime === 'string') {
              if (schedule.collectionDateTime.includes(' at ')) {
                scheduleDate = parseFirestoreDate(schedule.collectionDateTime);
              } else {
                scheduleDate = new Date(schedule.collectionDateTime);
              }
            } else {
              console.error('Invalid collection date time format:', schedule.collectionDateTime);
              return;
            }
            
            if (scheduleDate && 
                scheduleDate.getDate() === day.getDate() &&
                scheduleDate.getMonth() === day.getMonth() &&
                scheduleDate.getFullYear() === day.getFullYear() &&
                scheduleDate.getHours() === hour) {
              console.log(`✅ One-time schedule match: ${schedule.scheduleId} at ${scheduleDate}`);
              matchingSchedules.push(schedule);
            }
          }
        }
        else if (schedule.isRecurring === true || schedule.isRecurring === "true") {
          if (schedule.recurringDay) {
            const scheduleDayIndex = getDayIndex(schedule.recurringDay);
            const currentDayIndex = day.getDay();
            
            if (scheduleDayIndex === currentDayIndex) {
              if (schedule.recurringTime) {
                try {
                  let scheduleHour;
                  if (schedule.recurringTime.includes(':')) {
                    const timeParts = schedule.recurringTime.split(':');
                    scheduleHour = parseInt(timeParts[0], 10);
                  } else {
                    scheduleHour = parseInt(schedule.recurringTime, 10);
                  }
                  
                  console.log(`🔍 Checking recurring schedule: ${schedule.scheduleId} on ${schedule.recurringDay} at ${schedule.recurringTime} (parsed hour: ${scheduleHour}) vs current hour: ${hour}`);
                  
                  if (scheduleHour === hour) {
                    console.log(`✅ Recurring schedule match: ${schedule.scheduleId} on ${schedule.recurringDay} at ${schedule.recurringTime}`);
                    matchingSchedules.push(schedule);
                  }
                } catch (err) {
                  console.error('Error parsing recurring time:', err, 'for schedule:', schedule.scheduleId, 'time:', schedule.recurringTime);
                }
              } else {
                console.log(`⚠️ Recurring schedule ${schedule.scheduleId} has no recurringTime field`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking schedule:', err);
      }
    });
    
    return matchingSchedules.length > 0 ? matchingSchedules : null;
  };

  const getScheduleTypeClass = (schedule) => {
    return (schedule.wasteType && 
            schedule.wasteType === 'BIODEGRADABLE') 
            ? 'biodegradable' 
            : 'non-biodegradable';
  };
  
  const handleAddSchedule = () => {
    setIsEditMode(false);
    setSelectedSchedule(null);
    setDialogOpen(true);
  };
  
  const handleEditSchedule = (schedule) => {
    setIsEditMode(true);
    setSelectedSchedule(schedule);
    setDialogOpen(true);
  };
  
  const handleDialogClose = (result) => {
    setDialogOpen(false);
    
    if (result === true) {
      fetchSchedules();
      showNotification(
        isEditMode ? 'Schedule updated successfully' : 'Schedule added successfully',
        'success'
      );
    } else if (result === 'deleted') {
      fetchSchedules();
      showNotification(
        'Schedule deactivated successfully',
        'success'
      );
    }
  };
  
  useEffect(() => {
    console.log('📄 Component mounted, initializing data...');
    const days = generateWeekDays(currentDate);
    setWeekDays(days);
    fetchSchedules();
  }, []);
  
  useEffect(() => {
    console.log('📅 Current date changed, updating week days...');
    const days = generateWeekDays(currentDate);
    setWeekDays(days);
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  useEffect(() => {
    applyFilters(allSchedules, selectedBarangay);
  }, [allSchedules, selectedBarangay]);

  if (allowed === null) return null;

  if (isLoading && allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 100px)',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={60} sx={{ color: '#4CAF50' }} />
          <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 500 }}>
            Loading schedules...
          </Typography>
        </Box>
      </AdminLayout>
    );
  }

  if (error && allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            pb: 2,
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%) 1'
          }}>
            <CalendarTodayIcon sx={{ fontSize: 32, color: '#4CAF50', mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              Collection Schedule
            </Typography>
          </Box>
          
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            mt: 2,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.1)'
          }}>
            <Alert severity="error" sx={{ mb: 3, mx: 'auto', maxWidth: 500, borderRadius: 2 }}>
              {error}
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
              {barangays.length > 0 ? 
                'No schedules found. You can add a new schedule using the button below.' : 
                'Unable to load barangays. Please check your connection and try again.'}
            </Typography>
            
            {barangays.length > 0 && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddSchedule}
                disabled={barangays.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #43A047 0%, #4CAF50 100%)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  }
                }}
              >
                Add Schedule
              </Button>
            )}
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  if (allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            pb: 2,
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%) 1'
          }}>
            <CalendarTodayIcon sx={{ fontSize: 32, color: '#4CAF50', mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              Collection Schedule
            </Typography>
          </Box>
          
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            mt: 2,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.1)'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', fontWeight: 600 }}>
              No Collection Schedules Found
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
              There are no collection schedules set up yet. Click the button below to add your first schedule.
            </Typography>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddSchedule}
              sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #43A047 0%, #4CAF50 100%)',
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                }
              }}
            >
              Add Schedule
            </Button>
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, width: '100%', position: 'relative' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          pb: 2,
          borderBottom: '3px solid',
          borderImage: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%) 1'
        }}>
          <CalendarTodayIcon sx={{ fontSize: 32, color: '#4CAF50', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
            Collection Schedule
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              onClick={goToToday}
              variant="contained"
              startIcon={<CalendarTodayIcon />}
              sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #43A047 0%, #4CAF50 100%)',
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                }
              }}
            >
              Today
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                onClick={() => navigateTo('prev')}
                variant="outlined"
                sx={{ 
                  minWidth: 44, 
                  height: 44,
                  p: 0, 
                  borderRadius: '50%',
                  borderColor: '#4CAF50',
                  color: '#4CAF50',
                  '&:hover': {
                    borderColor: '#43A047',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  }
                }}
              >
                <NavigateBeforeIcon />
              </Button>
              <Button 
                onClick={() => navigateTo('next')}
                variant="outlined"
                sx={{ 
                  minWidth: 44, 
                  height: 44,
                  p: 0, 
                  borderRadius: '50%',
                  borderColor: '#4CAF50',
                  color: '#4CAF50',
                  '&:hover': {
                    borderColor: '#43A047',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  }
                }}
              >
                <NavigateNextIcon />
              </Button>
            </Box>
          </Box>

          <ButtonGroup 
            variant="outlined" 
            sx={{ 
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)', 
              borderRadius: 2,
              '& .MuiButton-root': {
                borderColor: '#4CAF50',
                color: '#4CAF50',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#43A047',
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                }
              },
              '& .MuiButton-contained': {
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                borderColor: 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, #43A047 0%, #4CAF50 100%)',
                }
              }
            }}
          >
            <Button 
              onClick={() => setViewMode('day')}
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
            >
              Day
            </Button>
            <Button 
              onClick={() => setViewMode('week')}
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
            >
              Week
            </Button>
            <Button 
              onClick={() => setViewMode('month')}
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
            >
              Month
            </Button>
            <Button 
              onClick={() => setViewMode('year')}
              variant={viewMode === 'year' ? 'contained' : 'outlined'}
            >
              Year
            </Button>
          </ButtonGroup>

          <TextField
            select
            label="Barangay"
            size="medium"
            value={selectedBarangay}
            onChange={handleBarangayChange}
            sx={{ 
              width: 220,
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#4CAF50',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4CAF50',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#4CAF50',
              }
            }}
            SelectProps={{ native: true }}
          >
            {barangays.map((b) => (
              <option key={b.barangayId || b.id} value={b.barangayId || b.name}>
                {b.name}
              </option>
            ))}
          </TextField>
        </Box>

        {schedules.length === 0 && allSchedules.length > 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              border: '1px solid rgba(33, 150, 243, 0.2)',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)'
            }}
          >
            No active schedules found{selectedBarangay !== 'all' ? ` in ${selectedBarangay}` : ''}.
          </Alert>
        )}

        <Paper sx={{ 
          overflow: 'auto', 
          maxHeight: 'calc(100vh - 300px)', 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)',
          border: '1px solid rgba(76, 175, 80, 0.1)'
        }}>
          <Box className="schedule-calendar">
            <Box className="month-indicator">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Box>
            
            <Box className="calendar-header">
              <Box className="time-cell">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32', textAlign: 'center' }}>
                  PHT<br />UTC+8
                </Typography>
              </Box>
              
              {weekDays.map((day, index) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <Box 
                    key={index} 
                    className={`day-cell ${isToday ? 'today' : ''}`}
                  >
                    <Box className="day-header">
                      <Typography className="day-name">
                        {formatDate(day)}
                      </Typography>
                      <Typography className="day-number">
                        {formatDayNumber(day)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box className="calendar-grid">
              {hours.map((hour) => (
                <Box key={hour} className="time-row">
                  <Box className="time-cell">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatTime(hour)}
                    </Typography>
                  </Box>
                  
                  {weekDays.map((day, dayIndex) => {
                    const schedulesForSlot = getScheduleForTimeSlot(day, hour);
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <Box 
                        key={`${hour}-${dayIndex}`} 
                        className="schedule-cell"
                        sx={{ 
                          backgroundColor: isToday ? '#f8fafd' : 'white',
                          borderBottom: '1px solid rgba(76, 175, 80, 0.08)',
                          borderRight: dayIndex < 6 ? '1px solid rgba(76, 175, 80, 0.08)' : 'none',
                        }}
                      >
                        {schedulesForSlot && schedulesForSlot.length > 0 && schedulesForSlot.map((schedule, idx) => {
                          const isScheduleActive = 
                            (schedule.isActive !== undefined ? schedule.isActive : 
                            (schedule.active !== undefined ? schedule.active : true));
                          
                          return (
                            <Box 
                              key={idx}
                              className={`schedule-event ${getScheduleTypeClass(schedule)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSchedule(schedule);
                              }}
                              sx={{
                                opacity: isScheduleActive ? 1 : 0.6,
                              }}
                            >
                              <Typography className="time">
                                {schedule.isRecurring && schedule.recurringTime 
                                  ? formatTimeString(schedule.recurringTime)
                                  : (schedule.collectionDateTime ? new Date(schedule.collectionDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}
                              </Typography>
                              <Typography className="location">
                                {schedule.barangayName || 'Unknown Barangay'}
                              </Typography>
                              {!isScheduleActive && (
                                <Typography sx={{ 
                                  fontSize: '10px', 
                                  color: '#f44336',
                                  fontWeight: 'bold',
                                  mt: 0.5,
                                  position: 'relative',
                                  zIndex: 1
                                }}>
                                  INACTIVE
                                </Typography>
                              )}
                              {schedule.isRecurring && (
                                <Typography sx={{ 
                                  fontSize: '10px', 
                                  color: '#666',
                                  fontWeight: 'bold',
                                  mt: 0.5,
                                  position: 'relative',
                                  zIndex: 1
                                }}>
                                  🔄 RECURRING
                                </Typography>
                              )}
                              {schedule.notes && (
                                <Typography className="notes">
                                  {schedule.notes}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ 
          mt: 4, 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)',
          border: '2px solid rgba(76, 175, 80, 0.2)',
          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32', mr: 2 }}>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '2px solid rgba(244, 67, 54, 0.3)',
              borderRadius: 2.5,
              overflow: 'hidden',
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.25)',
              }
            }}>
              <Box sx={{ 
                bgcolor: '#ffebee', 
                borderLeft: '5px solid #f44336',
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}></Box>
              <Typography sx={{ 
                px: 3, 
                py: 1, 
                fontSize: 15, 
                color: '#c62828', 
                fontWeight: 600 
              }}>
                Non-Biodegradable
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '2px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 2.5,
              overflow: 'hidden',
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.25)',
              }
            }}>
              <Box sx={{ 
                bgcolor: '#e8f5e9',
                borderLeft: '5px solid #4caf50',
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}></Box>
              <Typography sx={{ 
                px: 3, 
                py: 1, 
                fontSize: 15, 
                color: '#2e7d32', 
                fontWeight: 600 
              }}>
                Biodegradable
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Tooltip title="Add Schedule" placement="left">
          <Fab 
            color="primary" 
            aria-label="add"
            onClick={handleAddSchedule}
            sx={{ 
              position: 'fixed', 
              bottom: 32, 
              right: 32,
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #43A047 0%, #4CAF50 100%)',
                boxShadow: '0 12px 32px rgba(76, 175, 80, 0.5)',
                transform: 'translateY(-4px) scale(1.05)',
              }
            }}
          >
            <AddIcon sx={{ fontSize: 32 }} />
          </Fab>
        </Tooltip>
      </Box>

      <ScheduleDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schedule={selectedSchedule}
        isEdit={isEditMode}
        barangays={barangays}
        existingSchedules={allSchedules}
      />

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ 
            width: '100%', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', 
            borderRadius: 2,
            fontWeight: 500,
            '& .MuiAlert-icon': {
              fontSize: 28
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default CollectionSchedule;