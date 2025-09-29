import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useLocation } from 'react-router-dom';

/**
 * This component synchronizes the authentication state between your backend and Firebase
 * It runs automatically in the background and doesn't render anything visible
 */
const AuthSynchronizer = () => {
  const [isSynced, setIsSynced] = useState(false);
  const location = useLocation();
  
  // Function to decode JWT token
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error decoding JWT token:', error);
      return null;
    }
  };
  
  // Function to check if the token is expired
  const isTokenExpired = (decodedToken) => {
    if (!decodedToken || !decodedToken.exp) return true;
    
    // Token expiration time is in seconds
    const expirationTime = decodedToken.exp * 1000;
    const currentTime = Date.now();
    
    // Return true if expired
    return currentTime >= expirationTime;
  };
  
  // Determine if current page is a protected route that requires authentication
  const isProtectedRoute = () => {
    const path = location.pathname;
    return path.includes('/dashboard') || 
           path.includes('/profile') ||
           path.includes('/users') ||
           path.includes('/job-orders') ||
           path.includes('/collection-points') ||
           path.includes('/schedule');
  };
  
  // Sync auth state when component mounts
  useEffect(() => {
    // Only run auth check on protected routes
    if (!isProtectedRoute()) {
      console.log('🔑 Public route, skipping auth check');
      return;
    }
    
    console.log('🔄 AuthSynchronizer starting...');
    
    // Function to setup Firestore access with the JWT token
    const setupFirestoreAccess = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Don't show warning on login page
        if (location.pathname !== '/') {
          console.log('⚠️ No JWT token found, Firestore access will be limited');
        }
        return false;
      }
      
      try {
        // Decode the token to check its validity
        const decoded = decodeJwt(token);
        
        if (!decoded) {
          console.error('❌ Invalid JWT token format');
          return false;
        }
        
        if (isTokenExpired(decoded)) {
          console.error('❌ JWT token is expired');
          // Clear expired token
          localStorage.removeItem('token');
          localStorage.removeItem('firestoreAuthToken');
          return false;
        }
        
        // Store the token for Firestore access
        localStorage.setItem('firestoreAuthToken', token);
        
        // Store role information if available
        if (decoded.role) {
          localStorage.setItem('firestoreAuthClaims', JSON.stringify({
            role: decoded.role
          }));
          console.log(`🔐 User authenticated with role: ${decoded.role}`);
        }
        
        console.log('✅ JWT token configured for Firestore access');
        return true;
      } catch (error) {
        console.error('❌ Error configuring Firestore access:', error);
        return false;
      }
    };
    
    // Initial setup - only if on a protected route
    if (isProtectedRoute()) {
      const isSetup = setupFirestoreAccess();
      setIsSynced(isSetup);
    }
    
    // Listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔑 Firebase auth state: Signed in as', user.uid);
      } else if (isProtectedRoute()) {
        // Only try to set up Firestore access on protected routes
        console.log('🔑 Firebase auth state: Not signed in, using JWT');
        setupFirestoreAccess();
      }
    });
    
    // Set up a token refresh check every minute - only for protected routes
    let intervalId;
    if (isProtectedRoute()) {
      intervalId = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = decodeJwt(token);
          if (decoded && isTokenExpired(decoded)) {
            console.warn('⚠️ JWT token expired, clearing authentication');
            localStorage.removeItem('token');
            localStorage.removeItem('firestoreAuthToken');
            localStorage.removeItem('firestoreAuthClaims');
            setIsSynced(false);
            
            // Sign out of Firebase if signed in
            if (auth.currentUser) {
              signOut(auth);
            }
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/')) {
              window.location.href = '/';
            }
          }
        }
      }, 60000); // Check every minute
    }
    
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [location.pathname]); // Re-run when the route changes
  
  // This component doesn't render anything
  return null;
};

export default AuthSynchronizer; 