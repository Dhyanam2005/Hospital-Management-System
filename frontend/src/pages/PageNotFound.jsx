import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', textAlign: 'center',
    }}>
      <Box>
        <Box sx={{
          width: 72, height: 72, borderRadius: 3, mx: 'auto', mb: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
          boxShadow: '0 8px 24px rgba(220,38,38,0.25)',
        }}>
          <AlertTriangle size={36} color="#fff" />
        </Box>
        <Typography variant="h1" fontWeight={800} sx={{ fontSize: '5rem', color: '#dc2626', lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h6" fontWeight={600} color="text.primary" mt={1}>
          Page Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5} mb={3}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained" onClick={() => navigate('/')}
          startIcon={<Home size={16} />}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
          }}
        >
          Go to Home
        </Button>
      </Box>
    </Box>
  );
}

export default NotFound;
