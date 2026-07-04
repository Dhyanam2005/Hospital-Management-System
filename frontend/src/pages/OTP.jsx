import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress,
} from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import API_BASE_URL from '../apiConfig';

function OTP() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem('userId');
  const expiry = localStorage.getItem('expiry');
  const last_logged = localStorage.getItem('last_logged');
  const navigate = useNavigate();
  const { refreshMenus } = useMenu();

  const handleVerify = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('isSuperAdmin', String(data.isSuperAdmin === true));
        if (data.audit_session_id) localStorage.setItem('audit_session_id', data.audit_session_id);
        localStorage.removeItem('userId');
        refreshMenus();
        if (new Date(expiry + last_logged) > new Date()) {
          navigate('/change-password');
        } else {
          navigate('/');
        }
      } else {
        setMessage(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: '#f0f4f8',
    }}>
      <Paper elevation={0} sx={{
        width: '100%', maxWidth: 380, p: 4,
        border: '1px solid #e2e8f0', borderRadius: 3,
        boxShadow: '0 8px 32px rgba(37,99,235,0.10)',
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#2563eb,#0891b2)',
            boxShadow: '0 4px 16px rgba(37,99,235,0.30)',
          }}>
            <ShieldCheck size={28} color="#fff" />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Verify OTP</Typography>
          <Typography variant="caption" color="text.secondary">
            Enter the one-time password sent to your registered contact
          </Typography>
        </Box>

        {message && (
          <Alert severity="error" onClose={() => setMessage('')}
            sx={{ mb: 2, borderRadius: 1.5, py: 0.5, fontSize: 13 }}>
            {message}
          </Alert>
        )}

        <TextField
          fullWidth size="small" placeholder="Enter OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          autoFocus
          inputProps={{ style: { textAlign: 'center', letterSpacing: '0.25em', fontSize: 20, fontWeight: 700 } }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5, backgroundColor: '#f8fafc',
              '&:hover fieldset': { borderColor: '#2563eb' },
              '&.Mui-focused fieldset': { borderColor: '#2563eb' },
            },
          }}
        />

        <Button
          fullWidth variant="contained" onClick={handleVerify}
          disabled={loading || !otp}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.2,
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            fontSize: '0.95rem',
          }}
        >
          {loading ? 'Verifying…' : 'Verify OTP'}
        </Button>
      </Paper>
    </Box>
  );
}

export default OTP;
