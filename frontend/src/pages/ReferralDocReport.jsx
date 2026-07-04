import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { UserCheck, Search, Download } from 'lucide-react';
import exportToExcel from '../components/ExcelForTabularReport';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function ReferralDocReport() {
  const [data, setData]           = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [alertMsg, setAlertMsg]   = useState('');

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setAlertMsg('Please select both start date and end date.');
      return;
    }
    setLoading(true);
    setAlertMsg('');
    try {
      const s = format(startDate, 'yyyy-MM-dd');
      const e = format(endDate, 'yyyy-MM-dd');
      const res = await authFetch(`${API_BASE_URL}/referralDoc?startDate=${s}&endDate=${e}`);
      const json = await res.json();
      if (res.ok) setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const columns = [
    { field: 'Month',  headerName: 'Date',  flex: 1, minWidth: 120 },
    { field: 'Doctor', headerName: 'Doctor', flex: 2, minWidth: 180 },
    {
      field: 'Registration Fees', headerName: 'Reg. Fees', flex: 1, minWidth: 130,
      renderCell: p => <span style={{ color: '#2563eb', fontWeight: 600 }}>₹ {p.value}</span>,
    },
    {
      field: 'Test Fees', headerName: 'Test Fees', flex: 1, minWidth: 120,
      renderCell: p => <span style={{ color: '#0891b2', fontWeight: 600 }}>₹ {p.value}</span>,
    },
    {
      field: 'Total Fees', headerName: 'Total Fees', flex: 1, minWidth: 130,
      renderCell: p => <span style={{ color: '#059669', fontWeight: 700 }}>₹ {p.value}</span>,
    },
  ];

  const rows = data.map((item, i) => ({ id: i, ...item }));

  const dateSx = {
    '& .react-datepicker-wrapper input': {
      border: '1px solid #e2e8f0', borderRadius: '6px',
      padding: '7px 12px', fontSize: 13, outline: 'none',
      backgroundColor: '#f8fafc', color: '#0f172a',
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <UserCheck size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Referral Doctor Summary</Typography>
          <Typography variant="caption" color="text.secondary">Fee breakdown by referral doctor for a date range</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10, mb: 1.5, display: 'block' }}>
          Date Range
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={dateSx}>
            <DatePicker selected={startDate} onChange={setStartDate}
              dateFormat="dd-MM-yyyy" placeholderText="Start date" />
          </Box>
          <Box sx={dateSx}>
            <DatePicker selected={endDate} onChange={setEndDate}
              dateFormat="dd-MM-yyyy" placeholderText="End date" />
          </Box>
          <Button
            variant="contained" onClick={fetchData} disabled={loading}
            startIcon={<Search size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}
          >
            {loading ? 'Loading…' : 'Load Report'}
          </Button>
        </Box>
      </Paper>

      {alertMsg && (
        <Alert severity="warning" onClose={() => setAlertMsg('')} sx={{ mb: 2, borderRadius: 2 }}>
          {alertMsg}
        </Alert>
      )}

      {data.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">Report</Typography>
              <Chip label={`${data.length} row${data.length !== 1 ? 's' : ''}`} size="small"
                sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb' }} />
            </Box>
            <Button size="small" variant="outlined" onClick={() => exportToExcel(data)}
              startIcon={<Download size={14} />}
              sx={{
                textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 1.5,
                borderColor: '#059669', color: '#059669',
                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#059669' },
              }}>
              Export Excel
            </Button>
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
      )}
    </Box>
  );
}

export default ReferralDocReport;
