import api from '../api/axios';

/**
 * Collection Schedules Service
 * Handles data operations for collection schedules
 */
const schedulesService = {
  /**
   * Get all collection schedules from API
   * @returns {Promise<Array>} Array of schedules
   */
  getAllSchedules: async () => {
    try {
      console.log('📥 Fetching all collection schedules via API');
      
      // Let's try multiple approaches to get all schedules
      let schedules = [];
      let response;
      
      try {
        // First try to get all schedules
        response = await api.get('/collection-schedules/all');
        if (response.data) {
          console.log('📊 Found schedules using /all endpoint');
          schedules = Array.isArray(response.data) ? response.data : [response.data];
        }
      } catch (err) {
        console.log('⚠️ /all endpoint not available, trying alternative');
      }
      
      // If that failed or returned no schedules, try main endpoint
      if (schedules.length === 0) {
        try {
          response = await api.get('/collection-schedules');
          if (response.data) {
            console.log('📊 Found schedules using main endpoint');
            schedules = Array.isArray(response.data) ? response.data : [response.data];
          }
        } catch (err) {
          console.log('⚠️ Main endpoint failed, trying barangay approach');
        }
      }
      
      // If still nothing, try getting schedules for each barangay
      if (schedules.length === 0) {
        try {
          // Get all barangays first
          const barangaysResponse = await api.get('/barangays');
          if (barangaysResponse.data) {
            const barangays = Array.isArray(barangaysResponse.data) 
              ? barangaysResponse.data 
              : [barangaysResponse.data];
              
            // For each barangay, get its schedules
            for (const barangay of barangays) {
              try {
                const barangaySchedulesResponse = await api.get(`/collection-schedules/barangay/${barangay.barangayId}`);
                if (barangaySchedulesResponse.data) {
                  const barangaySchedules = Array.isArray(barangaySchedulesResponse.data)
                    ? barangaySchedulesResponse.data
                    : [barangaySchedulesResponse.data];
                  
                  schedules = [...schedules, ...barangaySchedules];
                }
              } catch (err) {
                console.log(`⚠️ Could not get schedules for barangay ${barangay.barangayId}`);
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Barangay approach failed');
        }
      }
      
      if (schedules.length === 0) {
        throw new Error('No schedules data received from server after multiple attempts');
      }
      
      console.log(`📋 Successfully retrieved ${schedules.length} schedules from API`);
      
      // Format the schedules to match the expected format
      const formattedSchedules = schedules.map(schedule => {
        console.log(`📋 Processing schedule from API:`, {
          scheduleId: schedule.scheduleId,
          isRecurring: schedule.isRecurring,
          recurring: schedule.recurring,
          recurringDay: schedule.recurringDay,
          recurringTime: schedule.recurringTime
        });
        
        return {
          id: schedule.scheduleId,
          scheduleId: schedule.scheduleId,
          barangayId: schedule.barangayId,
          barangayName: schedule.barangayName,
          collectionDateTime: schedule.collectionDateTime,
          isActive: schedule.isActive !== undefined ? schedule.isActive : (schedule.active !== undefined ? schedule.active : true),
          isRecurring: schedule.isRecurring !== undefined ? schedule.isRecurring : (schedule.recurring !== undefined ? schedule.recurring : false),
          notes: schedule.notes || '',
          recurringDay: schedule.recurringDay || null,
          recurringTime: schedule.recurringTime || null,
          wasteType: schedule.wasteType || 'NON_BIODEGRADABLE',
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        };
      });
      
      return formattedSchedules;
    } catch (error) {
      console.error('❌ Error fetching schedules from API:', error);
      throw error;
    }
  },

  /**
   * Get all barangays from API
   * @returns {Promise<Array>} Array of barangays
   */
  getAllBarangays: async () => {
    try {
      console.log('📥 Fetching all barangays via API');
      
      const response = await api.get('/barangays');
      
      if (!response.data) {
        throw new Error('No barangay data received from server');
      }
      
      // Convert the response to an array if it's not already
      const barangays = Array.isArray(response.data) ? response.data : [response.data];
      console.log(`📋 Successfully retrieved ${barangays.length} barangays from API`);
      
      // Format the barangays to match the expected format
      const formattedBarangays = barangays.map(barangay => ({
        id: barangay.barangayId,
        barangayId: barangay.barangayId,
        name: barangay.name || 'Unknown Barangay',
        address: barangay.address || '',
        contactPerson: barangay.contactPerson || '',
        contactNumber: barangay.contactNumber || '',
        email: barangay.email || ''
      }));
      
      return formattedBarangays;
    } catch (error) {
      console.error('❌ Error fetching barangays from API:', error);
      throw error;
    }
  },

  /**
   * Add a new schedule 
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  addSchedule: async (scheduleData) => {
    try {
      console.log('📝 Adding new schedule via API');
      
      // Format the data to match the Spring DTO format
      const formattedData = {
        barangayId: scheduleData.barangayId,
        barangayName: scheduleData.barangayName,
        collectionDateTime: scheduleData.collectionDateTime ? 
          new Date(scheduleData.collectionDateTime).toISOString() : null,
        wasteType: scheduleData.wasteType,
        isRecurring: scheduleData.isRecurring !== undefined ? scheduleData.isRecurring : false,
        recurring: scheduleData.isRecurring !== undefined ? scheduleData.isRecurring : false,
        recurringDay: scheduleData.recurringDay,
        recurringTime: scheduleData.recurringTime,
        active: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
        notes: scheduleData.notes || ''
      };
      
      console.log('Sending formatted data to API:', formattedData);
      console.log('Backend will check for duplicates with 1-minute tolerance');
      
      const response = await api.post('/collection-schedules', formattedData);
      
      if (!response.data) {
        throw new Error('No schedule data received after creation');
      }
      
      // Format the response to match the expected format
      const createdSchedule = {
        id: response.data.scheduleId,
        scheduleId: response.data.scheduleId,
        barangayId: response.data.barangayId,
        barangayName: response.data.barangayName,
        collectionDateTime: response.data.collectionDateTime,
        isActive: response.data.active !== undefined ? response.data.active : true,
        isRecurring: response.data.recurring || false,
        notes: response.data.notes || '',
        recurringDay: response.data.recurringDay || null,
        recurringTime: response.data.recurringTime || null,
        wasteType: response.data.wasteType || 'NON_BIODEGRADABLE'
      };
      
      console.log(`✅ Created schedule with ID: ${createdSchedule.scheduleId}`);
      
      return createdSchedule;
    } catch (error) {
      console.error('❌ Error creating schedule via API:', error);
      throw error;
    }
  },

  /**
   * Update an existing schedule
   * @param {string} scheduleId - ID of schedule to update
   * @param {Object} scheduleData - Updated schedule data
   * @returns {Promise<Object>} Updated schedule
   */
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      console.log(`📝 Updating schedule ${scheduleId} via API`);
      
      // Format the data to match the Spring DTO format
      const formattedData = {
        scheduleId: scheduleId,
        barangayId: scheduleData.barangayId,
        barangayName: scheduleData.barangayName,
        collectionDateTime: scheduleData.collectionDateTime ? 
          new Date(scheduleData.collectionDateTime).toISOString() : null,
        wasteType: scheduleData.wasteType,
        isRecurring: scheduleData.isRecurring !== undefined ? scheduleData.isRecurring : false,
        recurring: scheduleData.isRecurring !== undefined ? scheduleData.isRecurring : false,
        recurringDay: scheduleData.recurringDay,
        recurringTime: scheduleData.recurringTime,
        active: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
        notes: scheduleData.notes || ''
      };
      
      console.log('Sending formatted data to API:', formattedData);
      
      const response = await api.put(`/collection-schedules/${scheduleId}`, formattedData);
      
      if (!response.data) {
        throw new Error('No schedule data received after update');
      }
      
      // Format the response to match the expected format
      const updatedSchedule = {
        id: response.data.scheduleId,
        scheduleId: response.data.scheduleId,
        barangayId: response.data.barangayId,
        barangayName: response.data.barangayName,
        collectionDateTime: response.data.collectionDateTime,
        isActive: response.data.active !== undefined ? response.data.active : true,
        isRecurring: response.data.recurring || false,
        notes: response.data.notes || '',
        recurringDay: response.data.recurringDay || null,
        recurringTime: response.data.recurringTime || null,
        wasteType: response.data.wasteType || 'NON_BIODEGRADABLE'
      };
      
      console.log(`✅ Updated schedule with ID: ${scheduleId}`);
      
      return updatedSchedule;
    } catch (error) {
      console.error(`❌ Error updating schedule ${scheduleId} via API:`, error);
      throw error;
    }
  },

  /**
   * Delete (deactivate) a schedule
   * @param {string} scheduleId - ID of schedule to delete
   * @returns {Promise<boolean>} Success status
   */
  deleteSchedule: async (scheduleId) => {
    try {
      console.log(`🗑️ Deleting schedule ${scheduleId} via API`);
      
      // Spring backend uses DELETE endpoint for this
      const response = await api.delete(`/collection-schedules/${scheduleId}`);
      
      console.log(`✅ Deleted schedule: ${scheduleId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error deleting schedule ${scheduleId} via API:`, error);
      throw error;
    }
  },

  /**
   * Toggle schedule active status
   * @param {string} scheduleId - ID of schedule
   * @param {boolean} isActive - Active status
   * @param {Object} scheduleData - Optional full schedule data
   * @returns {Promise<boolean>} Success status
   */
  toggleScheduleActive: async (scheduleId, isActive, scheduleData = null) => {
    try {
      console.log(`🔄 Toggling schedule ${scheduleId} active status to ${isActive} via API`);
      
      if (scheduleData) {
        // If we have the full schedule data, just update the active field and send the update
        const formattedData = {
          scheduleId: scheduleId,
          barangayId: scheduleData.barangayId,
          barangayName: scheduleData.barangayName,
          collectionDateTime: scheduleData.collectionDateTime ? 
            new Date(scheduleData.collectionDateTime).toISOString() : null,
          wasteType: scheduleData.wasteType,
          recurring: scheduleData.isRecurring || false,
          recurringDay: scheduleData.recurringDay,
          recurringTime: scheduleData.recurringTime,
          active: isActive,
          notes: scheduleData.notes || ''
        };
        
        await api.put(`/collection-schedules/${scheduleId}`, formattedData);
      } else {
        // Get current schedule if not provided
        const response = await api.get(`/collection-schedules/${scheduleId}`);
        if (!response.data) {
          throw new Error('Schedule not found');
        }
        
        // Update the active field
        const scheduleData = response.data;
        scheduleData.active = isActive;
        
        // Send the update
        await api.put(`/collection-schedules/${scheduleId}`, scheduleData);
      }
      
      console.log(`✅ Toggled schedule status: ${scheduleId} -> ${isActive}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error toggling schedule status ${scheduleId} via API:`, error);
      throw error;
    }
  },

  /**
   * Create a new schedule (alias for addSchedule)
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  createSchedule: async (scheduleData) => {
    return schedulesService.addSchedule(scheduleData);
  },

  /**
   * Toggle schedule status (alias for toggleScheduleActive)
   * @param {string} scheduleId - ID of schedule
   * @param {boolean} isActive - Active status
   * @returns {Promise<boolean>} Success status
   */
  toggleScheduleStatus: async (scheduleId, isActive) => {
    return schedulesService.toggleScheduleActive(scheduleId, isActive);
  }
};

export default schedulesService; 