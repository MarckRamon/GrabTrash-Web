import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormHelperText,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  DialogContentText,
  Divider,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import schedulesService from '../services/schedulesService';

const ScheduleDialog = ({ open, onClose, schedule, isEdit = false, barangays = [], existingSchedules = [] }) => {
  const [formData, setFormData] = useState({
    scheduleId: '',
    barangayId: '',
    barangayName: '',
    collectionDateTime: new Date(),
    isActive: true,
    isRecurring: false,
    notes: '',
    recurringDay: 'MONDAY',
    recurringTime: '',
    wasteType: 'NON_BIODEGRADABLE',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // If we're editing an existing schedule, populate the form
  useEffect(() => {
    // Debug log barangay data
    console.log(`📊 Available barangays in dialog: ${barangays.length}`);
    if (barangays.length > 0) {
      barangays.forEach(b => console.log(`  - ${b.name} (${b.barangayId})`));
    } else {
      console.warn('⚠️ No barangays available for selection');
    }
    
    if (isEdit && schedule) {
      console.log('Editing existing schedule:', schedule);
      
      // Determine the active status from either isActive or active field
      const isActiveValue = 
        schedule.isActive !== undefined ? schedule.isActive : 
        schedule.active !== undefined ? schedule.active : true;
      
      console.log(`Setting form isActive value to: ${isActiveValue}`);
      
      setFormData({
        scheduleId: schedule.scheduleId || '',
        barangayId: schedule.barangayId || '',
        barangayName: schedule.barangayName || '',
        collectionDateTime: schedule.collectionDateTime ? new Date(schedule.collectionDateTime) : new Date(),
        isActive: isActiveValue,
        isRecurring: schedule.isRecurring !== undefined ? schedule.isRecurring : false,
        notes: schedule.notes || '',
        recurringDay: schedule.recurringDay || 'MONDAY',
        recurringTime: schedule.recurringTime || '08:00:00',
        wasteType: schedule.wasteType || 'NON_BIODEGRADABLE',
      });
    } else {
      // Reset form for new schedule
      console.log('Creating new schedule');
      setFormData({
        scheduleId: '',
        barangayId: barangays.length > 0 ? barangays[0].barangayId : '',
        barangayName: barangays.length > 0 ? barangays[0].name : '',
        collectionDateTime: new Date(),
        isActive: true,
        isRecurring: false,
        notes: '',
        recurringDay: 'MONDAY',
        recurringTime: '08:00:00',
        wasteType: 'NON_BIODEGRADABLE',
      });
    }
    setErrors({});
  }, [isEdit, schedule, open, barangays]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If barangay changes, update the barangayName
    if (name === 'barangayId') {
      const selectedBarangay = barangays.find(b => b.barangayId === value);
      if (selectedBarangay) {
        setFormData(prev => ({
          ...prev,
          barangayId: value,
          barangayName: selectedBarangay.name
        }));
      }
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear duplicate error when form changes
    if (errors.duplicate) {
      setErrors(prev => ({
        ...prev,
        duplicate: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      collectionDateTime: date
    }));
    if (errors.collectionDateTime) {
      setErrors(prev => ({
        ...prev,
        collectionDateTime: ''
      }));
    }
    // Clear duplicate error when date changes
    if (errors.duplicate) {
      setErrors(prev => ({
        ...prev,
        duplicate: ''
      }));
    }
  };

  const handleTimeChange = (time) => {
    // For one-time schedules, update the hours and minutes of collectionDateTime
    if (!formData.isRecurring) {
      const newDateTime = new Date(formData.collectionDateTime);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      
      setFormData(prev => ({
        ...prev,
        collectionDateTime: newDateTime
      }));
    } else {
      // For recurring schedules, update the recurringTime
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      
      setFormData(prev => ({
        ...prev,
        recurringTime: timeString
      }));
    }
    
    // Clear duplicate error when time changes
    if (errors.duplicate) {
      setErrors(prev => ({
        ...prev,
        duplicate: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    console.log(`🔄 Switch changed: ${name} = ${checked}`);
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Clear duplicate error when switch changes
    if (errors.duplicate) {
      setErrors(prev => ({
        ...prev,
        duplicate: ''
      }));
    }
  };

  // Handle delete button click (soft delete)
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  // Handle active status toggle
  const handleActiveToggle = async () => {
    if (!isEdit || !formData.scheduleId) return;
    
    const newStatus = !formData.isActive;
    
    setIsSubmitting(true);
    try {
      await schedulesService.toggleScheduleActive(formData.scheduleId, newStatus, formData);
      
      // Update local form data
      setFormData(prev => ({
        ...prev,
        isActive: newStatus
      }));
      
      showNotification(
        newStatus ? 'Schedule activated successfully' : 'Schedule deactivated successfully'
      );
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to update schedule status. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to show notifications
  const showNotification = (message) => {
    // In a real application, this would trigger a notification
    console.log(message);
  };

  // Handle soft delete confirmation
  const handleConfirmDelete = async () => {
    if (!formData.scheduleId) {
      setErrors(prev => ({
        ...prev,
        submit: 'Cannot delete: Schedule ID is missing'
      }));
      setDeleteConfirmOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await schedulesService.deleteSchedule(formData.scheduleId);
      setDeleteConfirmOpen(false);
      onClose('deleted'); // Use a special status to indicate deletion
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to delete schedule. Please try again.'
      }));
      setDeleteConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for potential duplicate schedules (client-side preview)
  const checkForDuplicateSchedule = () => {
    if (!formData.barangayId) return false;
    
    const selectedBarangay = barangays.find(b => b.barangayId === formData.barangayId);
    if (!selectedBarangay) return false;
    
    // Check for potential duplicates in existing schedules
    const duplicateSchedules = existingSchedules.filter(existingSchedule => {
      // Skip the current schedule if we're editing
      if (isEdit && existingSchedule.scheduleId === formData.scheduleId) {
        return false;
      }
      
      // Check if it's the same barangay
      if (existingSchedule.barangayId !== formData.barangayId) {
        return false;
      }
      
      // Check if it's the same waste type
      if (existingSchedule.wasteType !== formData.wasteType) {
        return false;
      }
      
      // For recurring schedules
      if (formData.isRecurring) {
        return existingSchedule.isRecurring && 
               existingSchedule.recurringDay === formData.recurringDay &&
               existingSchedule.recurringTime === formData.recurringTime;
      }
      
      // For one-time schedules - check exact match (backend will handle 1-minute tolerance)
      if (!formData.isRecurring && formData.collectionDateTime) {
        const existingDate = new Date(existingSchedule.collectionDateTime);
        const newDate = new Date(formData.collectionDateTime);
        
        // Check if it's the same date and time
        return existingDate.getFullYear() === newDate.getFullYear() &&
               existingDate.getMonth() === newDate.getMonth() &&
               existingDate.getDate() === newDate.getDate() &&
               existingDate.getHours() === newDate.getHours() &&
               existingDate.getMinutes() === newDate.getMinutes();
      }
      
      return false;
    });
    
    return duplicateSchedules.length > 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.barangayId) {
      newErrors.barangayId = 'Barangay is required';
    }
    
    if (!formData.isRecurring && !formData.collectionDateTime) {
      newErrors.collectionDateTime = 'Date and time are required';
    }
    
    if (formData.isRecurring && !formData.recurringDay) {
      newErrors.recurringDay = 'Day is required';
    }
    
    if (formData.isRecurring && !formData.recurringTime) {
      newErrors.recurringTime = 'Time is required';
    }
    
    // Check for potential duplicate schedules (client-side preview)
    if (checkForDuplicateSchedule()) {
      newErrors.duplicate = '⚠️ A similar schedule already exists. The backend will perform final validation with 1-minute tolerance.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      console.log('Preparing schedule data for submission');
      
      // Get the selected barangay's name
      const selectedBarangay = barangays.find(b => b.barangayId === formData.barangayId);
      if (!selectedBarangay) {
        throw new Error('Selected barangay not found');
      }
      
      // Prepare the schedule data based on API format
      const scheduleData = {
        barangayId: formData.barangayId,
        barangayName: selectedBarangay.name,
        isActive: formData.isActive,
        active: formData.isActive,
        isRecurring: formData.isRecurring,
        recurring: formData.isRecurring,
        notes: formData.notes,
        wasteType: formData.wasteType,
      };
      
      // Add the appropriate fields based on whether it's recurring or not
      if (formData.isRecurring) {
        scheduleData.recurringDay = formData.recurringDay;
        scheduleData.recurringTime = formData.recurringTime;
        // Set collectionDateTime to a default date for API requirements
        scheduleData.collectionDateTime = new Date();
        // Ensure these fields are explicitly set for recurring schedules
        scheduleData.isRecurring = true;
        scheduleData.recurring = true;
      } else {
        // Format the date properly as a Date object for API
        scheduleData.collectionDateTime = formData.collectionDateTime;
        // Set recurring fields to null or default values
        scheduleData.recurringDay = null;
        scheduleData.recurringTime = null;
        // Ensure these fields are explicitly set for one-time schedules
        scheduleData.isRecurring = false;
        scheduleData.recurring = false;
      }
      
      console.log('Submitting schedule data:', scheduleData);
      console.log('Form data before submission:', {
        isRecurring: formData.isRecurring,
        recurringDay: formData.recurringDay,
        recurringTime: formData.recurringTime,
        collectionDateTime: formData.collectionDateTime
      });
      console.log('Final schedule data:', {
        isRecurring: scheduleData.isRecurring,
        recurring: scheduleData.recurring,
        recurringDay: scheduleData.recurringDay,
        recurringTime: scheduleData.recurringTime,
        collectionDateTime: scheduleData.collectionDateTime
      });
      
      if (isEdit && schedule && schedule.scheduleId) {
        console.log(`Updating existing schedule: ${schedule.scheduleId}`);
        await schedulesService.updateSchedule(schedule.scheduleId, scheduleData);
        console.log('Schedule updated successfully');
      } else {
        console.log('Creating new schedule');
        await schedulesService.addSchedule(scheduleData);
        console.log('Schedule created successfully');
      }
      
      onClose(true); // Close dialog and indicate success
    } catch (error) {
      console.error('Error saving schedule:', error);
      
      // Handle backend duplicate validation error
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        if (errorData && errorData.error && errorData.error.includes('schedule already exists')) {
          setErrors(prev => ({
            ...prev,
            duplicate: '❌ ' + errorData.error + ' Please choose a different time or date.',
            submit: ''
          }));
          return; // Don't show generic error for duplicate
        }
      }
      
      setErrors(prev => ({
        ...prev,
        submit: `Failed to save schedule: ${error.message || 'Unknown error'}`
      }));
      
      // Show more detailed error information for debugging
      if (error.response) {
        console.error(`API error: ${error.response.status}`, error.response.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the time object for the time pickers
  const getTimeObject = () => {
    if (formData.isRecurring && formData.recurringTime) {
      // Parse the HH:MM:SS string to a Date object
      const [hours, minutes] = formData.recurringTime.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours, 10));
      timeDate.setMinutes(parseInt(minutes, 10));
      return timeDate;
    } else {
      return formData.collectionDateTime;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            {isEdit ? 'Edit Collection Schedule' : 'Add Collection Schedule'}
          </Typography>
          {isEdit && (
            <Box>
              <Tooltip title={formData.isActive ? "Deactivate Schedule" : "Activate Schedule"}>
                <IconButton 
                  color={formData.isActive ? "success" : "default"}
                  onClick={handleActiveToggle}
                  sx={{ mr: 1 }}
                >
                  {formData.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton 
                  edge="end" 
                  color="error" 
                  onClick={handleDeleteClick}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Status indicator for editing */}
            {isEdit && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center', 
                    bgcolor: formData.isActive ? 'success.light' : 'action.disabledBackground',
                    color: formData.isActive ? 'success.contrastText' : 'text.secondary',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Box>
              </Box>
            )}

            <FormControl fullWidth margin="normal" error={!!errors.barangayId}>
              <InputLabel>Barangay</InputLabel>
              <Select
                name="barangayId"
                value={formData.barangayId}
                onChange={handleChange}
                label="Barangay"
                disabled={barangays.length === 0}
              >
                {barangays.length > 0 ? (
                  barangays.map(barangay => (
                    <MenuItem key={barangay.barangayId} value={barangay.barangayId}>
                      {barangay.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <em>Loading barangays... or none available</em>
                  </MenuItem>
                )}
              </Select>
              {errors.barangayId && <FormHelperText>{errors.barangayId}</FormHelperText>}
              {barangays.length === 0 && (
                <FormHelperText error>
                  No barangays available - please add barangays to Firestore first
                </FormHelperText>
              )}
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={handleSwitchChange}
                    name="isRecurring"
                    color="primary"
                  />
                }
                label="Recurring Schedule"
              />
            </FormControl>
            
            {formData.isRecurring ? (
              // For recurring schedules
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                <FormControl fullWidth error={!!errors.recurringDay}>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    name="recurringDay"
                    value={formData.recurringDay}
                    onChange={handleChange}
                    label="Day of Week"
                  >
                    <MenuItem value="MONDAY">Monday</MenuItem>
                    <MenuItem value="TUESDAY">Tuesday</MenuItem>
                    <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                    <MenuItem value="THURSDAY">Thursday</MenuItem>
                    <MenuItem value="FRIDAY">Friday</MenuItem>
                    <MenuItem value="SATURDAY">Saturday</MenuItem>
                    <MenuItem value="SUNDAY">Sunday</MenuItem>
                  </Select>
                  {errors.recurringDay && <FormHelperText>{errors.recurringDay}</FormHelperText>}
                </FormControl>
                
                <TimePicker
                  label="Time"
                  value={getTimeObject()}
                  onChange={handleTimeChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.recurringTime,
                      helperText: errors.recurringTime
                    }
                  }}
                />
              </Box>
            ) : (
              // For one-time schedules
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                <DatePicker
                  label="Date"
                  value={formData.collectionDateTime}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.collectionDateTime,
                      helperText: errors.collectionDateTime
                    }
                  }}
                />
                
                <TimePicker
                  label="Time"
                  value={formData.collectionDateTime}
                  onChange={handleTimeChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.collectionDateTime,
                      helperText: errors.collectionDateTime && "Time is required"
                    }
                  }}
                />
              </Box>
            )}
            
            <FormControl fullWidth margin="normal" error={!!errors.wasteType}>
              <InputLabel>Waste Type</InputLabel>
              <Select
                name="wasteType"
                value={formData.wasteType}
                onChange={handleChange}
                label="Waste Type"
              >
                <MenuItem value="BIODEGRADABLE">Biodegradable</MenuItem>
                <MenuItem value="NON_BIODEGRADABLE">Non-Biodegradable</MenuItem>
              </Select>
              {errors.wasteType && <FormHelperText>{errors.wasteType}</FormHelperText>}
            </FormControl>
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <FormControl fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                    name="isActive"
                    color="success"
                  />
                }
                label={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.isActive ? "Visible in Calendar" : "Hidden from Calendar"}
                    </Typography>
                  </Box>
                }
              />
              <FormHelperText>
                {formData.isActive ? 
                  "This schedule will be displayed in the calendar" : 
                  "This schedule will be hidden from the calendar but can be made visible later"}
              </FormHelperText>
            </FormControl>
            
            {errors.duplicate && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {errors.duplicate}
              </Alert>
            )}
            
            {errors.submit && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {errors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting || !!errors.duplicate}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {"Deactivate Collection Schedule?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            This will mark the schedule as inactive and hide it from the calendar.
            You can reactivate it later by editing the schedule and setting it back to active.
            Would you like to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ScheduleDialog; 