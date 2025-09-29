import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
// import AdminLayout from './components/AdminLayout'; // Remove AdminLayout import
import api from './api/axios';
import { auth } from './firebase';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

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
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const FILELU_API_KEY = '42392ix8ebpn54bgalgek';

  // Helper: upload a file to FileLu and return preview and canonical URLs
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
    const fileNameFromLu = infoJson?.result?.[0]?.name || file.name;

    // Get a direct download URL for preview in <img>
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

    // Canonical page link for persistence
    const canonicalUrl = `https://filelu.com/${fileCode}`;
    // Fallback preview if direct not available
    const previewUrl = directUrl || canonicalUrl;
    return { previewUrl, canonicalUrl };
  };

  const persistProfileImage = async (userId, imageUrl, extraFields = {}) => {
    // Always include required fields, but omit empty strings/nulls
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const safeExtra = {
      ...extraFields,
      email: extraFields.email || userData.email || formData.email || undefined,
      firstName: extraFields.firstName || formData.firstName || userData.firstName || undefined,
      lastName: extraFields.lastName || formData.lastName || userData.lastName || undefined,
    };
    const prunedExtra = Object.fromEntries(
      Object.entries(safeExtra).filter(([, v]) => v !== undefined && v !== null && `${v}`.trim() !== '')
    );

    const body = { profileImage: imageUrl, ...prunedExtra };
    const resp = await api.put(`/users/profile/${userId}`, body);
    if (resp && (resp.status === 200 || resp.status === 201)) {
      // Best-effort verify; do not fail if GET shape differs
      try {
        const verify = await api.get(`/users/profile/${userId}`);
        const verified = verify?.data?.profileImage || verify?.data?.profileImageUrl || verify?.data?.photoUrl;
        return verified || imageUrl;
      } catch (_) {
        return imageUrl;
      }
    }
    throw new Error('Profile image update request failed');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Get user data from localStorage as fallback
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Attempt to fetch the latest profile data from the backend
        try {
          const profileResponse = await api.get(`/users/profile/${userData.userId}`);
          const latestProfile = profileResponse.data;
          setFormData({
            firstName: latestProfile.firstName || userData.firstName || '',
            lastName: latestProfile.lastName || userData.lastName || '',
            email: latestProfile.email || userData.email || '',
          });
          const photoUrlFromApi = latestProfile.photoUrl || latestProfile.profileImageUrl || latestProfile.profileImage || '';
          const photoUrlFromStorage = userData.profileImageUrl || userData.profileImage || '';
          setCurrentPhotoUrl(photoUrlFromApi || photoUrlFromStorage || '');
        } catch (fetchError) {
          console.error('Error fetching latest profile data:', fetchError);
          // If fetching fails, use data from localStorage
           setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
          });
          setCurrentPhotoUrl(userData.profileImageUrl || '');
          setSnackbar({
            open: true,
            message: 'Could not fetch latest profile data. Using local data.',
            severity: 'warning',
          });
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading profile data',
          severity: 'error',
        });
         // If token is invalid or missing, redirect to login
         if (error.response?.status === 401 || error.response?.status === 403) {
             navigate('/');
         }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('firestoreAuthToken'); // Assuming this is used
    navigate('/', { replace: true });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setSelectedImageFile(null);
      setImagePreviewUrl('');
      return;
    }
    setSelectedImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const handleUploadPhoto = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      if (!selectedImageFile) {
        setSnackbar({ open: true, message: 'Please select an image first', severity: 'warning' });
        return;
      }

      // Upload to FileLu but do NOT persist to backend yet
      const { previewUrl, canonicalUrl } = await uploadToFileLu(selectedImageFile);
      // Use previewUrl (direct image) for UI and persistence to backend
      setUploadedImageUrl(previewUrl);
      setCurrentPhotoUrl(previewUrl);
      // Persist locally so avatar survives navigation before backend save
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = { ...userData, profileImageUrl: previewUrl, profileImage: previewUrl, profileImagePage: canonicalUrl };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      const event = new CustomEvent('profileUpdated', {
        detail: {
          firstName: updatedUserData.firstName,
          lastName: updatedUserData.lastName,
          email: updatedUserData.email,
          photoUrl: previewUrl,
          profileImageUrl: previewUrl,
        },
      });
      window.dispatchEvent(event);
      setSelectedImageFile(null);
      setImagePreviewUrl('');

      setSnackbar({ open: true, message: 'Photo uploaded. Click Save Changes to apply.', severity: 'success' });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || error.message || 'Error uploading photo', severity: 'error' });
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

      // Get the current user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.userId;

      if (!userId) {
        throw new Error('User ID not found');
      }

      // Determine which image URL to persist: prefer freshly uploaded
      const imageUrlToPersist = uploadedImageUrl || currentPhotoUrl || '';

      // 1) Update names/email (JWT is attached by axios instance)
      const profilePayload = { firstName: formData.firstName, lastName: formData.lastName, email: formData.email };
      console.log('Saving profile core fields for userId:', userId, 'payload:', profilePayload);
      const coreResp = await api.put(`/users/profile/${userId}`, profilePayload);
      console.log('Core profile save response:', coreResp.status, coreResp.data);

      // 2) Update image via dedicated image endpoint to ensure server persists to Firestore
      if (imageUrlToPersist) {
        const lower = (imageUrlToPersist || '').toLowerCase();
        const imageType = lower.endsWith('.png') || lower.includes('image/png') ? 'png' :
                          lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.includes('image/jpeg') ? 'jpeg' : 'jpeg';
        const imagePayload = { imageUrl: imageUrlToPersist, imageType };
        console.log('Saving profile image via /users/profile/image:', imagePayload);
        const imgResp = await api.put('/users/profile/image', imagePayload);
        console.log('Profile image save response:', imgResp.status, imgResp.data);
      }

      if (true) {
        // Re-fetch latest profile to align with backend persistence
        try {
          const refreshed = await api.get(`/users/profile/${userId}`);
          const latest = refreshed?.data || {};
          const serverImage = latest.profileImage || latest.profileImageUrl || latest.photoUrl || imageUrlToPersist;
          const updatedUserData = {
            ...userData,
            firstName: latest.firstName ?? formData.firstName,
            lastName: latest.lastName ?? formData.lastName,
            email: latest.email ?? formData.email ?? userData.email,
            ...(serverImage ? { profileImageUrl: serverImage, profileImage: serverImage } : {}),
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));

          const event = new CustomEvent('profileUpdated', {
            detail: {
              firstName: updatedUserData.firstName,
              lastName: updatedUserData.lastName,
              email: updatedUserData.email,
              photoUrl: updatedUserData.profileImage || updatedUserData.profileImageUrl,
              profileImageUrl: updatedUserData.profileImage || updatedUserData.profileImageUrl,
            },
          });
          window.dispatchEvent(event);
        } catch (refreshErr) {
          console.warn('Could not refresh profile; using local values', refreshErr);
        }

        // Clear the uploaded URL marker once persisted
        setUploadedImageUrl('');

        // Optional: Dispatch a custom event if other components need to react to profile updates
        // const event = new CustomEvent('profileUpdated', {
        //   detail: {
        //     firstName: formData.firstName,
        //     lastName: formData.lastName,
        //     email: userData.email,
        //   }
        // });
        // window.dispatchEvent(event);

        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating profile',
        severity: 'error',
      });
       // If token is invalid or missing, redirect to login
         if (error.response?.status === 401 || error.response?.status === 403) {
             navigate('/');
         }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 480,
        bgcolor: 'white',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(30,41,59,0.10)',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 24,
            left: 24,
            color: '#4CAF50',
            fontWeight: 600,
            bgcolor: 'transparent',
            '&:hover': { bgcolor: '#f1f5f9', color: '#388e3c' },
            textTransform: 'none',
          }}
        >
          Back
        </Button>
        {/* Header with Avatar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
          {imagePreviewUrl || currentPhotoUrl ? (
            <img
              src={imagePreviewUrl || currentPhotoUrl}
              alt="Profile"
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid #e5e7eb' }}
            />
          ) : (
            <AccountCircleIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 1 }} />
          )}
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            Edit Profile
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 16 }}>
            Update your personal information
          </Typography>
        </Box>
        {/* Photo uploader */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8}>
            <Button
              component="label"
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Choose Photo
              <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
            </Button>
            {selectedImageFile && (
              <Typography sx={{ ml: 2, display: 'inline', color: '#64748b' }}>{selectedImageFile.name}</Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={handleUploadPhoto}
              disabled={!selectedImageFile}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388e3c' }, textTransform: 'none' }}
              fullWidth
            >
              Upload Photo
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              First Name
            </Typography>
            <TextField
              fullWidth
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              variant="outlined"
              size="medium"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              Last Name
            </Typography>
            <TextField
              fullWidth
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              variant="outlined"
              size="medium"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ mb: 1, color: '#374151', fontSize: '14px', fontWeight: 600 }}>
              Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              value={formData.email}
              variant="outlined"
              size="medium"
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: '#f1f5f9', borderRadius: 2, '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#388e3c' },
                textTransform: 'none',
                px: 4,
                py: 1.5,
                mt: 2,
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(76,175,80,0.08)'
              }}
              fullWidth
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { 
                  borderColor: '#dc2626',
                  bgcolor: '#fee2e2',
                },
                textTransform: 'none',
                px: 4,
                py: 1.5,
                mt: 1,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
              }}
              fullWidth
            >
              Logout
            </Button>
          </Grid>
        </Grid>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default EditProfile;