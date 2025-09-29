import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography
} from '@mui/material';
import api from '../api/axios';

const defaultQuestions = [
  { questionId: 'FIRST_PET_NAME', answer: '' },
  { questionId: 'BIRTH_CITY', answer: '' },
  { questionId: 'MOTHERS_MAIDEN_NAME', answer: '' },
];

const CreateUserDialog = ({ open, onClose, onUserCreated }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    securityQuestions: defaultQuestions,
    role: '',
    phoneNumber: '',
    barangayId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [barangayLoading, setBarangayLoading] = useState(true);
  const [barangayError, setBarangayError] = useState('');

  useEffect(() => {
    const fetchBarangays = async () => {
      setBarangayLoading(true);
      setBarangayError('');
      try {
        const data = await api.fetchAllBarangays();
        setBarangays(data);
      } catch (err) {
        setBarangayError('Failed to load barangays');
      } finally {
        setBarangayLoading(false);
      }
    };
    if (open) fetchBarangays();
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (idx, value) => {
    const updated = [...form.securityQuestions];
    updated[idx].answer = value;
    setForm({ ...form, securityQuestions: updated });
  };

  const handleRoleChange = (e) => {
    setForm({ ...form, role: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register', form);
      setLoading(false);
      if (onUserCreated) onUserCreated();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleClose = () => {
    setForm({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      securityQuestions: defaultQuestions,
      role: '',
      phoneNumber: '',
      barangayId: '',
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New User</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
            <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
            <TextField label="Username" name="username" value={form.username} onChange={handleChange} required />
            <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Security Questions</Typography>
            {form.securityQuestions.map((q, idx) => (
              <TextField
                key={q.questionId}
                label={q.questionId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                value={q.answer}
                onChange={e => handleQuestionChange(idx, e.target.value)}
                required
              />
            ))}
            <FormControl fullWidth required>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={form.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="private_entity">Private Entity</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
            <FormControl fullWidth required disabled={barangayLoading}>
              <InputLabel id="barangay-label">Barangay</InputLabel>
              <Select
                labelId="barangay-label"
                id="barangayId"
                name="barangayId"
                value={form.barangayId}
                label="Barangay"
                onChange={handleChange}
              >
                {barangays.map((b) => (
                  <MenuItem key={b.barangayId} value={b.barangayId}>
                    {b.name} ({b.barangayId})
                  </MenuItem>
                ))}
              </Select>
              {barangayLoading && <Typography variant="caption">Loading barangays...</Typography>}
              {barangayError && <Typography color="error">{barangayError}</Typography>}
            </FormControl>
            {error && <Typography color="error">{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateUserDialog; 