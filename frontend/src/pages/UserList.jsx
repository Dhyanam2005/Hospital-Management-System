import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment,
  Chip, Button, Snackbar, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Users, Search, UserPlus } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function UserList() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [toast,   setToast]   = useState(null);

  const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';

  const loadUsers = useCallback(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/users`)
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setToast({ sev: 'error', msg: 'Failed to load users.' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = query
    ? users.filter(u => u.user_name?.toLowerCase().includes(query.toLowerCase()))
    : users;

  const columns = [
    {
      field: 'user_id', headerName: 'ID', width: 80,
      renderCell: p => <span style={{ fontWeight: 700, color: '#2563eb' }}>{p.value}</span>,
    },
    { field: 'user_name', headerName: 'Username', flex: 1, minWidth: 160 },
    { field: 'user_email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'created_at', headerName: 'Created', flex: 1, minWidth: 180,
      renderCell: p => (
        <span style={{ color: '#475569', fontSize: 12 }}>
          {p.value ? new Date(p.value).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  const rows = filtered.map((u, i) => ({ id: u.user_id || i, ...u }));

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#2563eb,#0891b2)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}>
            <Users size={20} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">User Management</Typography>
            <Typography variant="caption" color="text.secondary">
              {isSuperAdmin ? 'Manage system users and assign roles via User Role Mapping' : 'Browse system users'}
            </Typography>
          </Box>
        </Box>
        {isSuperAdmin && (
          <Button
            variant="contained" href="/new-user"
            startIcon={<UserPlus size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}
          >
            New User
          </Button>
        )}
      </Box>

      {/* Search */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Search by username…"
          value={query} onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={17} color="#94a3b8" /></InputAdornment>,
          }}
          sx={{
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2, backgroundColor: '#f8fafc',
              '&:hover fieldset': { borderColor: '#2563eb' },
              '&.Mui-focused fieldset': { borderColor: '#2563eb' },
            },
          }}
        />
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">All Users</Typography>
          <Chip label={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb' }} />
        </Box>
        <Box sx={{ height: 480 }}>
          <DataGrid
            rows={rows} columns={columns} loading={loading}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            sx={{
              border: 'none', fontFamily: 'inherit', fontSize: '0.875rem',
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#e8f0fe', color: '#1e40af',
                fontWeight: 700, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#f0f7ff' },
            }}
          />
        </Box>
      </Paper>

      <Snackbar
        open={!!toast} autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast && (
          <Alert severity={toast.sev} onClose={() => setToast(null)} variant="filled" sx={{ minWidth: 280 }}>
            {toast.msg}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}

export default UserList;
