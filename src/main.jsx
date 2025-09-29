import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { CssBaseline } from '@mui/material'; 
import './index.css';
import App from './App';

// Main app render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CssBaseline />
      <App />
    </LocalizationProvider>
  </StrictMode>,
);
