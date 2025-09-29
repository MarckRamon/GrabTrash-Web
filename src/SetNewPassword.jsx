import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './AdminLogin.css';

const SetNewPassword = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleChange = (prop) => (event) => {
    setPasswords({ ...passwords, [prop]: event.target.value });
  };

  const handleClickShowPassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
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
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#333',
              mb: 1,
              fontSize: '26px',
            }}>
              Set a password
            </Typography>
            <Typography sx={{ 
              color: '#6B7280',
              fontSize: '14px',
            }}>
              Your previous password has been reset. Please set a new password for your account.
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
                Create Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword.password ? 'text' : 'password'}
                name="password"
                value={passwords.password}
                onChange={handleChange('password')}
                variant="outlined"
                size="small"
                placeholder="12345789"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword('password')}
                        edge="end"
                      >
                        {showPassword.password ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography 
                sx={{ 
                  textAlign: 'left', 
                  mb: 0.5,
                  fontSize: '13px',
                  color: '#374151',
                }}
              >
                Re-enter Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange('confirmPassword')}
                variant="outlined"
                size="small"
                placeholder="12345789"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword('confirmPassword')}
                        edge="end"
                      >
                        {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
                '&:hover': {
                  bgcolor: '#43A047',
                }
              }}
            >
              Submit
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default SetNewPassword; 