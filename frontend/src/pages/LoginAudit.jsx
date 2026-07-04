import React, { useState, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, Alert, Chip, InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { ClipboardCheck, Search, RotateCcw, Download, User } from 'lucide-react';
import exportToExcel from '../components/ExcelForTabularReport';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_CHIP = {
  SUCCESS: { background: '#dcfce7', color: '#16a34a' },
  FAILED:  { background: '#fee2e2', color: '#dc2626' },
};

const columns = [
  { field: 'USERNAME',       headerName: 'Username',       width: 140, filterable: true },
  { field: 'USER_ID',        headerName: 'User ID',        width: 100 },
  { field: 'LOGIN_TIME',     headerName: 'Login Time',     width: 175, sortable: true },
  { field: 'LOGOUT_TIME',    headerName: 'Logout Time',    width: 175 },
  {
    field: 'LOGIN_STATUS', headerName: 'Status', width: 110,
    renderCell: ({ value }) => {
      const s = STATUS_CHIP[value] || {};
      return (
        <Chip label={value} size="small"
          sx={{ fontSize: 11, fontWeight: 700, height: 22, backgroundColor: s.background, color: s.color }} />
      );
    },
  },
  { field: 'FAILURE_REASON', headerName: 'Failure Reason', width: 190 },
  { field: 'IP_ADDRESS',     headerName: 'IP Address',     width: 130 },
  { field: 'SESSION_ID',     headerName: 'Session ID',     width: 290 },
];

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function LoginAudit() {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const [dateFrom,     setDateFrom]     = useState(null);
  const [dateTo,       setDateTo]       = useState(null);
  const [username,     setUsername]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [appliedFilters, setAppliedFilters] = useState(null);

  const buildParams = useCallback((filters, { page, pageSize }) => {
    const p = new URLSearchParams({ page, pageSize });
    if (filters?.dateFrom) p.set('dateFrom', format(filters.dateFrom, 'yyyy-MM-dd'));
    if (filters?.dateTo)   p.set('dateTo',   format(filters.dateTo,   'yyyy-MM-dd'));
    if (filters?.username) p.set('username', filters.username);
    if (filters?.status)   p.set('status',   filters.status);
    return p;
  }, []);

  const fetchData = useCallback(async (filters, pagination) => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/api/login-audit?${buildParams(filters, pagination)}`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows.map(r => ({
          id:             r.AUDIT_ID,
          USERNAME:       r.USERNAME       || '',
          USER_ID:        r.USER_ID        || '',
          LOGIN_TIME:     fmtDate(r.LOGIN_TIME),
          LOGOUT_TIME:    fmtDate(r.LOGOUT_TIME),
          LOGIN_STATUS:   r.LOGIN_STATUS,
          FAILURE_REASON: r.FAILURE_REASON || '',
          IP_ADDRESS:     r.IP_ADDRESS     || '',
          SESSION_ID:     r.SESSION_ID     || '',
        })));
        setTotal(data.total);
      }
    } catch (err) {
      console.error('LoginAudit fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const handleSearch = () => {
    const filters = { dateFrom, dateTo, username: username.trim(), status: statusFilter };
    setAppliedFilters(filters);
    const pagination = { page: 0, pageSize: paginationModel.pageSize };
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    fetchData(filters, pagination);
  };

  const handleReset = () => {
    setDateFrom(null); setDateTo(null);
    setUsername(''); setStatusFilter('');
    setAppliedFilters(null);
    setRows([]); setTotal(0);
    setPaginationModel({ page: 0, pageSize: 25 });
  };

  const handlePaginationChange = (model) => {
    setPaginationModel(model);
    if (appliedFilters !== null) fetchData(appliedFilters, model);
  };

  const handleExport = async () => {
    if (!appliedFilters && rows.length === 0) {
      setAlertMsg('Please search first, then export the results.');
      return;
    }
    try {
      const res  = await authFetch(
        `${API_BASE_URL}/api/login-audit?${buildParams(appliedFilters, { page: 0, pageSize: 9999 })}`
      );
      const data = await res.json();
      if (!res.ok) { setAlertMsg('Export failed.'); return; }
      const exportData = data.rows.map(r => ({
        Username:       r.USERNAME       || '',
        'User ID':      r.USER_ID        || '',
        'Login Time':   fmtDate(r.LOGIN_TIME),
        'Logout Time':  fmtDate(r.LOGOUT_TIME),
        Status:         r.LOGIN_STATUS,
        'Failure Reason': r.FAILURE_REASON || '',
        'IP Address':   r.IP_ADDRESS     || '',
        'Session ID':   r.SESSION_ID     || '',
      }));
      exportToExcel(exportData, 'Login_Audit.xlsx');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const dateSx = {
    '& .react-datepicker-wrapper input': {
      border: '1px solid #e2e8f0', borderRadius: '6px',
      padding: '7px 12px', fontSize: 13, outline: 'none',
      backgroundColor: '#f8fafc', color: '#0f172a',
    },
  };

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
          <ClipboardCheck size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Login Audit</Typography>
          <Typography variant="caption" color="text.secondary">Track login activity and session history</Typography>
        </Box>
      </Box>

      {/* Filter bar */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10, mb: 1.5, display: 'block' }}>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Date From */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
              From
            </Typography>
            <Box sx={dateSx}>
              <DatePicker
                selected={dateFrom} onChange={setDateFrom}
                selectsStart startDate={dateFrom} endDate={dateTo}
                maxDate={dateTo || new Date()}
                dateFormat="dd-MM-yyyy" placeholderText="Start date" isClearable
              />
            </Box>
          </Box>

          {/* Date To */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
              To
            </Typography>
            <Box sx={dateSx}>
              <DatePicker
                selected={dateTo} onChange={setDateTo}
                selectsEnd startDate={dateFrom} endDate={dateTo}
                minDate={dateFrom} maxDate={new Date()}
                dateFormat="dd-MM-yyyy" placeholderText="End date" isClearable
              />
            </Box>
          </Box>

          {/* Username */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
              Username
            </Typography>
            <TextField
              size="small" placeholder="Search username…"
              value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><User size={14} color="#94a3b8" /></InputAdornment>,
              }}
              sx={{
                width: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5, backgroundColor: '#f8fafc',
                  '&:hover fieldset': { borderColor: '#2563eb' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
              }}
            />
          </Box>

          {/* Status */}
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary"
              sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
              Status
            </Typography>
            <FormControl size="small">
              <Select
                value={statusFilter} displayEmpty onChange={e => setStatusFilter(e.target.value)}
                sx={{
                  width: 140, borderRadius: 1.5, backgroundColor: '#f8fafc', fontSize: 13,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Button
              variant="contained" onClick={handleSearch}
              startIcon={<Search size={15} />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5,
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined" onClick={handleReset}
              startIcon={<RotateCcw size={15} />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2 }}
            >
              Reset
            </Button>
            <Button
              variant="outlined" onClick={handleExport}
              startIcon={<Download size={15} />}
              sx={{
                textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2,
                borderColor: '#059669', color: '#059669',
                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#059669' },
              }}
            >
              Export
            </Button>
          </Box>

          {total > 0 && (
            <Chip label={`${total.toLocaleString()} record${total !== 1 ? 's' : ''}`} size="small"
              sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb', ml: 'auto', alignSelf: 'flex-end' }} />
          )}
        </Box>
      </Paper>

      {alertMsg && (
        <Alert severity="warning" onClose={() => setAlertMsg('')} sx={{ mb: 2, borderRadius: 2 }}>
          {alertMsg}
        </Alert>
      )}

      {/* Grid / empty state */}
      {appliedFilters !== null ? (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
          }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">Results</Typography>
          </Box>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={rows} columns={columns}
              rowCount={total} loading={loading}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              sortingMode="client" filterMode="client"
              disableRowSelectionOnClick
              initialState={{ sorting: { sortModel: [{ field: 'LOGIN_TIME', sort: 'desc' }] } }}
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
      ) : (
        <Paper elevation={0} sx={{ p: 5, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
          <ClipboardCheck size={36} color="#cbd5e1" />
          <Typography variant="body2" color="text.secondary" mt={1.5}>
            Use the filters above and click <strong>Search</strong> to load audit records.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default LoginAudit;
