import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, InputLabel,
  FormControl, Chip, IconButton, Tooltip, CircularProgress,
  Grid, Alert, Autocomplete, Card, CardContent, Divider, Tabs, Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Plus, RefreshCw, Printer, Users, Clock, CheckCircle,
  PhoneCall, UserCheck, XCircle, SkipForward, MonitorPlay,
  Activity, ChevronRight,
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const authHdr = () => ({});
const jsonHdr = () => ({ 'Content-Type': 'application/json' });
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  WAITING    : '#f59e0b',
  CALLED     : '#3b82f6',
  WITH_DOCTOR: '#8b5cf6',
  COMPLETED  : '#10b981',
  SKIPPED    : '#6b7280',
  CANCELLED  : '#ef4444',
  NO_SHOW    : '#dc2626',
};

function StatusChip({ status }) {
  return (
    <Chip
      label={status?.replace('_', ' ')}
      size="small"
      sx={{ bgcolor: STATUS_COLORS[status] + '22', color: STATUS_COLORS[status], fontWeight: 600, fontSize: 11 }}
    />
  );
}

function SummaryCard({ label, value, color, Icon }) {
  return (
    <Card sx={{ flex: 1, minWidth: 130 }}>
      <CardContent sx={{ p: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Icon size={18} color={color} />
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} color={color}>{value ?? '—'}</Typography>
      </CardContent>
    </Card>
  );
}

// ─── TabPanel helper ───────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function QueueManagement() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Queue & Token Management</Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Token Generation" />
          <Tab label="Live Queue" />
          <Tab label="Doctor Queue" />
          <Tab label="Public Display" />
          <Tab label="Reports" />
          <Tab label="Counters" />
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0}><TokenGeneration /></TabPanel>
      <TabPanel value={tab} index={1}><LiveQueue /></TabPanel>
      <TabPanel value={tab} index={2}><DoctorQueue /></TabPanel>
      <TabPanel value={tab} index={3}><PublicDisplay /></TabPanel>
      <TabPanel value={tab} index={4}><Reports /></TabPanel>
      <TabPanel value={tab} index={5}><CounterManagement /></TabPanel>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TOKEN GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
