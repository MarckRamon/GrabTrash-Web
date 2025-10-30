import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  Avatar,
  Paper,
  IconButton,
  Fade,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LogoutIcon from '@mui/icons-material/Logout';
import { getAuth } from 'firebase/auth';
import './firebase.js'; // or adjust import as necessary
import api from "./api/axios";

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const FILELU_API_KEY = '42392ix8ebpn54bgalgek';

  const uploadToFileLu = async (file) => {
    const serverRes = await fetch(`https://filelu.com/api/upload/server?key=${FILELU_API_KEY}`);
    const serverJson = await serverRes.json();
    if (!serverRes.ok || !serverJson?.result) throw new Error('Unable to get FileLu upload server');

    const uploadUrl = serverJson.result;
    const sessId = serverJson.sess_id;

    const uploadForm = new FormData();
    uploadForm.append('sess_id', sessId);
    uploadForm.append('utype', 'prem');
    const fileWithName = new File([file], file.name, { type: file.type });
    uploadForm.append('file', fileWithName);

    const fileUploadRes = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
    const fileUploadJson = await fileUploadRes.json().catch(() => null);
    if (!fileUploadRes.ok || !Array.isArray(fileUploadJson) || !fileUploadJson[0]?.file_code) {
      throw new Error('FileLu upload failed');
    }
    const fileCode = fileUploadJson[0].file_code;

    const infoRes = await fetch(`https://filelu.com/api/file/info?file_code=${encodeURIComponent(fileCode)}&key=${FILELU_API_KEY}`);
    const infoJson = await infoRes.json();

    const directRes = await fetch('https://filelu.com/api/file/direct_link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ file_code: fileCode, key: FILELU_API_KEY }).toString(),
    });
    const directJson = await directRes.json();
    let directUrl = directJson?.result?.url || '';
    if (directUrl.startsWith('http://')) {
      directUrl = 'https://' + directUrl.slice('http://'.length);
    }

    const canonicalUrl = `https://filelu.com/${fileCode}`;
    const previewUrl = directUrl || canonicalUrl;
    return { previewUrl, canonicalUrl };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        });

        setCurrentPhotoUrl(userData.profileImageUrl || userData.profileImage || '');

        if (userData.userId) {
          try {
            // Note: You'll need to replace this with your actual API call
            // const response = await api.get(`/users/profile/${userData.userId}`);
            // const profile = response?.data || {};
            // ... handle profile data
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading profile data',
          severity: 'error',
        });
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      if (!selectedImage) {
        setSnackbar({ open: true, message: 'Please select an image first', severity: 'warning' });
        return;
      }

      const { previewUrl, canonicalUrl } = await uploadToFileLu(selectedImage);
      setUploadedImageUrl(previewUrl);
      setCurrentPhotoUrl(previewUrl);

      // Step 1: Get user id for Firestore
      const auth = getAuth();
      let userId = auth.currentUser ? auth.currentUser.uid : undefined;
      if (!userId) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userId = userData.userId;
      }
      if (!userId) throw new Error('User ID not found');
      // Step 2: Save image to Firestore
      // const db = getFirestore();
      // await updateDoc(doc(db, 'users', userId), {
      //   profileImage: previewUrl
      // });
      
      // Optionally update localStorage and fire event for instant UI
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...userData, profileImage: previewUrl }));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { profileImageUrl: previewUrl, photoUrl: previewUrl } }));
      
      setSelectedImage(null);
      setPreviewImage('');
      setSnackbar({ open: true, message: 'Photo uploaded and profile pic updated!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Error uploading or saving photo', severity: 'error' });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.userId;
      if (!userId) throw new Error('User ID not found');

      // 1. Update profile fields (no photo)
      await api.put(`/users/profile/${userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });

      // 2. Update profile image separately if a new one was uploaded
      if (uploadedImageUrl) {
        const suffix = uploadedImageUrl.toLowerCase();
        const imageType = suffix.endsWith('.png') ? 'png' : 'jpeg';
        await api.put('/users/profile/image', {
          imageUrl: uploadedImageUrl,
          imageType
        });
      }

      // 3. Fetch refreshed profile and persist to localStorage/UI
      const refreshed = await api.get(`/users/profile/${userId}`);
      const latest = refreshed.data || {};
      const serverImage = latest.profileImage || latest.profileImageUrl || uploadedImageUrl || currentPhotoUrl;
      const updatedUserData = {
        ...userData,
        firstName: latest.firstName ?? formData.firstName,
        lastName: latest.lastName ?? formData.lastName,
        email: latest.email ?? formData.email ?? userData.email,
        profileImage: serverImage,
        profileImageUrl: serverImage
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          firstName: updatedUserData.firstName,
          lastName: updatedUserData.lastName,
          email: updatedUserData.email,
          photoUrl: serverImage,
          profileImageUrl: serverImage,
        }
      }));

      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      setTimeout(() => navigate(-1), 1000);
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Error updating profile', severity: 'error' });
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firestoreAuthToken');
    navigate('/', { replace: true });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #e8f5e9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(104, 159, 56, 0.08) 100%)',
        borderRadius: '0 0 50% 50%',
        zIndex: 0,
      },
    }}>
      <Fade in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 600,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            p: { xs: 3, sm: 5 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Back Button */}
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              bgcolor: 'rgba(46, 125, 50, 0.1)',
              color: '#2e7d32',
              '&:hover': { 
                bgcolor: 'rgba(46, 125, 50, 0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {/* Logout Button */}
          <IconButton
            onClick={handleLogout}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              bgcolor: 'rgba(211, 47, 47, 0.1)',
              color: '#d32f2f',
              '&:hover': { 
                bgcolor: 'rgba(211, 47, 47, 0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <LogoutIcon />
          </IconButton>

          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5, mt: 2 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={previewImage || currentPhotoUrl}
                alt="Profile"
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: '4px solid white',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
                }}
              />
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: '#2e7d32',
                  color: 'white',
                  width: 40,
                  height: 40,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)',
                  '&:hover': {
                    bgcolor: '#1b5e20',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 20 }} />
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={handleImageSelect} 
                />
              </IconButton>
            </Box>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900,
                background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
              }}
            >
              Edit Profile
            </Typography>
            <Typography sx={{ color: '#666', fontSize: '1rem', fontWeight: 500 }}>
              Update your personal information
            </Typography>
          </Box>

          {/* Photo Upload Section */}
          {selectedImage && (
            <Fade in>
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: '16px',
                  bgcolor: 'rgba(46, 125, 50, 0.05)',
                  border: '2px dashed rgba(46, 125, 50, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PhotoCameraIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#2e7d32', fontSize: '0.9rem' }}>
                        {selectedImage.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                        Ready to upload
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadPhoto}
                    sx={{
                      background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                      color: 'white',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '12px',
                      px: 3,
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)',
                      },
                      transition: 'all 0.3s',
                    }}
                  >
                    Upload
                  </Button>
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Form Fields */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography 
                sx={{ 
                  mb: 1.5, 
                  color: '#2e7d32', 
                  fontSize: '0.9rem', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                First Name
              </Typography>
              <TextField
                fullWidth
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: '#f8f9fa',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#fff',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& fieldset': {
                        borderColor: '#2e7d32',
                        borderWidth: 2,
                      },
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography 
                sx={{ 
                  mb: 1.5, 
                  color: '#2e7d32', 
                  fontSize: '0.9rem', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Last Name
              </Typography>
              <TextField
                fullWidth
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: '#f8f9fa',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#fff',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& fieldset': {
                        borderColor: '#2e7d32',
                        borderWidth: 2,
                      },
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography 
                sx={{ 
                  mb: 1.5, 
                  color: '#2e7d32', 
                  fontSize: '0.9rem', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                variant="outlined"
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: 'rgba(46, 125, 50, 0.05)',
                    fontWeight: 600,
                    '& fieldset': {
                      borderColor: 'rgba(46, 125, 50, 0.2)',
                    },
                  },
                }}
              />
              <Typography sx={{ mt: 1, fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                Email cannot be changed
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.8,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(46, 125, 50, 0.4)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#9e9e9e',
                  },
                  transition: 'all 0.3s',
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;