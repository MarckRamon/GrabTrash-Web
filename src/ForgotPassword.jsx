import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './AdminLogin.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your password reset logic here
    navigate('/');
  };

  return (
    <Box 
      className="login-container"
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/loginbg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(70%)',
          zIndex: 0,
        }}
      />
      <Container 
        maxWidth="xs" 
        sx={{ 
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '24px',
            p: '24px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        >
          <Box sx={{ mb: 2.5 }}>
            <img 
              src="/loginlogo.jpg" 
              alt="GrabTrash Logo" 
              style={{ 
                height: '80px',
                objectFit: 'contain',
                marginBottom: '12px'
              }} 
            />
          </Box>

          <Box sx={{ mb: 3, textAlign: 'left' }}>
            <Link
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#111827',
                textDecoration: 'none',
                fontSize: '14px',
                mb: 3,
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Back to login
            </Link>

            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#333',
              mb: 1,
              fontSize: '26px',
            }}>
              Forgot your password?
            </Typography>
            <Typography sx={{ 
              color: '#6B7280',
              fontSize: '14px',
            }}>
              Don't worry, happens to all of us. Enter your email below to recover your password
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <Typography 
                sx={{ 
                  textAlign: 'left', 
                  mb: 0.5,
                  fontSize: '13px',
                  color: '#374151',
                }}
              >
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                value={email}
                onChange={handleChange}
                variant="outlined"
                size="small"
                placeholder="primo.christian@gmail.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              sx={{
                bgcolor: '#4CAF50',
                color: 'white',
                py: 1.25,
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                borderRadius: '8px',
                mb: 3,
                '&:hover': {
                  bgcolor: '#43A047',
                }
              }}
            >
              Submit
            </Button>

            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E5E7EB' }}>
              <Typography sx={{ 
                color: '#6B7280',
                fontSize: '14px',
                mb: 2,
              }}>
                Or login with
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    style={{ width: 18, height: 18 }} 
                  />
                }
                sx={{
                  color: '#374151',
                  borderColor: '#E5E7EB',
                  textTransform: 'none',
                  fontSize: '14px',
                  py: 1,
                  '&:hover': {
                    borderColor: '#D1D5DB',
                    bgcolor: '#F9FAFB',
                  }
                }}
              >
                Continue with Google
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword; 