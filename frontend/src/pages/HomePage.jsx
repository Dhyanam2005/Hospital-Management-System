import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

function HomePage() {
  const userName = localStorage.getItem('user_name') || 'Staff';

  return (
    <Box>
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: 2, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #1e40af 0%, #0891b2 100%)',
        border: 'none',
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight={800} color="#fff" mb={0.5}>
            Welcome back, {userName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            City General Hospital Management System
          </Typography>
        </Box>
        <Box sx={{
          position: 'absolute', top: -20, right: -20,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -30, right: 80,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
      </Paper>
    </Box>
  );
}

export default HomePage;
