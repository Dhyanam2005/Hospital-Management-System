import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Button, Chip, CircularProgress, FormControl, InputLabel,
  MenuItem, Select, TextField, Typography, IconButton, Tooltip,
  Checkbox, ListItemText, OutlinedInput,
} from '@mui/material';
import {
  UserPlus, Calendar, Building2, DoorOpen, Stethoscope, FlaskConical,
  Pill, Package, Zap, CreditCard, FileText, ChevronDown, ChevronUp,
  Search, Printer, FileSpreadsheet, Filter, X, ClipboardList,
} from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import exportToExcel from '../components/ExcelForTabularReport';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

/* ── Event type config ─────────────────────────────────────────────────────── */
const EC = {
  REGISTRATION: { label: 'Registration',  color: '#22c55e', bg: '#f0fdf4', Icon: UserPlus      },
  APPOINTMENT:  { label: 'Appointment',   color: '#3b82f6', bg: '#eff6ff', Icon: Calendar      },
  ADMISSION:    { label: 'Admission',     color: '#a855f7', bg: '#faf5ff', Icon: Building2     },
  DISCHARGE:    { label: 'Discharge',     color: '#06b6d4', bg: '#ecfeff', Icon: DoorOpen      },
  CONSULTATION: { label: 'Consultation',  color: '#f59e0b', bg: '#fffbeb', Icon: Stethoscope   },
  LAB_TEST:     { label: 'Lab Test',      color: '#f97316', bg: '#fff7ed', Icon: FlaskConical  },
  PRESCRIPTION: { label: 'Prescription',  color: '#ec4899', bg: '#fdf2f8', Icon: Pill          },
  PHARMACY:     { label: 'Pharmacy',      color: '#8b5cf6', bg: '#f5f3ff', Icon: Package       },
  SERVICE:      { label: 'Service',       color: '#14b8a6', bg: '#f0fdfa', Icon: Zap           },
  PAYMENT:      { label: 'Payment',       color: '#10b981', bg: '#ecfdf5', Icon: CreditCard    },
  DOCUMENT:     { label: 'Document',      color: '#6366f1', bg: '#eef2ff', Icon: FileText      },
};
const ALL_TYPES = Object.keys(EC);

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const authHdr = () => ({ 'Content-Type': 'application/json' });

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}
function fmtAge(dob) {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
}

