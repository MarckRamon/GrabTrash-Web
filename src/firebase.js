// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaJwvobwtTcKL3_jVEBFABJH_W_7RLPvU",
  authDomain: "ecotrack-web.firebaseapp.com",
  projectId: "ecotrack-web",
  storageBucket: "ecotrack-web.appspot.com",
  messagingSenderId: "393654842503",
  appId: "1:393654842503:web:7fc2a4c2ee4c3d73839e2c"
};

console.log('🔥 Initializing Firebase with project ID:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Note: We're mostly using the RESTful API approach for data access now,
// but we still initialize Firebase for potential future direct access needs

// Get the JWT token from local storage
export const getAuthToken = () => {
  return localStorage.getItem('token') || null;
};

// A simple function to check if the user is authenticated
export const isAuthenticated = () => {
  // Check if we have a token in localStorage
  const token = localStorage.getItem('token');
  return !!token;
};

console.log('✅ Firebase initialized successfully');

export { db, auth };
export default app; 