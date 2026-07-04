import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, InputLabel,
  FormControl, Chip, IconButton, Tooltip, CircularProgress,
  Grid, Alert, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Plus, Download, Eye, XCircle, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const authHdr = () => ({});

const jsonHdr = () => ({
  'Content-Type': 'application/json',
});

const TYPE_LABEL = { SICK_LEAVE: 'Sick Leave', FITNESS: 'Fitness' };

const today = () => new Date().toISOString().slice(0, 10);

/* ── small helpers ──────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusChip({ status }) {
  const color = status === 'ACTIVE' ? 'success' : 'error';
  return <Chip label={status} color={color} size="small" />;
}

function TypeChip({ type }) {
  const color = type === 'SICK_LEAVE' ? 'warning' : 'info';
  return <Chip label={TYPE_LABEL[type] || type} color={color} size="small" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MedicalCertificatePage() {
  /* List state */
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  /* Filters */
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');

  /* Patient search for create */
  const [patSearch, setPatSearch]       = useState('');
  const [patOptions, setPatOptions]     = useState([]);
  const [patLoading, setPatLoading]     = useState(false);

  /* Doctor list */
  const [doctors, setDoctors]           = useState([]);

  /* Create dialog */
  const [createOpen, setCreateOpen]     = useState(false);
  const [creating, setCreating]         = useState(false);
  const [createErr, setCreateErr]       = useState('');
  const [form, setForm]                 = useState(defaultForm());

  /* Lookup data (registrations / admissions for selected patient) */
  const [regList, setRegList]           = useState([]);
  const [admList, setAdmList]           = useState([]);

  /* Cancel dialog */
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelRow, setCancelRow]       = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]     = useState(false);

  /* PDF preview dialog */
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [previewUrl, setPreviewUrl]     = useState('');

  /* ── fetch list ────────────────────────────────────────────────────────── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (filterSearch) q.set('search',  filterSearch);
      if (filterType)   q.set('type',    filterType);
      if (filterStatus) q.set('status',  filterStatus);
      if (filterFrom)   q.set('from',    filterFrom);
      if (filterTo)     q.set('to',      filterTo);
      const r = await authFetch(`${API_BASE_URL}/api/medical-certificates?${q}`, { headers: authHdr() });
      if (!r.ok) throw new Error((await r.json()).error || 'Failed to fetch.');
      const data = await r.json();
      setRows(data.map((d, i) => ({ ...d, id: d.CERTIFICATE_ID || i })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterSearch, filterType, filterStatus, filterFrom, filterTo]);

  /* ── fetch doctors ─────────────────────────────────────────────────────── */
  useEffect(() => {
    authFetch(`${API_BASE_URL}/doctor`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  /* ── patient search (debounced) ────────────────────────────────────────── */
  useEffect(() => {
    if (!patSearch || patSearch.length < 2) { setPatOptions([]); return; }
    const t = setTimeout(async () => {
      setPatLoading(true);
      try {
        const r = await authFetch(
          `${API_BASE_URL}/fetchpat?patientName=${encodeURIComponent(patSearch)}`,
          { headers: authHdr() }
        );
        const d = await r.json();
        setPatOptions(Array.isArray(d) ? d : []);
      } catch (_) {}
      setPatLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [patSearch]);

  /* ── fetch lookup data when patient or reg selected in form ────────────── */
  useEffect(() => {
    if (!form.patientId) { setRegList([]); setAdmList([]); return; }
    authFetch(`${API_BASE_URL}/api/medical-certificates/lookup/patient/${form.patientId}/registrations`,
      { headers: authHdr() })
      .then(r => r.json()).then(d => setRegList(Array.isArray(d) ? d : [])).catch(() => {});
    authFetch(`${API_BASE_URL}/api/medical-certificates/lookup/patient/${form.patientId}/admissions`,
      { headers: authHdr() })
      .then(r => r.json()).then(d => setAdmList(Array.isArray(d) ? d : [])).catch(() => {});
  }, [form.patientId]);

  /* ── auto-calc total days ──────────────────────────────────────────────── */
  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const diff = Math.round(
        (new Date(form.toDate) - new Date(form.fromDate)) / 86400000
      ) + 1;
      setForm(f => ({ ...f, totalDays: diff > 0 ? diff : '' }));
    }
  }, [form.fromDate, form.toDate]);

  /* ── create submit ─────────────────────────────────────────────────────── */
  async function handleCreate() {
    if (!form.patientId || !form.doctorId || !form.certificateType || !form.certificateDate || !form.diagnosis) {
      setCreateErr('Patient, Doctor, Type, Date and Diagnosis are required.');
      return;
    }
    setCreating(true);
    setCreateErr('');
    try {
      const r = await authFetch(`${API_BASE_URL}/api/medical-certificates`, {
        method: 'POST',
        headers: jsonHdr(),
        body: JSON.stringify({
          patientId       : form.patientId,
          regId           : form.regId     || undefined,
          admissionId     : form.admissionId || undefined,
          doctorId        : form.doctorId,
          certificateType : form.certificateType,
          certificateDate : form.certificateDate,
          fromDate        : form.fromDate  || undefined,
          toDate          : form.toDate    || undefined,
          totalDays       : form.totalDays || undefined,
          diagnosis       : form.diagnosis,
          remarks         : form.remarks   || undefined,
          fitToJoinDate   : form.fitToJoinDate || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Create failed.');
      setCreateOpen(false);
      setForm(defaultForm());
      setPatOptions([]);
      setPatSearch('');
      fetchList();
    } catch (e) {
      setCreateErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  /* ── cancel ────────────────────────────────────────────────────────────── */
  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const r = await authFetch(
        `${API_BASE_URL}/api/medical-certificates/${cancelRow.CERTIFICATE_ID}/cancel`,
        { method: 'PUT', headers: jsonHdr(), body: JSON.stringify({ cancelReason }) }
      );
      if (!r.ok) throw new Error((await r.json()).error || 'Cancel failed.');
      setCancelOpen(false);
      setCancelRow(null);
      setCancelReason('');
      fetchList();
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  }

  /* ── PDF preview (fetch with auth, create blob URL) ───────────────────── */
  async function openPreview(id) {
    try {
      const r = await authFetch(
        `${API_BASE_URL}/api/medical-certificates/${id}/preview`,
        { headers: authHdr() }
      );
      if (!r.ok) throw new Error('Preview failed.');
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── PDF download ──────────────────────────────────────────────────────── */
  async function downloadPdf(id, certNo) {
    try {
      const r = await authFetch(
        `${API_BASE_URL}/api/medical-certificates/${id}/download`,
        { headers: authHdr() }
      );
      if (!r.ok) throw new Error('Download failed.');
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${certNo}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── columns ────────────────────────────────────────────────────────────── */
  const columns = [
    { field: 'CERTIFICATE_NO',   headerName: 'Cert. No',   width: 160 },
    { field: 'patient_name',     headerName: 'Patient',    flex: 1, minWidth: 140 },
    {
      field: 'CERTIFICATE_TYPE', headerName: 'Type', width: 120,
      renderCell: ({ value }) => <TypeChip type={value} />,
    },
    {
      field: 'CERTIFICATE_DATE', headerName: 'Date', width: 120,
      renderCell: ({ value }) => fmtDate(value),
    },
    {
      field: 'FROM_DATE', headerName: 'From', width: 110,
      renderCell: ({ value }) => fmtDate(value),
    },
    {
      field: 'TO_DATE', headerName: 'To', width: 110,
      renderCell: ({ value }) => fmtDate(value),
    },
    { field: 'TOTAL_DAYS', headerName: 'Days', width: 70, type: 'number' },
    { field: 'doctor_name',      headerName: 'Doctor',     flex: 1, minWidth: 130 },
    {
      field: 'STATUS', headerName: 'Status', width: 100,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 150, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          <Tooltip title="Preview PDF">
            <IconButton size="small" color="primary"
              onClick={() => openPreview(row.CERTIFICATE_ID)}>
              <Eye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton size="small" color="secondary"
              onClick={() => downloadPdf(row.CERTIFICATE_ID, row.CERTIFICATE_NO)}>
              <Download size={16} />
            </IconButton>
          </Tooltip>
          {row.STATUS === 'ACTIVE' && (
            <Tooltip title="Cancel">
              <IconButton size="small" color="error"
                onClick={() => { setCancelRow(row); setCancelOpen(true); }}>
                <XCircle size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Medical Certificates</Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
          New Certificate
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Search patient / cert no / diagnosis"
              size="small" fullWidth
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="SICK_LEAVE">Sick Leave</MenuItem>
                <MenuItem value="FITNESS">Fitness</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="From Date" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="To Date" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={2} md={1}>
            <Button variant="outlined" startIcon={<RefreshCw size={16} />} fullWidth onClick={fetchList}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* DataGrid */}
      <Paper sx={{ height: 480 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          density="compact"
        />
      </Paper>

      {/* ═══ CREATE DIALOG ═══════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Medical Certificate</DialogTitle>
        <DialogContent dividers>
          {createErr && <Alert severity="error" sx={{ mb: 2 }}>{createErr}</Alert>}
          <Grid container spacing={2}>

            {/* Patient search */}
            <Grid item xs={12}>
              <Autocomplete
                options={patOptions}
                loading={patLoading}
                getOptionLabel={o => `${o.name} (ID: ${o.patient_id})`}
                onInputChange={(_, v) => setPatSearch(v)}
                onChange={(_, v) => {
                  if (v) setForm(f => ({ ...f, patientId: v.patient_id, patientName: v.name }));
                  else   setForm(f => ({ ...f, patientId: '', patientName: '', regId: '', admissionId: '' }));
                }}
                renderInput={params => (
                  <TextField {...params} label="Patient *" size="small"
                    helperText="Type 2+ letters to search"
                    InputProps={{ ...params.InputProps,
                      endAdornment: (<>{patLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>)
                    }} />
                )}
              />
            </Grid>

            {/* Certificate type */}
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Certificate Type *</InputLabel>
                <Select label="Certificate Type *"
                  value={form.certificateType}
                  onChange={e => setForm(f => ({ ...f, certificateType: e.target.value }))}>
                  <MenuItem value="SICK_LEAVE">Sick Leave Certificate</MenuItem>
                  <MenuItem value="FITNESS">Fitness Certificate</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Certificate date */}
            <Grid item xs={12} sm={6}>
              <TextField label="Certificate Date *" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.certificateDate}
                onChange={e => setForm(f => ({ ...f, certificateDate: e.target.value }))} />
            </Grid>

            {/* Doctor */}
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Doctor *</InputLabel>
                <Select label="Doctor *"
                  value={form.doctorId}
                  onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                  {doctors.map(d => (
                    <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Registration (optional) */}
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth disabled={!form.patientId || !regList.length}>
                <InputLabel>Registration (optional)</InputLabel>
                <Select label="Registration (optional)"
                  value={form.regId}
                  onChange={e => {
                    const reg = regList.find(r => r.reg_id === e.target.value);
                    setForm(f => ({
                      ...f,
                      regId   : e.target.value,
                      doctorId: reg?.doc_id || f.doctorId,
                    }));
                  }}>
                  <MenuItem value="">— None —</MenuItem>
                  {regList.map(r => (
                    <MenuItem key={r.reg_id} value={r.reg_id}>
                      REG-{r.reg_id} | {fmtDate(r.reg_date)} | {r.doctor_name || '—'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Admission (optional) */}
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth disabled={!form.patientId || !admList.length}>
                <InputLabel>Admission (optional)</InputLabel>
                <Select label="Admission (optional)"
                  value={form.admissionId}
                  onChange={e => {
                    const adm = admList.find(a => a.admission_id === e.target.value);
                    setForm(f => ({
                      ...f,
                      admissionId : e.target.value,
                      fromDate    : adm?.admission_date?.slice(0, 10) || f.fromDate,
                      toDate      : adm?.discharge_date?.slice(0, 10) || f.toDate,
                      doctorId    : adm?.doc_id || f.doctorId,
                      diagnosis   : adm?.admit_reason || f.diagnosis,
                    }));
                  }}>
                  <MenuItem value="">— None —</MenuItem>
                  {admList.map(a => (
                    <MenuItem key={a.admission_id} value={a.admission_id}>
                      ADM-{a.admission_id} | {fmtDate(a.admission_date)}
                      {a.discharge_date ? ` → ${fmtDate(a.discharge_date)}` : ' (Active)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sick-leave only: from/to/total */}
            {form.certificateType === 'SICK_LEAVE' && (<>
              <Grid item xs={6} sm={4}>
                <TextField label="From Date" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.fromDate}
                  onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField label="To Date" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.toDate}
                  onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Total Days (auto)" type="number" size="small" fullWidth
                  value={form.totalDays}
                  onChange={e => setForm(f => ({ ...f, totalDays: e.target.value }))} />
              </Grid>
            </>)}

            {/* Fit to join date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label={form.certificateType === 'FITNESS' ? 'Fit to Join Date *' : 'Expected Resume Date'}
                type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.fitToJoinDate}
                onChange={e => setForm(f => ({ ...f, fitToJoinDate: e.target.value }))} />
            </Grid>

            {/* Diagnosis */}
            <Grid item xs={12}>
              <TextField label="Diagnosis *" size="small" fullWidth multiline rows={2}
                value={form.diagnosis}
                onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
            </Grid>

            {/* Remarks */}
            <Grid item xs={12}>
              <TextField label="Remarks" size="small" fullWidth multiline rows={2}
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); setCreateErr(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Generate Certificate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ CANCEL DIALOG ═══════════════════════════════════════════════════ */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Certificate</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Certificate: <strong>{cancelRow?.CERTIFICATE_NO}</strong> — {cancelRow?.patient_name}
          </Typography>
          <TextField label="Reason for cancellation *" size="small" fullWidth multiline rows={3}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="contained" color="error"
            onClick={handleCancel} disabled={cancelling || !cancelReason.trim()}>
            {cancelling ? <CircularProgress size={20} /> : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ PDF PREVIEW DIALOG ══════════════════════════════════════════════ */}
      <Dialog open={previewOpen} onClose={() => { setPreviewOpen(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Certificate Preview
          <Button size="small" onClick={() => { setPreviewOpen(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }}>Close</Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '80vh' }}>
          {previewUrl && (
            <iframe
              src={previewUrl}
              title="Certificate Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function defaultForm() {
  return {
    patientId      : '',
    patientName    : '',
    regId          : '',
    admissionId    : '',
    doctorId       : '',
    certificateType: 'SICK_LEAVE',
    certificateDate: today(),
    fromDate       : '',
    toDate         : '',
    totalDays      : '',
    fitToJoinDate  : '',
    diagnosis      : '',
    remarks        : '',
  };
}
