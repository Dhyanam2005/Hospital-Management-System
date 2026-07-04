import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, Divider, CircularProgress,
} from '@mui/material';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function ChangePassword() {
  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage]       = useState('');
  const [showOld, setShowOld]                 = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/changepassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/');
      } else {
        setErrorMessage(data.errorMessage || 'Invalid credentials. Please try again.');
      }
    } catch {
      setErrorMessage('Service error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const eyeBtn = (show, toggle) => (
    <InputAdornment position="end">
      <IconButton size="small" onClick={toggle} edge="end">
        {show ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
      </IconButton>
    </InputAdornment>
  );

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5, backgroundColor: '#f8fafc',
      '&:hover fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused': { backgroundColor: '#fff' },
    },
  };

  const label = (text) => (
    <Typography variant="caption" fontWeight={700} color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
      {text}
    </Typography>
  );

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <KeyRound size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Change Password</Typography>
          <Typography variant="caption" color="text.secondary">Update your account password</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
          display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock size={16} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">Security</Typography>
        </Box>

        {errorMessage && (
          <Box sx={{ px: 2.5, pt: 2 }}>
            <Alert severity="error" onClose={() => setErrorMessage('')}
              sx={{ borderRadius: 1.5, py: 0.5 }}>{errorMessage}</Alert>
          </Box>
        )}

        <Box component="form" onSubmit={handleChangePassword} sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            {label('Current Password')}
            <TextField fullWidth size="small" type={showOld ? 'text' : 'password'}
              placeholder="Enter current password"
              value={oldPassword} onChange={e => setOldPassword(e.target.value)} required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={15} color="#94a3b8" /></InputAdornment>,
                endAdornment: eyeBtn(showOld, () => setShowOld(p => !p)),
              }}
              sx={fieldSx} />
          </Box>

          <Box>
            {label('New Password')}
            <TextField fullWidth size="small" type={showNew ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={15} color="#94a3b8" /></InputAdornment>,
                endAdornment: eyeBtn(showNew, () => setShowNew(p => !p)),
              }}
              sx={fieldSx} />
          </Box>

          <Box>
            {label('Confirm New Password')}
            <TextField fullWidth size="small" type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              error={confirmPassword.length > 0 && confirmPassword !== newPassword}
              helperText={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={15} color="#94a3b8" /></InputAdornment>,
                endAdornment: eyeBtn(showConfirm, () => setShowConfirm(p => !p)),
              }}
              sx={fieldSx} />
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#f1f5f9' }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, p: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleChangePassword} variant="contained"
            disabled={saving || (confirmPassword.length > 0 && confirmPassword !== newPassword)}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <KeyRound size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}>
            {saving ? 'Updating…' : 'Update Password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ChangePassword;
