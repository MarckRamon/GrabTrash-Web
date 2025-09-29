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
import AdminLayout from './components/AdminLayout';
import schedulesService from './services/schedulesService';
import ScheduleDialog from './components/ScheduleDialog';
import './CollectionSchedule.css'; // We'll create this CSS file too
import { useNavigate } from 'react-router-dom';

const CollectionSchedule = () => {
  const navigate = useNavigate();
  // State for calendar and schedules
  const [viewMode, setViewMode] = useState('week'); // day, week, month, year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]); // Store all schedules before filtering
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter states
  // Remove searchTerm state
  // const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('all'); // NEW: barangay filter

  const [allowed, setAllowed] = useState(null);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const formatDayNumber = (date) => {
    return date.getDate();
  };

  // Navigate to previous or next time period
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

  // Set today as the current date
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate the days for the week view
  const generateWeekDays = (date) => {
    const days = [];
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the first day of the week (Sunday)
    const firstDay = new Date(date);
    firstDay.setDate(date.getDate() - dayOfWeek);
    
    // Generate 7 days starting from Sunday
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Show notification
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Handle barangay filter change
  const handleBarangayChange = (event) => {
    const value = event.target.value;
    setSelectedBarangay(value);
    applyFilters(allSchedules, value); // pass barangay
  };

  // Apply filters to schedules (now only based on search term, barangay, and showing only active schedules)
  const applyFilters = (scheduleList, barangay) => {
    if (!scheduleList || !Array.isArray(scheduleList)) return;
    
    console.log(`Applying barangay filter: ${barangay}`);
    console.log(`Input schedules: ${scheduleList.length}`);
    
    // Start with only active schedules (default behavior)
    let filtered = scheduleList.filter(schedule => 
      schedule.isActive === true || 
      schedule.isActive === "true" ||
      schedule.active === true ||
      schedule.active === "true");
    
    // Always filter by barangay
    if (barangay) {
      filtered = filtered.filter(schedule =>
        schedule.barangayId === barangay || schedule.barangayName === barangay
      );
    }
    
    console.log(`Active schedules count: ${filtered.length}`);
    
    // Apply search term filter if exists
    // if (search && search.trim() !== '') {
    //   const searchLower = search.toLowerCase().trim();
    //   filtered = filtered.filter(schedule => 
    //     (schedule.barangayName && schedule.barangayName.toLowerCase().includes(searchLower)) ||
    //     (schedule.notes && schedule.notes.toLowerCase().includes(searchLower)) ||
    //     (schedule.wasteType && schedule.wasteType.toLowerCase().includes(searchLower))
    //   );
    // }
    
    console.log(`Filtered schedules: ${filtered.length}`);
    setSchedules(filtered);
  };

  // Fetch schedules from backend API
  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching schedules from API');
      
      // First try to fetch barangays
      try {
        const barangayData = await schedulesService.getAllBarangays();
        console.log(`📊 Retrieved ${barangayData.length} barangays for the dropdown:`, 
          barangayData.slice(0, 3).map(b => b.name || b.barangayName));
        setBarangays(barangayData);
        // If selectedBarangay is no longer valid or is 'all', set to first barangay
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
      
      // Then try to fetch schedules
      try {
        const scheduleData = await schedulesService.getAllSchedules();
        
        // Log what we received for debugging
        console.log(`📋 Retrieved ${scheduleData.length} schedules from API`);
        
        if (scheduleData.length > 0) {
          console.log('Sample schedule:', {
            id: scheduleData[0].scheduleId || scheduleData[0].id,
            barangay: scheduleData[0].barangayName,
            isActive: scheduleData[0].isActive !== undefined ? scheduleData[0].isActive : scheduleData[0].active,
            isRecurring: scheduleData[0].isRecurring !== undefined ? scheduleData[0].isRecurring : scheduleData[0].recurring
          });
        }
        
        // Store all schedules for filtering
        setAllSchedules(scheduleData);
        
        // Apply current filters - now only showing active schedules by default
        applyFilters(scheduleData, selectedBarangay);
        
        if (scheduleData.length === 0) {
          setError('No collection schedules found. Please add schedules using the Add Schedule button.');
        }
      } catch (error) {
        console.error('Error fetching collection schedules:', error);
        
        // Check if this might be a permissions error or API endpoint issue
        if (error.code === 'permission-denied' || 
            error.message?.includes('permission') || 
            error.response?.status === 403) {
          
          setError('Permission denied accessing schedules. Please check that you are signed in with the correct account and have the necessary permissions.');
          showNotification(
            'API access denied. Please try signing out and signing back in.',
            'error'
          );
        } else if (error.response?.status === 404) {
          // API endpoint might not exist
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

  // Format time (e.g., "9:00 AM")
  const formatTime = (hour) => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  // Format time string (e.g. "08:00:00" to "8:00 AM")
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

  // Convert day string to day index
  const getDayIndex = (dayString) => {
    if (!dayString) return -1;
    
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days.indexOf(dayString.toUpperCase());
  };

  // Parse a date from the format "DD Month YYYY at HH:MM:SS UTC+8"
  const parseFirestoreDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      console.log(`Parsing date: ${dateString}`);
      
      // Example: "21 May 2025 at 15:00:00 UTC+8"
      const parts = dateString.split(' at ');
      if (parts.length !== 2) {
        console.error('Invalid date format:', dateString);
        return null;
      }
      
      const datePart = parts[0]; // "21 May 2025"
      const timePart = parts[1].split(' ')[0]; // "15:00:00"
      
      // Construct a date string that JavaScript can parse
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
  
  // Check if a schedule should be displayed at a specific day and hour
  const getScheduleForTimeSlot = (day, hour) => {
    if (!schedules || schedules.length === 0) return null;
    
    const matchingSchedules = [];
    
    // For debugging
    const dayStr = day.toLocaleDateString();
    const timeStr = `${hour}:00`;
    
    // Check each schedule
    schedules.forEach(schedule => {
      if (!schedule) return;
      
      console.log(`🔍 Processing schedule: ${schedule.scheduleId}, isRecurring: ${schedule.isRecurring}, recurringDay: ${schedule.recurringDay}, recurringTime: ${schedule.recurringTime}`);
      
      try {
        // Handle one-time schedules
        if (schedule.isRecurring !== true && schedule.isRecurring !== "true") {
          if (schedule.collectionDateTime) {
            let scheduleDate = null;
            
            // Handle different date formats
            if (typeof schedule.collectionDateTime === 'string') {
              if (schedule.collectionDateTime.includes(' at ')) {
                // Format: "21 May 2025 at 15:00:00 UTC+8"
                scheduleDate = parseFirestoreDate(schedule.collectionDateTime);
              } else {
                // Standard ISO format
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
        // Handle recurring schedules
        else if (schedule.isRecurring === true || schedule.isRecurring === "true") {
          if (schedule.recurringDay) {
            const scheduleDayIndex = getDayIndex(schedule.recurringDay);
            const currentDayIndex = day.getDay();
            
            if (scheduleDayIndex === currentDayIndex) {
              if (schedule.recurringTime) {
                try {
                  // Parse HH:MM or HH:MM:SS format
                  let scheduleHour;
                  if (schedule.recurringTime.includes(':')) {
                    const timeParts = schedule.recurringTime.split(':');
                    scheduleHour = parseInt(timeParts[0], 10);
                  } else {
                    // Handle case where time might be in different format
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

  // Determine schedule type class (biodegradable or non-biodegradable)
  const getScheduleTypeClass = (schedule) => {
    return (schedule.wasteType && 
            schedule.wasteType === 'BIODEGRADABLE') 
            ? 'biodegradable' 
            : 'non-biodegradable';
  };
  
  // Handle opening the add schedule dialog
  const handleAddSchedule = () => {
    setIsEditMode(false);
    setSelectedSchedule(null);
    setDialogOpen(true);
  };
  
  // Handle opening the edit schedule dialog
  const handleEditSchedule = (schedule) => {
    setIsEditMode(true);
    setSelectedSchedule(schedule);
    setDialogOpen(true);
  };
  
  // Handle dialog close
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
  
  // Load schedules and barangays when the component mounts
  useEffect(() => {
    console.log('🔄 Component mounted, initializing data...');
    
    // Set up the week days
    const days = generateWeekDays(currentDate);
    setWeekDays(days);
    
    // Fetch schedules and barangays from Firestore
    fetchSchedules();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Update week days when the current date changes
  useEffect(() => {
    console.log('📅 Current date changed, updating week days...');
    const days = generateWeekDays(currentDate);
    setWeekDays(days);
  }, [currentDate]);

  // Generate hours for the day (from 7 AM to 5 PM as shown in the image)
  const hours = Array.from({ length: 11 }, (_, i) => i + 7); // 7 AM to 5 PM

  // Check access
  useEffect(() => {
    const role = (JSON.parse(localStorage.getItem('user') || '{}').role || '').toLowerCase();
    if (role !== 'admin') {
      navigate('/dashboard');
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  // In useEffect, when barangays or schedules change, re-apply filters
  useEffect(() => {
    applyFilters(allSchedules, selectedBarangay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSchedules, selectedBarangay]);

  if (allowed === null) return null;

  // Loading state
  if (isLoading && allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 100px)'
        }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  // Empty state with error
  if (error && allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            Collection Schedule
          </Typography>
          
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <Alert severity="error" sx={{ mb: 3, mx: 'auto', maxWidth: 500 }}>
              {error}
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              {barangays.length > 0 ? 
                'No schedules found. You can add a new schedule using the button below.' : 
                'Unable to load barangays. Please check your connection and try again.'}
            </Typography>
            
            {barangays.length > 0 && (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleAddSchedule}
                disabled={barangays.length === 0}
              >
                Add Schedule
              </Button>
            )}
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  // Empty state with no error (just no schedules yet)
  if (allSchedules.length === 0) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            Collection Schedule
          </Typography>
          
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              No Collection Schedules Found
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              There are no collection schedules set up yet. Click the button below to add your first schedule.
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleAddSchedule}
            >
              Add Schedule
            </Button>
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  // Main schedule view with data
  return (
    <AdminLayout>
      <Box sx={{ p: 3, width: '100%', position: 'relative' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
          Collection Schedule
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              onClick={goToToday}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Today
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
              <Button 
                onClick={() => navigateTo('prev')}
                variant="outlined"
                sx={{ minWidth: 40, p: 0.5, borderRadius: '50%', mr: 1 }}
              >
                &lt;
              </Button>
              <Button 
                onClick={() => navigateTo('next')}
                variant="outlined"
                sx={{ minWidth: 40, p: 0.5, borderRadius: '50%' }}
              >
                &gt;
              </Button>
            </Box>
          </Box>

          <ButtonGroup variant="outlined" sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Button 
              onClick={() => setViewMode('day')}
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              color="primary"
            >
              Day
            </Button>
            <Button 
              onClick={() => setViewMode('week')}
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              color="primary"
            >
              Week
            </Button>
            <Button 
              onClick={() => setViewMode('month')}
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
              color="primary"
            >
              Month
            </Button>
            <Button 
              onClick={() => setViewMode('year')}
              variant={viewMode === 'year' ? 'contained' : 'outlined'}
              color="primary"
            >
              Year
            </Button>
          </ButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Barangay Filter Dropdown */}
            <TextField
              select
              label="Barangay"
              size="small"
              value={selectedBarangay}
              onChange={handleBarangayChange}
              sx={{ width: 180, mr: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              SelectProps={{ native: true }}
            >
              {barangays.map((b) => (
                <option key={b.barangayId || b.id} value={b.barangayId || b.name}>
                  {b.name}
                </option>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Empty message when filtered results have no schedules */}
        {schedules.length === 0 && allSchedules.length > 0 && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
            No active schedules found{selectedBarangay !== 'all' ? ` in ${selectedBarangay}` : ''}.
          </Alert>
        )}

        <Paper sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 260px)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box className="schedule-calendar">
            {/* Month indicator */}
            <Box className="month-indicator">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Box>
            
            {/* Header row with days */}
            <Box className="calendar-header">
              {/* Empty corner cell */}
              <Box className="time-cell">
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#666' }}>
                  PHT<br />UTC+8
                </Typography>
              </Box>
              
              {/* Day columns */}
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

            {/* Time grid */}
            <Box className="calendar-grid">
              {hours.map((hour) => (
                <Box key={hour} className="time-row">
                  {/* Time column */}
                  <Box className="time-cell">
                    <Typography variant="body2">
                      {formatTime(hour)}
                    </Typography>
                  </Box>
                  
                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const schedulesForSlot = getScheduleForTimeSlot(day, hour);
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <Box 
                        key={`${hour}-${dayIndex}`} 
                        className="schedule-cell"
                        sx={{ 
                          backgroundColor: isToday ? '#f8fafd' : 'white',
                          borderBottom: '1px solid #eaeaea',
                          borderRight: dayIndex < 6 ? '1px solid #eaeaea' : 'none',
                        }}
                      >
                        {schedulesForSlot && schedulesForSlot.length > 0 && schedulesForSlot.map((schedule, idx) => {
                          // Determine if the schedule is active
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
                                  mt: 0.5
                                }}>
                                  INACTIVE
                                </Typography>
                              )}
                              {schedule.isRecurring && (
                                <Typography sx={{ 
                                  fontSize: '9px', 
                                  color: '#666',
                                  fontWeight: 'bold',
                                  mt: 0.5
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

        {/* Legend */}
        <Box sx={{ mt: 3, p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderRadius: '8px', bgcolor: '#f9f9f9' }}>
          <Typography variant="h6" sx={{ mr: 3, fontWeight: 600 }}>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Box sx={{ 
                bgcolor: '#ffebee', 
                borderLeft: '4px solid #f44336',
                width: 30, 
                height: 30, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                px: 1
              }}></Box>
              <Typography sx={{ px: 2, py: 0.5, fontSize: 14, color: '#000000', fontWeight: 500 }}>
                Non-Biodegradable
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Box sx={{ 
                bgcolor: '#e8f5e9',
                borderLeft: '4px solid #4caf50',
                width: 30, 
                height: 30, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                px: 1
              }}></Box>
              <Typography sx={{ px: 2, py: 0.5, fontSize: 14, color: '#000000', fontWeight: 500 }}>
                Biodegradable
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Floating Action Button for adding schedule */}
        <Tooltip title="Add Schedule">
          <Fab 
            color="primary" 
            aria-label="add"
            onClick={handleAddSchedule}
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              right: 20,
              bgcolor: '#4CAF50',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                bgcolor: '#43A047'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schedule={selectedSchedule}
        isEdit={isEditMode}
        barangays={barangays}
        existingSchedules={allSchedules}
      />

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%', boxShadow: '0 3px 10px rgba(0,0,0,0.15)', borderRadius: '8px' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default CollectionSchedule; 