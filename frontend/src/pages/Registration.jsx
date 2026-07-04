import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment,
  Button, Chip, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, ClipboardList } from 'lucide-react';
import RegistrationForm from '../components/RegistrationForm';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function Registration() {
  const [patientName, setPatientName] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientData, setPatientData] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!patientName.trim()) return;
    setLoading(true);
    setError('');
    setSelectedPatientId('');
    try {
      const res = await authFetch(
        `${API_BASE_URL}/fetchpat?patientName=${encodeURIComponent(patientName.trim())}`
      );
      const data = await res.json();
      if (res.ok) {
        const withId = data.map((item, i) => ({ id: item.patient_id || i, ...item }));
        setPatientData(withId);
        setSearched(true);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const columns = [
    {
      field: 'patient_id', headerName: 'Patient ID', width: 130,
      renderCell: (p) => (
        <span style={{ fontWeight: 700, color: '#2563eb' }}>{p.value}</span>
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    {
      field: 'date_of_birth', headerName: 'Date of Birth', width: 160,
      renderCell: (p) => (
        <span style={{ color: '#475569' }}>{p.value}</span>
      ),
    },
    {
      field: 'age', headerName: 'Age', width: 90,
      renderCell: (p) => (
        <Chip label={`${p.value} yrs`} size="small" variant="outlined"
          sx={{ fontSize: 11, height: 22, borderColor: '#e2e8f0', color: '#475569' }} />
      ),
    },
    {
      field: 'select', headerName: 'Select', width: 120,
      renderCell: (p) => (
        <Button
          size="small"
          variant={selectedPatientId === p.row.patient_id ? 'contained' : 'outlined'}
          onClick={() => setSelectedPatientId(p.row.patient_id)}
          sx={{
            fontSize: 11, py: 0.3, minWidth: 80, fontWeight: 600, textTransform: 'none',
            ...(selectedPatientId === p.row.patient_id
              ? { background: 'linear-gradient(135deg,#2563eb,#0891b2)', boxShadow: 'none' }
              : {}),
          }}
        >
          {selectedPatientId === p.row.patient_id ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <ClipboardList size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Patient Registration
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Search a patient to register or update their details
          </Typography>
        </Box>
      </Box>

      {/* Search card */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
          sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
          Search Patient
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', maxWidth: 560 }}>
          <TextField
            fullWidth size="small"
            placeholder="Enter patient name…"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={17} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, backgroundColor: '#f8fafc',
                '&:hover fieldset': { borderColor: '#2563eb' },
                '&.Mui-focused fieldset': { borderColor: '#2563eb' },
              },
            }}
          />
          <Button
            variant="contained" onClick={handleSearch}
            disabled={loading || !patientName.trim()}
            sx={{
              px: 3, borderRadius: 2, fontWeight: 700, textTransform: 'none',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)', whiteSpace: 'nowrap',
              '&:hover': { boxShadow: '0 6px 18px rgba(37,99,235,0.40)' },
            }}
          >
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }}>{error}</Alert>}
      </Paper>

      {/* Patient results */}
      {searched && (
        <Paper elevation={0} sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc',
          }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">Patient Results</Typography>
            <Chip
              label={`${patientData.length} record${patientData.length !== 1 ? 's' : ''} found`}
              size="small"
              sx={{
                fontSize: 11, fontWeight: 600, height: 22,
                backgroundColor: patientData.length > 0 ? '#eff6ff' : '#f1f5f9',
                color: patientData.length > 0 ? '#2563eb' : '#64748b',
              }}
            />
          </Box>
          <Box sx={{ height: patientData.length === 0 ? 120 : Math.min(240, 56 + patientData.length * 52) }}>
            <DataGrid
              rows={patientData} columns={columns}
              disableRowSelectionOnClick
              hideFooterPagination={patientData.length <= 10}
              hideFooter={patientData.length <= 10}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
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

      {/* Registration form */}
      {selectedPatientId && <RegistrationForm patientId={selectedPatientId} />}
    </Box>
  );
}

export default Registration;
