import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Pill, Search } from 'lucide-react';
import MedicalItemForm from '../components/MedicalItemForm';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function MedicalItem() {
  const [patientName, setPatientName] = useState('');
  const [selectedRegId, setSelectedRegId] = useState('');
  const [patientData, setPatientData] = useState([]);
  const [showTestGrid, setShowTestGrid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/consultationDoc?patientName=${encodeURIComponent(patientName)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (res.ok) setPatientData(data);
    } catch {}
    setLoading(false);
  };

  const columns = [
    {
      field: 'patient_id', headerName: 'Patient ID', width: 120,
      renderCell: p => <span style={{ fontWeight: 700, color: '#2563eb' }}>{p.value}</span>,
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    {
      field: 'age', headerName: 'Age', width: 80,
      renderCell: p => (
        <Chip label={p.value} size="small"
          sx={{ fontSize: 11, fontWeight: 600, height: 20, backgroundColor: '#f0fdf4', color: '#059669' }} />
      ),
    },
    {
      field: 'reg_id', headerName: 'Registration ID', width: 140,
      renderCell: p => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0891b2' }}>{p.value}</span>
      ),
    },
    {
      field: 'select', headerName: 'Select', width: 110, sortable: false,
      renderCell: params => (
        <Button
          size="small" variant={selectedRegId === params.row.reg_id ? 'contained' : 'outlined'}
          onClick={() => { setSelectedRegId(params.row.reg_id); setShowTestGrid(true); }}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 11, borderRadius: 1.5,
            minWidth: 80, height: 26,
            ...(selectedRegId === params.row.reg_id
              ? { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }
              : { borderColor: '#2563eb', color: '#2563eb' }),
          }}
        >
          {selectedRegId === params.row.reg_id ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  const rows = patientData.map((p, i) => ({ id: i, ...p }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <Pill size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Medical Items</Typography>
          <Typography variant="caption" color="text.secondary">Search patients and add prescribed medical items</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Enter patient name…"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={15} color="#94a3b8" /></InputAdornment>,
            }}
            sx={{
              flex: 1, maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, backgroundColor: '#f8fafc',
                '&:hover fieldset': { borderColor: '#2563eb' },
                '&.Mui-focused fieldset': { borderColor: '#2563eb' },
              },
            }}
          />
          <Button
            variant="contained" onClick={handleSearch} disabled={loading}
            startIcon={<Search size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {patientData.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Box sx={{
            px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc',
          }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">Search Results</Typography>
            <Chip label={`${patientData.length} patient${patientData.length !== 1 ? 's' : ''}`} size="small"
              sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb' }} />
          </Box>
          <Box sx={{ height: 320 }}>
            <DataGrid
              rows={rows} columns={columns} loading={loading}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
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
      )}

      {showTestGrid && <MedicalItemForm regId={selectedRegId} />}
    </Box>
  );
}

export default MedicalItem;
