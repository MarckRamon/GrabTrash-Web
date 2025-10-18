import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://grabtrash-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Beautiful console logger utility
 */
const logger = {
  success: (message, data = null) => {
    console.log(
      `%c✨ ${message}`,
      'color: #10b981; font-weight: bold; font-size: 12px;',
      data || ''
    );
  },
  error: (message, data = null) => {
    console.log(
      `%c❌ ${message}`,
      'color: #ef4444; font-weight: bold; font-size: 12px;',
      data || ''
    );
  },
  warning: (message, data = null) => {
    console.log(
      `%c⚠️ ${message}`,
      'color: #f59e0b; font-weight: bold; font-size: 12px;',
      data || ''
    );
  },
  info: (message, data = null) => {
    console.log(
      `%c🔹 ${message}`,
      'color: #3b82f6; font-weight: bold; font-size: 12px;',
      data || ''
    );
  },
  secure: (message) => {
    console.log(
      `%c🔐 ${message}`,
      'color: #8b5cf6; font-weight: bold; font-size: 12px;'
    );
  },
  api: (method, url, status) => {
    const color = status >= 200 && status < 300 ? '#10b981' : '#ef4444';
    const icon = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(
      `%c${icon} API ${method.toUpperCase()} %c${url} %c${status}`,
      'color: #6366f1; font-weight: bold; font-size: 12px;',
      'color: #64748b; font-size: 11px;',
      `color: ${color}; font-weight: bold; font-size: 12px;`
    );
  },
  token: (minutesLeft) => {
    console.log(
      `%c⏱️ Token valid for ${minutesLeft} minutes`,
      'color: #06b6d4; font-weight: bold; font-size: 12px; background: #f0fdfa; padding: 4px 8px; border-radius: 4px;'
    );
  }
};

/**
 * Helper function to decode JWT tokens
 */
const decodeJwt = (token) => {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    logger.error('Failed to decode JWT token', error);
    return null;
  }
};

/**
 * Check if a token is expired
 */
const isTokenExpired = (decodedToken) => {
  if (!decodedToken || !decodedToken.exp) return true;
  
  const expirationTime = decodedToken.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  
  if (timeUntilExpiry > 0) {
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
    logger.token(minutesUntilExpiry);
  }
  
  return currentTime >= expirationTime;
};

/**
 * Clear all auth tokens from local storage
 */
const clearAuthTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('firestoreAuthToken');
  localStorage.removeItem('firestoreAuthClaims');
  logger.warning('Authentication tokens cleared');
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const url = config.url || '';
      const isAuthEndpoint = url.includes('/users/login') || 
                            url.includes('/users/register') || 
                            url.includes('/users/refresh');
      
      const decoded = decodeJwt(token);
      if (decoded && isTokenExpired(decoded)) {
        logger.warning('Token expired - clearing authentication');
        clearAuthTokens();
      } else {
        if (!isAuthEndpoint) {
          logger.secure('Adding auth token to request');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          if (config.headers && config.headers.Authorization) {
            delete config.headers.Authorization;
          }
        }
      }
    } else {
      logger.info(`No auth token for: ${config.url}`);
    }
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase() || 'GET';
    const url = response.config.url || 'unknown';
    logger.api(method, url, response.status);
    return response;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown endpoint';
    const status = error.response?.status;
    
    logger.api(method, url, status || 0);
    
    if (error.response) {
      const { status } = error.response;
      
      // Handle auth errors (401/403)
      if ((status === 401 || status === 403) && !url.includes('/users/login')) {
        logger.warning('Authentication failed - redirecting to login');
        clearAuthTokens();
        
        if (!window.location.pathname.includes('/')) {
          window.location.href = '/';
        }
      } 
      // Handle 404 errors
      else if (status === 404) {
        logger.warning(`Endpoint not found: ${url}`);
      }
      // Handle 405 errors (method not allowed)
      else if (status === 405) {
        logger.warning(`Method not allowed: ${method} ${url}`);
      }
      // Handle network errors
      else if (status === 0 || !status) {
        logger.error('Network error - Unable to connect to server');
      }
      // Handle 500 server errors
      else if (status >= 500) {
        logger.error(`Server error (${status})`);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication check method
api.isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeJwt(token);
  if (!decoded || isTokenExpired(decoded)) {
    clearAuthTokens();
    return false;
  }
  
  return true;
};

// Get current user from JWT
api.getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decoded = decodeJwt(token);
  if (!decoded || isTokenExpired(decoded)) {
    clearAuthTokens();
    return null;
  }
  
  return decoded;
};

// Get user role
api.getUserRole = () => {
  const user = api.getCurrentUser();
  return user?.role || null;
};

/**
 * Assign a driver to a payment
 */
api.assignDriverToPayment = async (paymentId, driverId) => {
  const response = await api.post('/payments/assign-driver', {
    paymentId,
    driverId,
  });
  return response.data;
};

/**
 * Fetch all users
 */
api.fetchAllUsers = async () => {
  const response = await api.get('/users/all');
  return response.data?.users || response.data || [];
};

/**
 * Fetch all trucks
 */
api.fetchAllTrucks = async () => {
  const response = await api.get('/trucks');
  return response.data;
};

/**
 * Create a new truck
 */
api.createTruck = async (truckData) => {
  const response = await api.post('/trucks', truckData);
  return response.data;
};

/**
 * Update a truck
 */
api.updateTruck = async (truckId, truckData) => {
  const response = await api.put(`/trucks/${truckId}`, truckData);
  return response.data;
};

/**
 * Delete a truck
 */
api.deleteTruck = async (truckId) => {
  const response = await api.delete(`/trucks/${truckId}`);
  return response.data;
};

/**
 * Assign a truck to a payment
 */
api.assignTruckToPayment = async (paymentId, truckId) => {
  logger.info(`Assigning truck ${truckId} to payment ${paymentId}`);
  const response = await api.post('/trucks/assign', {
    paymentId,
    truckId,
  });
  logger.success('Truck assigned successfully!');
  return response.data;
};

/**
 * Release a truck from a payment
 */
api.releaseTruckFromPayment = async (paymentId) => {
  const response = await api.post(`/trucks/release/${paymentId}`);
  return response.data;
};

/**
 * Fetch all barangays
 */
api.fetchAllBarangays = async () => {
  const response = await api.get('/barangays');
  return response.data;
};

/**
 * Assign a driver to a truck
 */
api.assignDriverToTruck = async (truckId, driverId) => {
  const response = await api.post('/trucks/assign-driver', {
    truckId,
    driverId,
  });
  return response.data;
};

/**
 * Remove a driver from a truck
 */
api.removeDriverFromTruck = async (truckId) => {
  const response = await api.delete(`/trucks/remove-driver/${truckId}`);
  return response.data;
};

/**
 * Fetch unassigned trucks
 */
api.fetchUnassignedTrucks = async () => {
  const response = await api.get('/trucks/unassigned');
  return response.data;
};

/**
 * Fetch trucks assigned to a specific driver
 */
api.fetchTrucksByDriver = async (driverId) => {
  const response = await api.get(`/trucks/driver/${driverId}`);
  return response.data;
};

export default api;