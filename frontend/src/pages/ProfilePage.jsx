import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Divider, Alert, CircularProgress, Chip,
} from '@mui/material';
import { User } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
  const role = isSuperAdmin
    ? { label: 'Super Admin', color: '#dc2626', bg: '#fef2f2' }
    : { label: 'Staff Member', color: '#2563eb', bg: '#eff6ff' };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setErrorMessage('No token found. Please log in.'); setLoading(false); return; }
    authFetch(`${API_BASE_URL}/user`)
      .then(r => r.json()).then(setUser)
      .catch(() => setErrorMessage('Error fetching profile data.'))
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.user_name?.slice(0, 2).toUpperCase() || '??';

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
          <User size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">My Profile</Typography>
          <Typography variant="caption" color="text.secondary">Your account information</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        {/* Avatar section */}
        <Box sx={{
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '18px',
            background: 'rgba(255,255,255,0.20)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {initials}
          </Box>
          {user && (
            <Chip
              label={role.label} size="small"
              sx={{
                fontWeight: 700, fontSize: 12, height: 24,
                backgroundColor: 'rgba(255,255,255,0.20)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.30)',
              }}
            />
          )}
        </Box>

        {/* Info section */}
        <Box sx={{ p: 2.5 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} sx={{ color: '#2563eb' }} />
            </Box>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ borderRadius: 1.5, py: 0.5 }}>{errorMessage}</Alert>
          )}
          {user && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'User ID', value: `#${user.user_id}` },
                { label: 'Username', value: user.user_name },
                { label: 'Role', value: role.label },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {row.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {row.value}
                    </Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default ProfilePage;