function TokenGeneration() {
  const [counters, setCounters]   = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [patSearch, setPatSearch] = useState('');
  const [patOptions, setPatOptions] = useState([]);
  const [patLoading, setPatLoading] = useState(false);
  const [regs, setRegs]           = useState([]);

  const [form, setForm] = useState({
    patientId: '', patientName: '', regId: '', counterId: '', doctorId: '', appointmentId: '',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/queue/counters`, { headers: authHdr() })
      .then(r => r.json()).then(d => setCounters(Array.isArray(d) ? d.filter(c => c.STATUS === 'ACTIVE') : []))
      .catch(() => {});
    authFetch(`${API_BASE_URL}/doctor`, { headers: authHdr() })
      .then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Patient search debounce
  useEffect(() => {
    if (patSearch.length < 2) { setPatOptions([]); return; }
    const t = setTimeout(async () => {
      setPatLoading(true);
      try {
        const r = await authFetch(`${API_BASE_URL}/fetchpat?patientName=${encodeURIComponent(patSearch)}`);
        const d = await r.json();
        setPatOptions(Array.isArray(d) ? d : []);
      } catch (_) {}
      setPatLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [patSearch]);

  // Load registrations when patient chosen
  useEffect(() => {
    if (!form.patientId) { setRegs([]); return; }
    authFetch(`${API_BASE_URL}/api/medical-certificates/lookup/patient/${form.patientId}/registrations`, { headers: authHdr() })
      .then(r => r.json()).then(d => setRegs(Array.isArray(d) ? d : [])).catch(() => {});
  }, [form.patientId]);

  async function generate() {
    if (!form.patientId || !form.regId || !form.counterId || !form.doctorId) {
      setError('Patient, Registration, Counter and Doctor are required.'); return;
    }
    setGenerating(true); setError(''); setResult(null);
    try {
      const r = await authFetch(`${API_BASE_URL}/api/queue/token`, {
        method: 'POST', headers: jsonHdr(),
        body: JSON.stringify({
          patientId: form.patientId, regId: form.regId,
          counterId: form.counterId, doctorId: form.doctorId,
          appointmentId: form.appointmentId || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (r.status === 409) { setResult({ ...d.token, existing: true, patientName: form.patientName }); }
        else throw new Error(d.error || 'Token generation failed.');
        return;
      }
      setResult({ ...d, patientName: form.patientName, doctorName: doctors.find(x => x.doc_id === Number(form.doctorId))?.name });
      setForm({ patientId: '', patientName: '', regId: '', counterId: form.counterId, doctorId: form.doctorId, appointmentId: '' });
      setPatSearch(''); setPatOptions([]);
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  }

  function printToken() {
    const w = window.open('', '_blank', 'width=400,height=500');
    w.document.write(`<html><head><title>Token</title>
      <style>body{font-family:Arial;text-align:center;padding:20px}
      .token{font-size:72px;font-weight:bold;color:#1a3a6c;border:4px solid #1a3a6c;
             display:inline-block;padding:10px 30px;margin:20px 0;border-radius:8px}
      h2{color:#1a3a6c;margin:0}.info{font-size:14px;color:#555;margin:4px 0}</style>
      </head><body>
      <h2>QUEUE TOKEN</h2><hr/>
      <div class="token">${result?.tokenNo || result?.TOKEN_NO}</div>
      <p class="info">Patient: <b>${result?.patientName}</b></p>
      <p class="info">Doctor: <b>${result?.doctorName || '—'}</b></p>
      <p class="info">Est. Wait: <b>${result?.estWaitMin ?? result?.EST_WAIT_MIN ?? '—'} min</b></p>
      <p class="info">Date: ${new Date().toLocaleDateString('en-IN')}</p>
      <hr/><p style="font-size:11px;color:#999">Please wait until your token is called</p>
      </body></html>`);
    w.document.close(); w.print();
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Generate Token</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Autocomplete
            options={patOptions}
            loading={patLoading}
            getOptionLabel={o => `${o.name} (ID: ${o.patient_id})`}
            onInputChange={(_, v) => setPatSearch(v)}
            onChange={(_, v) => {
              setForm(f => ({ ...f, patientId: v?.patient_id || '', patientName: v?.name || '', regId: '' }));
            }}
            renderInput={p => (
              <TextField {...p} label="Search Patient *" size="small" fullWidth sx={{ mb: 2 }}
                helperText="Type 2+ letters"
                InputProps={{ ...p.InputProps, endAdornment: <>{patLoading && <CircularProgress size={16} />}{p.InputProps.endAdornment}</> }} />
            )}
          />

          <FormControl size="small" fullWidth sx={{ mb: 2 }} disabled={!regs.length}>
            <InputLabel>Registration *</InputLabel>
            <Select label="Registration *" value={form.regId} onChange={e => setForm(f => ({ ...f, regId: e.target.value }))}>
              {regs.map(r => <MenuItem key={r.reg_id} value={r.reg_id}>REG-{r.reg_id} | {new Date(r.reg_date).toLocaleDateString('en-IN')} | {r.doctor_name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Counter *</InputLabel>
            <Select label="Counter *" value={form.counterId} onChange={e => {
              const selected = counters.find(c => c.COUNTER_ID === e.target.value);
              setForm(f => ({ ...f, counterId: e.target.value, doctorId: selected?.DOCTOR_ID ? String(selected.DOCTOR_ID) : f.doctorId }));
            }}>
              {counters.map(c => <MenuItem key={c.COUNTER_ID} value={c.COUNTER_ID}>{c.COUNTER_NAME} ({c.TOKEN_PREFIX})</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth sx={{ mb: 3 }}>
            <InputLabel>Doctor *</InputLabel>
            <Select label="Doctor *" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
              {doctors.map(d => <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Button variant="contained" fullWidth size="large" startIcon={<Plus size={18} />}
            onClick={generate} disabled={generating}>
            {generating ? <CircularProgress size={22} /> : 'Generate Token'}
          </Button>
        </Paper>
      </Grid>

      {result && (
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', border: `2px solid ${result.existing ? '#f59e0b' : '#10b981'}`, borderRadius: 2 }}>
            {result.existing && <Alert severity="warning" sx={{ mb: 2 }}>Patient already has an active token today.</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Queue Token</Typography>
            <Typography variant="h2" fontWeight={800} color="primary" sx={{ letterSpacing: 4, mb: 1 }}>
              {result.tokenNo || result.TOKEN_NO}
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}><b>{result.patientName}</b></Typography>
            {result.doctorName && <Typography variant="body2" color="text.secondary">Dr. {result.doctorName}</Typography>}
            <Chip label={`Est. Wait: ${result.estWaitMin ?? result.EST_WAIT_MIN ?? '—'} min`}
              sx={{ mt: 1, mb: 2, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
            <br />
            <Button variant="outlined" startIcon={<Printer size={16} />} onClick={printToken}>
              Print Token
            </Button>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LIVE QUEUE
// ═══════════════════════════════════════════════════════════════════════════════
function LiveQueue() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [counters, setCounters] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [filterCounter, setFilterCounter] = useState('');
  const [filterDoctor, setFilterDoctor]   = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterDate, setFilterDate]       = useState(today());

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/queue/counters`, { headers: authHdr() })
      .then(r => r.json()).then(d => setCounters(Array.isArray(d) ? d : [])).catch(() => {});
    authFetch(`${API_BASE_URL}/doctor`, { headers: authHdr() })
      .then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date: filterDate });
      if (filterCounter) q.set('counterId', filterCounter);
      if (filterDoctor)  q.set('doctorId',  filterDoctor);
      if (filterStatus)  q.set('status',    filterStatus);
      const r = await authFetch(`${API_BASE_URL}/api/queue/live?${q}`, { headers: authHdr() });
      const d = await r.json();
      setRows(Array.isArray(d) ? d.map(x => ({ ...x, id: x.QUEUE_ID })) : []);
    } catch (_) {}
    setLoading(false);
  }, [filterCounter, filterDoctor, filterStatus, filterDate]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const t = setInterval(fetchQueue, 15000);
    return () => clearInterval(t);
  }, [fetchQueue]);

  async function updateStatus(queueId, status) {
    await authFetch(`${API_BASE_URL}/api/queue/${queueId}/status`, {
      method: 'PUT', headers: jsonHdr(), body: JSON.stringify({ status }),
    });
    fetchQueue();
  }

  const columns = [
    { field: 'TOKEN_NO',     headerName: 'Token',   width: 100, renderCell: ({ value }) => <b style={{ color: '#1a3a6c' }}>{value}</b> },
    { field: 'patient_name', headerName: 'Patient', flex: 1, minWidth: 130 },
    { field: 'doctor_name',  headerName: 'Doctor',  flex: 1, minWidth: 130 },
    { field: 'specialization', headerName: 'Dept',  width: 130 },
    { field: 'QUEUE_STATUS', headerName: 'Status',  width: 130, renderCell: ({ value }) => <StatusChip status={value} /> },
    { field: 'EST_WAIT_MIN', headerName: 'Est. Wait', width: 100, renderCell: ({ value }) => value != null ? `${value} min` : '—' },
    { field: 'GENERATED_TIME', headerName: 'Generated', width: 130, renderCell: ({ value }) => value ? new Date(value).toLocaleTimeString('en-IN') : '—' },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {row.QUEUE_STATUS === 'WAITING' && <>
            <Tooltip title="Call">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'CALLED')} sx={{ color: '#3b82f6' }}><PhoneCall size={15} /></IconButton>
            </Tooltip>
            <Tooltip title="Skip">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'SKIPPED')} sx={{ color: '#6b7280' }}><SkipForward size={15} /></IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'CANCELLED')} sx={{ color: '#ef4444' }}><XCircle size={15} /></IconButton>
            </Tooltip>
          </>}
          {row.QUEUE_STATUS === 'SKIPPED' && (
            <Tooltip title="Recall">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'WAITING')} sx={{ color: '#f59e0b' }}><PhoneCall size={15} /></IconButton>
            </Tooltip>
          )}
          {row.QUEUE_STATUS === 'CALLED' && <>
            <Tooltip title="Start Consultation">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'WITH_DOCTOR')} sx={{ color: '#8b5cf6' }}><UserCheck size={15} /></IconButton>
            </Tooltip>
            <Tooltip title="No Show">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'NO_SHOW')} sx={{ color: '#dc2626' }}><XCircle size={15} /></IconButton>
            </Tooltip>
          </>}
          {row.QUEUE_STATUS === 'WITH_DOCTOR' && (
            <Tooltip title="Complete">
              <IconButton size="small" onClick={() => updateStatus(row.QUEUE_ID, 'COMPLETED')} sx={{ color: '#10b981' }}><CheckCircle size={15} /></IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
              value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Counter</InputLabel>
              <Select label="Counter" value={filterCounter} onChange={e => setFilterCounter(e.target.value)}>
                <MenuItem value="">All Counters</MenuItem>
                {counters.map(c => <MenuItem key={c.COUNTER_ID} value={c.COUNTER_ID}>{c.COUNTER_NAME}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select label="Doctor" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map(d => <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {['WAITING','CALLED','WITH_DOCTOR','COMPLETED','SKIPPED','CANCELLED','NO_SHOW'].map(s =>
                  <MenuItem key={s} value={s}>{s.replace('_',' ')}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={16} />} fullWidth onClick={fetchQueue}>Refresh</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} loading={loading}
          disableRowSelectionOnClick density="compact"
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Paper>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DOCTOR QUEUE (Doctor-facing control panel)
// ═══════════════════════════════════════════════════════════════════════════════
function DoctorQueue() {
  const [doctors, setDoctors]   = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [qData, setQData]       = useState({ current: null, next: null, waiting: [], completed_count: 0, total_count: 0 });
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/doctor`, { headers: authHdr() })
      .then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchDoctorQueue = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE_URL}/api/queue/doctor/${doctorId}/today`, { headers: authHdr() });
      setQData(await r.json());
    } catch (_) {}
    setLoading(false);
  }, [doctorId]);

  useEffect(() => { fetchDoctorQueue(); }, [fetchDoctorQueue]);
  useEffect(() => {
    const t = setInterval(fetchDoctorQueue, 10000);
    return () => clearInterval(t);
  }, [fetchDoctorQueue]);

  async function action(queueId, status) {
    await authFetch(`${API_BASE_URL}/api/queue/${queueId}/status`, {
      method: 'PUT', headers: jsonHdr(), body: JSON.stringify({ status }),
    });
    fetchDoctorQueue();
  }

  const { current, next, waiting, completed_count, total_count } = qData;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Select Doctor</InputLabel>
              <Select label="Select Doctor" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                {doctors.map(d => <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={15} />} onClick={fetchDoctorQueue} disabled={!doctorId}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {doctorId && (
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <SummaryCard label="Total Today" value={total_count} color="#1a3a6c" Icon={Users} />
              <SummaryCard label="Waiting" value={waiting.length} color="#f59e0b" Icon={Clock} />
              <SummaryCard label="Completed" value={completed_count} color="#10b981" Icon={CheckCircle} />
            </Box>
          </Grid>

          {/* Current Patient */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderLeft: '4px solid #8b5cf6', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#8b5cf6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserCheck size={18} /> Current Patient
              </Typography>
              {loading && !current ? <CircularProgress size={24} /> : current ? (
                <>
                  <Typography variant="h4" fontWeight={800} color="#1a3a6c">{current.TOKEN_NO}</Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>{current.patient_name}</Typography>
                  <StatusChip status={current.QUEUE_STATUS} />
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {current.QUEUE_STATUS === 'CALLED' && (
                      <Button variant="contained" size="small" color="secondary"
                        startIcon={<UserCheck size={15} />}
                        onClick={() => action(current.QUEUE_ID, 'WITH_DOCTOR')}>
                        Start Consultation
                      </Button>
                    )}
                    {current.QUEUE_STATUS === 'WITH_DOCTOR' && (
                      <Button variant="contained" size="small" color="success"
                        startIcon={<CheckCircle size={15} />}
                        onClick={() => action(current.QUEUE_ID, 'COMPLETED')}>
                        Complete
                      </Button>
                    )}
                    {(current.QUEUE_STATUS === 'CALLED' || current.QUEUE_STATUS === 'WITH_DOCTOR') && (
                      <Button variant="outlined" size="small" color="warning"
                        startIcon={<SkipForward size={15} />}
                        onClick={() => action(current.QUEUE_ID, 'SKIPPED')}>
                        Skip
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">No patient currently in consultation.</Typography>
              )}
            </Paper>
          </Grid>

          {/* Next + Call Next */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderLeft: '4px solid #3b82f6', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#3b82f6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChevronRight size={18} /> Next in Queue
              </Typography>
              {next ? (
                <>
                  <Typography variant="h4" fontWeight={800} color="#1a3a6c">{next.TOKEN_NO}</Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>{next.patient_name}</Typography>
                  <StatusChip status={next.QUEUE_STATUS} />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" size="small" startIcon={<PhoneCall size={15} />}
                      onClick={() => action(next.QUEUE_ID, 'CALLED')}>
                      Call Patient
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">No patients waiting.</Typography>
              )}
            </Paper>
          </Grid>

          {/* Waiting List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={16} /> Waiting Patients ({waiting.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {waiting.length === 0 ? (
                <Typography color="text.secondary">Queue is empty.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {waiting.map((w, i) => (
                    <Box key={w.QUEUE_ID} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                      borderRadius: 1, bgcolor: i === 0 ? '#eff6ff' : '#f9fafb' }}>
                      <Typography fontWeight={700} color="#1a3a6c" sx={{ minWidth: 60 }}>{w.TOKEN_NO}</Typography>
                      <Typography sx={{ flex: 1 }}>{w.patient_name}</Typography>
                      <Typography variant="caption" color="text.secondary">Est. {w.EST_WAIT_MIN ?? '—'} min</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Call"><IconButton size="small" onClick={() => action(w.QUEUE_ID, 'CALLED')}><PhoneCall size={14} /></IconButton></Tooltip>
                        <Tooltip title="Skip"><IconButton size="small" onClick={() => action(w.QUEUE_ID, 'SKIPPED')}><SkipForward size={14} /></IconButton></Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PUBLIC DISPLAY BOARD
// ═══════════════════════════════════════════════════════════════════════════════
function PublicDisplay() {
  const [counters, setCounters]   = useState([]);
  const [counterId, setCounterId] = useState('');
  const [display, setDisplay]     = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/queue/counters`, { headers: authHdr() })
      .then(r => r.json()).then(d => setCounters(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchDisplay = useCallback(async () => {
    if (!counterId) return;
    try {
      const r = await authFetch(`${API_BASE_URL}/api/queue/display/${counterId}`);
      setDisplay(await r.json());
    } catch (_) {}
  }, [counterId]);

  useEffect(() => { fetchDisplay(); }, [fetchDisplay]);
  useEffect(() => {
    const t = setInterval(fetchDisplay, 8000);
    return () => clearInterval(t);
  }, [fetchDisplay]);

  const board = (
    <Box sx={{
      bgcolor: '#0f172a', color: '#fff', minHeight: fullscreen ? '100vh' : 480,
      p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: fullscreen ? 0 : 2,
    }}>
      <Typography variant="h4" fontWeight={800} sx={{ color: '#60a5fa', mb: 0.5, letterSpacing: 2 }}>
        {display?.counter?.COUNTER_NAME || '—'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4, letterSpacing: 1 }}>QUEUE DISPLAY</Typography>

      <Typography variant="overline" sx={{ color: '#64748b', letterSpacing: 3 }}>NOW SERVING</Typography>
      <Box sx={{
        bgcolor: '#1e40af', borderRadius: 3, px: 6, py: 3, mt: 1, mb: 4,
        boxShadow: '0 0 40px rgba(59,130,246,0.4)',
        textAlign: 'center',
      }}>
        <Typography variant="h1" fontWeight={900} sx={{ fontSize: { xs: 80, md: 120 }, lineHeight: 1, color: '#fff', letterSpacing: 6 }}>
          {display?.current?.TOKEN_NO || '—'}
        </Typography>
        {display?.current?.patient_name && (
          <Typography variant="h6" sx={{ color: '#bfdbfe', mt: 1 }}>{display.current.patient_name}</Typography>
        )}
      </Box>

      <Typography variant="overline" sx={{ color: '#64748b', letterSpacing: 3, mb: 2 }}>NEXT</Typography>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {display?.next?.length > 0 ? display.next.map(n => (
          <Box key={n.QUEUE_ID} sx={{
            bgcolor: '#1e293b', borderRadius: 2, px: 4, py: 2, textAlign: 'center',
            border: '1px solid #334155',
          }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#e2e8f0' }}>{n.TOKEN_NO}</Typography>
          </Box>
        )) : (
          <Typography sx={{ color: '#475569' }}>No patients waiting</Typography>
        )}
      </Box>

      <Typography variant="caption" sx={{ color: '#475569', mt: 6 }}>
        Auto-refreshes every 8 seconds — {new Date().toLocaleTimeString('en-IN')}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Select Counter</InputLabel>
              <Select label="Select Counter" value={counterId} onChange={e => setCounterId(e.target.value)}>
                {counters.map(c => <MenuItem key={c.COUNTER_ID} value={c.COUNTER_ID}>{c.COUNTER_NAME}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <Button variant="outlined" size="small" startIcon={<MonitorPlay size={15} />}
              onClick={() => setFullscreen(true)} disabled={!counterId}>
              Fullscreen Mode
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {counterId && board}

      <Dialog open={fullscreen} fullScreen onClose={() => setFullscreen(false)}>
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <Button variant="contained" size="small" color="error" onClick={() => setFullscreen(false)}>Exit</Button>
        </Box>
        {board}
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
function Reports() {
  const [reportTab, setReportTab] = useState(0);
  const [dash, setDash]   = useState(null);
  const [daily, setDaily] = useState([]);
  const [dw, setDw]       = useState([]);
  const [wt, setWt]       = useState([]);
  const [date, setDate]   = useState(today());
  const [from, setFrom]   = useState(today());
  const [to, setTo]       = useState(today());
  const [loading, setLoading] = useState(false);

  const loadDash = useCallback(async () => {
    const r = await authFetch(`${API_BASE_URL}/api/queue/reports/dashboard`, { headers: authHdr() });
    setDash(await r.json());
  }, []);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    const r = await authFetch(`${API_BASE_URL}/api/queue/reports/daily?date=${date}`, { headers: authHdr() });
    const d = await r.json(); setDaily(Array.isArray(d) ? d.map((x, i) => ({ ...x, id: x.QUEUE_ID || i })) : []);
    setLoading(false);
  }, [date]);

  const loadDw = useCallback(async () => {
    setLoading(true);
    const r = await authFetch(`${API_BASE_URL}/api/queue/reports/doctor-wise?from=${from}&to=${to}`, { headers: authHdr() });
    const d = await r.json(); setDw(Array.isArray(d) ? d.map((x, i) => ({ ...x, id: x.doc_id || i })) : []);
    setLoading(false);
  }, [from, to]);

  const loadWt = useCallback(async () => {
    setLoading(true);
    const r = await authFetch(`${API_BASE_URL}/api/queue/reports/waiting-time?date=${date}`, { headers: authHdr() });
    const d = await r.json(); setWt(Array.isArray(d) ? d.map((x, i) => ({ ...x, id: i })) : []);
    setLoading(false);
  }, [date]);

  useEffect(() => { loadDash(); }, [loadDash]);
  useEffect(() => { if (reportTab === 1) loadDaily(); }, [reportTab, loadDaily]);
  useEffect(() => { if (reportTab === 2) loadDw(); }, [reportTab, loadDw]);
  useEffect(() => { if (reportTab === 3) loadWt(); }, [reportTab, loadWt]);

  const dailyCols = [
    { field: 'TOKEN_NO', headerName: 'Token', width: 90 },
    { field: 'patient_name', headerName: 'Patient', flex: 1, minWidth: 130 },
    { field: 'doctor_name', headerName: 'Doctor', flex: 1, minWidth: 130 },
    { field: 'QUEUE_STATUS', headerName: 'Status', width: 120, renderCell: ({ value }) => <StatusChip status={value} /> },
    { field: 'GENERATED_TIME', headerName: 'Generated', width: 130, renderCell: ({ value }) => value ? new Date(value).toLocaleTimeString('en-IN') : '—' },
    { field: 'END_TIME', headerName: 'Completed', width: 130, renderCell: ({ value }) => value ? new Date(value).toLocaleTimeString('en-IN') : '—' },
    { field: 'wait_min', headerName: 'Wait (min)', width: 100 },
    { field: 'consult_min', headerName: 'Consult (min)', width: 120 },
  ];

  const dwCols = [
    { field: 'doctor_name', headerName: 'Doctor', flex: 1, minWidth: 140 },
    { field: 'specialization', headerName: 'Department', flex: 1, minWidth: 130 },
    { field: 'total', headerName: 'Total', width: 80, type: 'number' },
    { field: 'completed', headerName: 'Completed', width: 100, type: 'number' },
    { field: 'skipped', headerName: 'Skipped', width: 90, type: 'number' },
    { field: 'no_show', headerName: 'No Show', width: 90, type: 'number' },
    { field: 'avg_consult_min', headerName: 'Avg Consult (min)', width: 150 },
  ];

  const wtCols = [
    { field: 'TOKEN_NO', headerName: 'Token', width: 90 },
    { field: 'patient_name', headerName: 'Patient', flex: 1, minWidth: 130 },
    { field: 'doctor_name', headerName: 'Doctor', flex: 1, minWidth: 130 },
    { field: 'wait_min', headerName: 'Wait (min)', width: 110, type: 'number' },
    { field: 'consult_min', headerName: 'Consult (min)', width: 120, type: 'number' },
  ];

  return (
    <Box>
      <Tabs value={reportTab} onChange={(_, v) => setReportTab(v)} sx={{ mb: 2 }}>
        <Tab label="Dashboard" />
        <Tab label="Daily Token Report" />
        <Tab label="Doctor-wise Report" />
        <Tab label="Waiting Time Report" />
      </Tabs>

      {/* Dashboard */}
      {reportTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={15} />} onClick={loadDash}>Refresh</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <SummaryCard label="Generated Today" value={dash?.total_generated} color="#1a3a6c" Icon={Activity} />
            <SummaryCard label="Waiting" value={dash?.waiting} color="#f59e0b" Icon={Clock} />
            <SummaryCard label="With Doctor" value={dash?.with_doctor} color="#8b5cf6" Icon={UserCheck} />
            <SummaryCard label="Completed" value={dash?.completed} color="#10b981" Icon={CheckCircle} />
            <SummaryCard label="Avg Wait (min)" value={dash?.avg_wait_min} color="#3b82f6" Icon={Clock} />
            <SummaryCard label="Avg Consult (min)" value={dash?.avg_consult_min} color="#ec4899" Icon={Activity} />
          </Box>
        </Box>
      )}

      {/* Daily */}
      {reportTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={date} onChange={e => setDate(e.target.value)} />
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={15} />} onClick={loadDaily}>Load</Button>
          </Box>
          <Paper sx={{ height: 450 }}>
            <DataGrid rows={daily} columns={dailyCols} loading={loading} density="compact"
              pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
          </Paper>
        </Box>
      )}

      {/* Doctor-wise */}
      {reportTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
            <TextField label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={15} />} onClick={loadDw}>Load</Button>
          </Box>
          <Paper sx={{ height: 450 }}>
            <DataGrid rows={dw} columns={dwCols} loading={loading} density="compact"
              pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
          </Paper>
        </Box>
      )}

      {/* Waiting Time */}
      {reportTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={date} onChange={e => setDate(e.target.value)} />
            <Button variant="outlined" size="small" startIcon={<RefreshCw size={15} />} onClick={loadWt}>Load</Button>
          </Box>
          <Paper sx={{ height: 450 }}>
            <DataGrid rows={wt} columns={wtCols} loading={loading} density="compact"
              pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
          </Paper>
        </Box>
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. COUNTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
function CounterManagement() {
  const [rows, setRows]       = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');
  const [form, setForm] = useState({ counterCode: '', counterName: '', tokenPrefix: '', avgConsultTimeMin: 10, doctorId: '', status: 'ACTIVE' });

  useEffect(() => {
    authFetch(`${API_BASE_URL}/doctor`, { headers: authHdr() })
      .then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchCounters = useCallback(async () => {
    setLoading(true);
    const r = await authFetch(`${API_BASE_URL}/api/queue/counters`, { headers: authHdr() });
    const d = await r.json();
    setRows(Array.isArray(d) ? d.map(x => ({ ...x, id: x.COUNTER_ID })) : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCounters(); }, [fetchCounters]);

  function openCreate() {
    setEditing(null);
    setForm({ counterCode: '', counterName: '', tokenPrefix: '', avgConsultTimeMin: 10, doctorId: '', status: 'ACTIVE' });
    setErr(''); setDialogOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    setForm({ counterCode: row.COUNTER_CODE, counterName: row.COUNTER_NAME, tokenPrefix: row.TOKEN_PREFIX,
      avgConsultTimeMin: row.AVG_CONSULT_TIME_MIN, doctorId: row.DOCTOR_ID || '', status: row.STATUS });
    setErr(''); setDialogOpen(true);
  }

  async function save() {
    if (!form.counterCode || !form.counterName || !form.tokenPrefix) {
      setErr('Code, Name, Prefix required.'); return;
    }
    setSaving(true); setErr('');
    try {
      const url    = editing ? `${API_BASE_URL}/api/queue/counters/${editing.COUNTER_ID}` : `${API_BASE_URL}/api/queue/counters`;
      const method = editing ? 'PUT' : 'POST';
      const r = await authFetch(url, { method, headers: jsonHdr(), body: JSON.stringify({ ...form, avgConsultTimeMin: Number(form.avgConsultTimeMin) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed.');
      setDialogOpen(false); fetchCounters();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  }

  const columns = [
    { field: 'COUNTER_CODE', headerName: 'Code', width: 100 },
    { field: 'COUNTER_NAME', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'TOKEN_PREFIX', headerName: 'Prefix', width: 80 },
    { field: 'doctor_name', headerName: 'Doctor', flex: 1, minWidth: 140 },
    { field: 'AVG_CONSULT_TIME_MIN', headerName: 'Avg (min)', width: 100 },
    { field: 'STATUS', headerName: 'Status', width: 90, renderCell: ({ value }) => <Chip label={value} size="small" color={value === 'ACTIVE' ? 'success' : 'default'} /> },
    { field: 'actions', headerName: 'Actions', width: 80, sortable: false,
      renderCell: ({ row }) => <Button size="small" onClick={() => openEdit(row)}>Edit</Button> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}>Add Counter</Button>
      </Box>
      <Paper sx={{ height: 450 }}>
        <DataGrid rows={rows} columns={columns} loading={loading} density="compact"
          pageSizeOptions={[25]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Counter' : 'New Counter'}</DialogTitle>
        <DialogContent dividers>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Counter Code *" size="small" fullWidth value={form.counterCode}
                disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, counterCode: e.target.value.toUpperCase() }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Token Prefix *" size="small" fullWidth value={form.tokenPrefix}
                onChange={e => setForm(f => ({ ...f, tokenPrefix: e.target.value.toUpperCase() }))}
                helperText="e.g. C, O, CARD" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Counter Name *" size="small" fullWidth value={form.counterName}
                onChange={e => setForm(f => ({ ...f, counterName: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Doctor (optional)</InputLabel>
                <Select label="Doctor (optional)" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                  <MenuItem value="">— None —</MenuItem>
                  {doctors.map(d => <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField label="Avg Consult (min)" type="number" size="small" fullWidth value={form.avgConsultTimeMin}
                onChange={e => setForm(f => ({ ...f, avgConsultTimeMin: e.target.value }))} />
            </Grid>
            {editing && (
              <Grid item xs={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