/* ── Summary card ───────────────────────────────────────────────────────────── */
function SCard({ label, value, sub, color = '#3b82f6' }) {
  return (
    <div style={{
      minWidth: 140, padding: '14px 18px', borderRadius: 12,
      background: '#fff', border: `1px solid #e5e7eb`,
      borderTop: `3px solid ${color}`, flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

/* ── Single timeline event row ──────────────────────────────────────────────── */
function TimelineEvent({ ev, expanded, onToggle, printMode }) {
  const cfg = EC[ev.event_type] || EC.REGISTRATION;
  const { Icon } = cfg;

  return (
    <div className="tl-event" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
      {/* Date column */}
      <div style={{ width: 110, textAlign: 'right', paddingRight: 14, flexShrink: 0, paddingTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{fmtDate(ev.event_date)}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtTime(ev.event_date)}</div>
      </div>

      {/* Dot */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', boxShadow: `0 0 0 4px ${cfg.color}30`, marginTop: 4,
        zIndex: 2,
      }}>
        <Icon size={17} />
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginLeft: 14, background: '#fff', borderRadius: 10,
        border: `1px solid #e5e7eb`, borderLeft: `4px solid ${cfg.color}`,
        padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, height: 22 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1, color: '#111827' }}>
            {ev.event_title}
          </Typography>
          <Chip
            label={ev.status}
            size="small"
            sx={{ height: 20, fontSize: 10, fontWeight: 600,
              bgcolor: ev.status === 'Paid' || ev.status === 'Completed' || ev.status === 'Discharged' ? '#dcfce7' : '#fef9c3',
              color:  ev.status === 'Paid' || ev.status === 'Completed' || ev.status === 'Discharged' ? '#16a34a' : '#854d0e',
            }}
          />
          {!printMode && (
            <IconButton size="small" onClick={onToggle} sx={{ p: 0.3 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          )}
        </div>

        {/* Description (always visible) */}
        <div style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }}>{ev.description}</div>

        {/* Expanded details */}
        {(expanded || printMode) && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12, color: '#6b7280' }}>
              {ev.doctor_name && (
                <span>🩺 <b>Doctor:</b> Dr. {ev.doctor_name}</span>
              )}
              {ev.department && (
                <span>🏥 <b>Dept:</b> {ev.department}</span>
              )}
              <span>📋 <b>Ref:</b> {ev.reference_id}</span>
              <span>📁 <b>Module:</b> {ev.module}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Patient search panel (standalone mode only) ────────────────────────────── */
function PatientSearch({ onSelect }) {
  const [name,    setName]    = useState('');
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const search = async () => {
    if (!name.trim()) { setError('Enter patient name.'); return; }
    setError(''); setLoading(true);
    try {
      const res  = await authFetch(`${API_BASE_URL}/fetchpat?patientName=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setError(data.message || 'No patients found.');
        setRows([]);
      } else {
        setRows(data);
        if (!data.length) setError('No patients found.');
      }
    } catch { setError('Search failed — check backend connection.'); }
    finally { setLoading(false); }
  };

  const columns = [
    { field: 'patient_id',   headerName: 'ID',           width: 70  },
    { field: 'name',         headerName: 'Name',         flex: 1    },
    { field: 'date_of_birth',headerName: 'Date of Birth',width: 150 },
    { field: 'age',          headerName: 'Age',          width: 70  },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Find Patient</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" label="Patient Name" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          sx={{ minWidth: 240 }} />
        <Button variant="contained" onClick={search} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Search size={15} />}>
          Search
        </Button>
      </Box>
      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</div>}
      {rows.length > 0 && (
        <DataGrid
          rows={rows.map(r => ({ ...r, id: r.patient_id }))}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          onRowClick={({ row }) => onSelect(row)}
          sx={{ cursor: 'pointer', fontSize: 13,
            '& .MuiDataGrid-row:hover': { bgcolor: '#eff6ff' } }}
        />
      )}
    </Box>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main component — accepts optional patientId prop (embedded mode)
══════════════════════════════════════════════════════════════════════════════ */
export default function PatientTimeline({ patientId: propPatientId }) {
  const embedded = !!propPatientId;

  const [patient,    setPatient]    = useState(null);
  const [events,     setEvents]     = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [filterTypes,    setFilterTypes]    = useState([]);
  const [filterDoctor,   setFilterDoctor]   = useState('');
  const [searchText,     setSearchText]     = useState('');
  const [showFilters,    setShowFilters]    = useState(false);

  // Expand/collapse
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const printRef = useRef(null);

  /* ── Fetch timeline ─────────────────────────────────────────────────────── */
  const fetchTimeline = useCallback(async (pid) => {
    setLoading(true); setError(''); setExpandedSet(new Set());
    try {
      const res  = await authFetch(`${API_BASE_URL}/api/patient/${pid}/timeline`, { headers: authHdr() });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load timeline.'); return; }
      setPatient(data.patient);
      setEvents(data.events || []);
      setSummary(data.summary || {});
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (propPatientId) fetchTimeline(propPatientId);
  }, [propPatientId, fetchTimeline]);

  /* ── Filtered events ────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (filterTypes.length && !filterTypes.includes(ev.event_type)) return false;
      if (filterDateFrom && ev.event_date < filterDateFrom) return false;
      if (filterDateTo   && ev.event_date > filterDateTo + 'T23:59:59') return false;
      if (filterDoctor && ev.doctor_name !== filterDoctor) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          ev.event_title?.toLowerCase().includes(q) ||
          ev.description?.toLowerCase().includes(q) ||
          ev.doctor_name?.toLowerCase().includes(q) ||
          ev.department?.toLowerCase().includes(q) ||
          ev.reference_id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, filterTypes, filterDateFrom, filterDateTo, filterDoctor, searchText]);

  /* ── Derived filter options ─────────────────────────────────────────────── */
  const doctorOptions = useMemo(() => {
    const docs = [...new Set(events.map(e => e.doctor_name).filter(Boolean))];
    return docs.sort();
  }, [events]);

  /* ── Expand / collapse ──────────────────────────────────────────────────── */
  const toggleEvent = (idx) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const toggleAll = () => {
    if (allExpanded) { setExpandedSet(new Set()); setAllExpanded(false); }
    else { setExpandedSet(new Set(filtered.map((_, i) => i))); setAllExpanded(true); }
  };

  /* ── Print ──────────────────────────────────────────────────────────────── */
  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'tl-print-style';
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #tl-print-root { display: block !important; }
        #tl-print-root { position: fixed; top:0; left:0; width:100%; }
        .no-print { display: none !important; }
        .tl-event { break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    const root = document.getElementById('tl-print-root');
    if (root) root.style.display = 'block';
    window.print();
    setTimeout(() => { document.head.removeChild(style); }, 500);
  };

  /* ── Excel export ───────────────────────────────────────────────────────── */
  const handleExcelExport = () => {
    const data = filtered.map(ev => ({
      'Date':         fmtDate(ev.event_date),
      'Time':         fmtTime(ev.event_date),
      'Event Type':   EC[ev.event_type]?.label || ev.event_type,
      'Title':        ev.event_title,
      'Description':  ev.description,
      'Doctor':       ev.doctor_name || '',
      'Department':   ev.department  || '',
      'Status':       ev.status,
      'Reference':    ev.reference_id,
      'Module':       ev.module,
    }));
    exportToExcel(data, `Patient_Timeline_${patient?.name || 'export'}.xlsx`);
  };

  /* ── Reset filters ──────────────────────────────────────────────────────── */
  const resetFilters = () => {
    setFilterDateFrom(''); setFilterDateTo('');
    setFilterTypes([]); setFilterDoctor(''); setSearchText('');
  };

  const hasFilters = filterDateFrom || filterDateTo || filterTypes.length || filterDoctor || searchText;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <Box id={embedded ? undefined : 'tl-print-root'}
      sx={{ fontFamily: 'Inter, sans-serif', pb: 4 }}>

      {/* Page title (standalone only) */}
      {!embedded && (
        <Typography variant="h5" fontWeight={800} mb={3} color="#111827"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClipboardList size={24} /> Patient Timeline
        </Typography>
      )}

      {/* Patient search (standalone only) */}
      {!embedded && !patient && (
        <PatientSearch onSelect={p => fetchTimeline(p.patient_id)} />
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
          <Typography mt={2} color="text.secondary">Loading patient timeline…</Typography>
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Box sx={{ bgcolor: '#fee2e2', color: '#dc2626', p: 2, borderRadius: 2, mb: 2 }}>{error}</Box>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {patient && !loading && (
        <>
          {/* Patient banner */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 2, mb: 3,
            p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <Box>
              <Typography fontWeight={800} fontSize={18} color="#0f172a">
                {patient.name}
              </Typography>
              <Typography fontSize={13} color="#64748b">
                ID: {patient.patient_id}
                {patient.sex && ` · ${patient.sex === 'M' ? 'Male' : 'Female'}`}
                {patient.date_of_birth && ` · ${fmtAge(patient.date_of_birth)}`}
                {patient.phone && ` · ${patient.phone}`}
              </Typography>
            </Box>
            <Box className="no-print" sx={{ display: 'flex', gap: 1 }}>
              {!embedded && (
                <Button size="small" variant="outlined" startIcon={<X size={14} />}
                  onClick={() => { setPatient(null); setEvents([]); setSummary(null); }}>
                  Change Patient
                </Button>
              )}
              <Tooltip title="Print Timeline">
                <IconButton size="small" onClick={handlePrint} sx={{ border: '1px solid #e5e7eb' }}>
                  <Printer size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to Excel">
                <IconButton size="small" onClick={handleExcelExport} sx={{ border: '1px solid #e5e7eb' }}>
                  <FileSpreadsheet size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Summary cards */}
          {summary && (
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, mb: 3 }} className="no-print">
              <SCard label="Registration Date" value={fmtDate(summary.first_visit)}  color="#22c55e" />
              <SCard label="Total Visits"      value={summary.total_visits || 0}     color="#3b82f6" />
              <SCard label="Appointments"      value={summary.total_appointments||0} color="#a855f7" />
              <SCard label="Admissions"        value={summary.total_admissions || 0} color="#f59e0b" />
              <SCard label="Lab Tests"         value={summary.total_lab_tests || 0}  color="#f97316" />
              <SCard label="Prescriptions"     value={summary.total_prescriptions||0}color="#ec4899" />
              <SCard label="Documents"         value={summary.total_documents || 0}  color="#6366f1" />
              <SCard label="Total Paid"        value={fmtCurrency(summary.total_paid)} color="#10b981" />
            </Box>
          )}

          {/* Toolbar */}
          <Box className="no-print" sx={{
            display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2,
          }}>
            <TextField
              size="small" placeholder="Search events…" value={searchText}
              onChange={e => setSearchText(e.target.value)}
              InputProps={{ startAdornment: <Search size={14} style={{ marginRight: 6, color: '#9ca3af' }} /> }}
              sx={{ minWidth: 200 }}
            />
            <Button size="small" variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<Filter size={14} />}
              onClick={() => setShowFilters(f => !f)}>
              Filters {hasFilters ? `(${[filterDateFrom,filterDateTo,...filterTypes,filterDoctor,searchText].filter(Boolean).length})` : ''}
            </Button>
            {hasFilters && (
              <Button size="small" variant="text" color="error" startIcon={<X size={14} />}
                onClick={resetFilters}>Clear</Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Typography fontSize={13} color="#6b7280">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </Typography>
            <Button size="small" variant="text" onClick={toggleAll}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </Box>

          {/* Filter panel */}
          {showFilters && (
            <Box className="no-print" sx={{
              display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2,
              p: 2, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb',
            }}>
              <TextField size="small" label="Date From" type="date" value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
              <TextField size="small" label="Date To" type="date" value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Event Types</InputLabel>
                <Select
                  multiple value={filterTypes}
                  onChange={e => setFilterTypes(e.target.value)}
                  input={<OutlinedInput label="Event Types" />}
                  renderValue={sel => sel.map(t => EC[t]?.label || t).join(', ')}
                >
                  {ALL_TYPES.map(t => (
                    <MenuItem key={t} value={t}>
                      <Checkbox checked={filterTypes.includes(t)} size="small" />
                      <ListItemText primary={EC[t]?.label || t} sx={{ '& .MuiTypography-root': { fontSize: 13 } }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {doctorOptions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Doctor</InputLabel>
                  <Select value={filterDoctor} label="Doctor"
                    onChange={e => setFilterDoctor(e.target.value)}>
                    <MenuItem value="">All Doctors</MenuItem>
                    {doctorOptions.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: '#9ca3af' }}>
              <ClipboardList size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <Typography>No events found{hasFilters ? ' matching the current filters' : ''}.</Typography>
            </Box>
          )}

          {/* Vertical timeline */}
          {filtered.length > 0 && (
            <div style={{ position: 'relative', paddingLeft: 0 }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: 129,
                top: 0, bottom: 0,
                width: 2,
                background: 'linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)',
                zIndex: 0,
              }} />

              {filtered.map((ev, i) => (
                <TimelineEvent
                  key={`${ev.reference_id}-${i}`}
                  ev={ev}
                  expanded={expandedSet.has(i)}
                  onToggle={() => toggleEvent(i)}
                  printMode={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Box>
  );
}
