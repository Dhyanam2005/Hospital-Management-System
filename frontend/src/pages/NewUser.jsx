import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, Grid, Divider,
  CircularProgress,
} from '@mui/material';
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

function Newuser() {
  const [username, setUsername]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirm_password, setConfirm]    = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [saving, setSaving]               = useState(false);
  const navigate = useNavigate();

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      backgroundColor: '#f8fafc',
      '&:hover fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused': { backgroundColor: '#fff' },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/newuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username, password, confirm_password, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('User created successfully. They can now log in.');
        setUsername(''); setEmail(''); setPassword(''); setConfirm('');
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch {
      setError('Service error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <UserPlus size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Create New User
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add a staff member account to the system
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        {/* Card header strip */}
        <Box sx={{
          px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <ShieldCheck size={16} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Account Details
          </Typography>
        </Box>

        {/* Alerts */}
        {(success || error) && (
          <Box sx={{ px: 2.5, pt: 2 }}>
            {success && (
              <Alert severity="success" onClose={() => setSuccess('')}
                sx={{ borderRadius: 1.5, py: 0.5 }}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" onClose={() => setError('')}
                sx={{ borderRadius: 1.5, py: 0.5 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {/* Username */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
                Username
              </Typography>
              <TextField
                fullWidth size="small" placeholder="e.g. dr.sharma"
                value={username} onChange={e => setUsername(e.target.value)}
                required autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><User size={15} color="#94a3b8" /></InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
                Email Address
              </Typography>
              <TextField
                fullWidth size="small" type="email" placeholder="e.g. dr.sharma@hospital.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Mail size={15} color="#94a3b8" /></InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
                Password
              </Typography>
              <TextField
                fullWidth size="small" placeholder="Enter password"
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Lock size={15} color="#94a3b8" /></InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(p => !p)} edge="end">
                        {showPass ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            </Grid>

            {/* Confirm Password */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth size="small" placeholder="Re-enter password"
                type={showConfirm ? 'text' : 'password'}
                value={confirm_password} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password"
                error={confirm_password.length > 0 && confirm_password !== password}
                helperText={
                  confirm_password.length > 0 && confirm_password !== password
                    ? 'Passwords do not match'
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Lock size={15} color="#94a3b8" /></InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm(p => !p)} edge="end">
                        {showConfirm ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            </Grid>

          </Grid>
        </Box>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, p: 2 }}>
          <Button
            variant="outlined" onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}
          >
            Cancel
          </Button>
          <Button
            type="submit" form="newUserForm" variant="contained"
            disabled={saving || (confirm_password.length > 0 && confirm_password !== password)}
            onClick={handleSubmit}
            startIcon={saving
              ? <CircularProgress size={14} color="inherit" />
              : <UserPlus size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
              '&:hover': { boxShadow: '0 6px 18px rgba(37,99,235,0.40)' },
            }}
          >
            {saving ? 'Creating…' : 'Create User'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Newuser;
