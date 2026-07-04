import React, { useState } from 'react';
import {
  Avatar, Menu, MenuItem, Divider,
  ListItemIcon, Typography, Box,
} from '@mui/material';
import { User, KeyRound, LogOut } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

export default function ProfileButton() {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const userName = localStorage.getItem('user_name') || 'User';
  const initials = userName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('audit_session_id');
    if (sessionId) {
      try {
        await authFetch(`${API_BASE_URL}/api/login-audit/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {}
    }
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Avatar trigger */}
      <Box
        onClick={e => setAnchor(e.currentTarget)}
        aria-haspopup="true"
        aria-expanded={open}
        sx={{
          width: 36, height: 36, borderRadius: '10px', cursor: 'pointer',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
          boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
          userSelect: 'none',
          transition: 'box-shadow 0.15s, transform 0.1s',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
            transform: 'translateY(-1px)',
          },
        }}
        component="button"
      >
        {initials}
      </Box>

      {/* Portal-rendered MUI Menu — always above every other element */}
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        onClick={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1, minWidth: 200, borderRadius: 2,
            border: '1px solid #e2e8f0',
            overflow: 'visible',
            '&::before': {
              content: '""', display: 'block', position: 'absolute',
              top: -5, right: 14, width: 10, height: 10,
              bgcolor: 'background.paper', transform: 'rotate(45deg)',
              borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0',
              zIndex: 0,
            },
          },
        }}
        // zIndex handled automatically by MUI portal (1300+)
      >
        {/* User info */}
        <Box sx={{ px: 2, py: 1.5, background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <Typography variant="body2" fontWeight={700} color="text.primary">{userName}</Typography>
          <Typography variant="caption" color="text.secondary">Hospital Staff</Typography>
        </Box>

        <MenuItem component="a" href="/profile" sx={{ py: 1, fontSize: 13, gap: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 0 }}><User size={15} color="#475569" /></ListItemIcon>
          My Profile
        </MenuItem>

        <MenuItem component="a" href="/change-password" sx={{ py: 1, fontSize: 13, gap: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 0 }}><KeyRound size={15} color="#475569" /></ListItemIcon>
          Change Password
        </MenuItem>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ py: 1, fontSize: 13, gap: 1.5, color: '#dc2626',
               '&:hover': { background: '#fef2f2' } }}
        >
          <ListItemIcon sx={{ minWidth: 0 }}><LogOut size={15} color="#dc2626" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
}
