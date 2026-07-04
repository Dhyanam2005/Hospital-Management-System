import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, IconButton, Popover, List, ListItem, ListItemIcon,
  ListItemText, Typography, Box, Divider, CircularProgress,
} from '@mui/material';
import {
  Calendar, BedDouble, FlaskConical, CreditCard, UserPlus,
  Users, Bell,
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const authHdr = () => ({});

/* Notification definitions — static config, dynamic counts */
function buildItems(counts) {
  return [
    {
      key   : 'today_appointments',
      label : "Today's Appointments",
      icon  : <Calendar size={18} color="#3b82f6" />,
      route : '/appointment',
      color : '#eff6ff',
    },
    {
      key   : 'today_admissions',
      label : "Today's Admissions",
      icon  : <UserPlus size={18} color="#8b5cf6" />,
      route : '/admission',
      color : '#f5f3ff',
    },
    {
      key   : 'current_admissions',
      label : 'Current Admissions',
      icon  : <Users size={18} color="#a855f7" />,
      route : '/admission',
      color : '#faf5ff',
    },
    {
      key   : 'today_payments',
      label : 'Payments Received Today',
      icon  : <CreditCard size={18} color="#10b981" />,
      route : '/payment',
      color : '#ecfdf5',
    },
    {
      key   : 'today_tests',
      label : 'Tests Conducted Today',
      icon  : <FlaskConical size={18} color="#f97316" />,
      route : '/test',
      color : '#fff7ed',
    },
    {
      key   : 'available_beds',
      label : 'Available Beds',
      icon  : <BedDouble size={18} color="#22c55e" />,
      route : '/admission',
      color : '#f0fdf4',
    },
    {
      key   : 'occupied_beds',
      label : 'Occupied Beds',
      icon  : <BedDouble size={18} color="#ef4444" />,
      route : '/admission',
      color : '#fef2f2',
    },
  ].map(item => ({ ...item, count: counts?.[item.key] ?? '—' }));
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchor, setAnchor]   = useState(null);
  const [counts, setCounts]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE_URL}/api/notifications/counts`, { headers: authHdr() });
      if (r.ok) setCounts(await r.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  /* Load on mount */
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  /* Re-fetch whenever the dropdown opens */
  function openMenu(e) {
    setAnchor(e.currentTarget);
    fetchCounts();
  }

  const items = buildItems(counts);

  /* Badge total = sum of all numeric counts */
  const total = counts
    ? Object.values(counts).reduce((s, v) => s + (Number(v) || 0), 0)
    : 0;

  return (
    <>
      <IconButton onClick={openMenu} size="small" sx={{ mr: 1 }}>
        <Badge
          badgeContent={total}
          max={999}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: 10,
              height: 18,
              minWidth: 18,
              fontWeight: 700,
            },
          }}
        >
          <Bell size={22} color="#374151" />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 6,
          sx: { width: 320, borderRadius: 2, overflow: 'hidden' },
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2, py: 1.5,
          bgcolor: '#1a3a6c', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bell size={16} />
            <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
          </Box>
          {loading
            ? <CircularProgress size={14} sx={{ color: '#93c5fd' }} />
            : <Typography variant="caption" sx={{ color: '#93c5fd' }}>
                {total} total
              </Typography>
          }
        </Box>

        <Divider />

        {/* List */}
        <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.map((item, idx) => (
            <React.Fragment key={item.key}>
              <ListItem
                button
                onClick={() => { setAnchor(null); navigate(item.route); }}
                sx={{
                  px: 2, py: 1.2,
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: item.color },
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500} color="text.primary">
                      {item.label}
                    </Typography>
                  }
                />
                <Box sx={{
                  ml: 1,
                  bgcolor: item.color,
                  border: '1.5px solid',
                  borderColor: '#e5e7eb',
                  borderRadius: '12px',
                  px: 1.2, py: 0.2,
                  minWidth: 32,
                  textAlign: 'center',
                }}>
                  <Typography variant="caption" fontWeight={700} color="text.primary">
                    {loading ? '…' : item.count}
                  </Typography>
                </Box>
              </ListItem>
              {idx < items.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        {/* Footer */}
        <Divider />
        <Box sx={{ px: 2, py: 1, bgcolor: '#f9fafb', textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => { setAnchor(null); fetchCounts(); }}
          >
            Click to refresh counts
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
