import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Stethoscope, UserPlus } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function Doctor() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/doctor`)
      .then(r => r.json())
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      field: 'doc_id', headerName: 'ID', width: 80,
      renderCell: p => <span style={{ fontWeight: 700, color: '#2563eb' }}>{p.value}</span>,
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'doc_type', headerName: 'Type', width: 120,
      renderCell: p => (
        <Chip
          label={p.value === 'I' ? 'In-House' : 'Referral'}
          size="small"
          sx={{
            fontSize: 11, fontWeight: 600, height: 22,
            backgroundColor: p.value === 'I' ? '#eff6ff' : '#f0fdf4',
            color: p.value === 'I' ? '#2563eb' : '#059669',
          }}
        />
      ),
    },
    { field: 'specialization', headerName: 'Specialization', flex: 1, minWidth: 160 },
    { field: 'qualification', headerName: 'Qualification', width: 140 },
    { field: 'medical_license_number', headerName: 'License No.', width: 140 },
    {
      field: 'created_at', headerName: 'Joined', width: 160,
      renderCell: p => (
        <span style={{ color: '#475569', fontSize: 12 }}>
          {p.value ? new Date(p.value).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  const rows = doctors.map((d, i) => ({ id: d.doc_id || i, ...d }));

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
            <Stethoscope size={20} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">Doctors Directory</Typography>
            <Typography variant="caption" color="text.secondary">All registered doctors in the system</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          href="/new-doctor"
          startIcon={<UserPlus size={15} />}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5,
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
          }}
        >
          Add Doctor
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">All Doctors</Typography>
          <Chip label={`${doctors.length} total`} size="small"
            sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb' }} />
        </Box>
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={rows} columns={columns} loading={loading}
            pageSizeOptions={[25, 50, 100]}
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
    </Box>
  );
}

export default Doctor;
