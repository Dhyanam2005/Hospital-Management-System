import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip,
  Select, MenuItem, FormControl, Alert,
  Divider, CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar, Search, Save, Trash2 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function Appointment() {
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isSearched, setIsSearched]         = useState(false);
  const [inHousedoctors, setInHouseDoctors] = useState([]);
  const [patient, setPatient]               = useState([]);
  const [appointment, setAppointments]      = useState([]);
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [alert, setAlert]                   = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch(`${API_BASE_URL}/fetchInHouseDoctors`).then(r => r.json()),
      authFetch(`${API_BASE_URL}/fetchAllPatients`).then(r => r.json()),
    ]).then(([docs, pats]) => {
      setInHouseDoctors(docs);
      setPatient(pats);
    }).catch(() => {});
  }, []);

  const handleAppointMents = async () => {
    if (!selectedDate || !selectedDoctor) return;
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const res = await authFetch(
        `${API_BASE_URL}/appointmentlist?doc_id=${selectedDoctor}&appointment_date=${formattedDate}`
      );
      const data = await res.json();
      if (res.ok) { setAppointments(data); setIsSearched(true); }
    } catch {}
    setLoading(false);
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/appointment/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setAlert({ severity: 'success', msg: 'Appointment cleared.' });
        await handleAppointMents();
      } else {
        setAlert({ severity: 'error', msg: 'Failed to delete appointment.' });
      }
    } catch {
      setAlert({ severity: 'error', msg: 'Network error.' });
    }
  };

  const saveAppointment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment, selectedDoctor,
          selectedDate: format(selectedDate, 'yyyy-MM-dd'),
        }),
      });
      if (res.ok) {
        setAlert({ severity: 'success', msg: 'Appointments saved successfully.' });
        await handleAppointMents();
      } else {
        setAlert({ severity: 'error', msg: 'Failed to save appointments.' });
      }
    } catch {
      setAlert({ severity: 'error', msg: 'Network error.' });
    }
    setSaving(false);
  };

  const handleChange = (index, field, value) => {
    const updated = [...appointment];
    updated[index][field] = value;
    setAppointments(updated);
  };

  const selectSx = {
    fontSize: 13, borderRadius: 1.5, minWidth: 180,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
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
          <Calendar size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Appointments</Typography>
          <Typography variant="caption" color="text.secondary">
            Select a date and doctor to view and assign appointment slots
          </Typography>
        </Box>
      </Box>

      {/* Filter card */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
          sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
          Filter
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date picker — keep react-datepicker but style wrapper */}
          <Box sx={{
            '& .react-datepicker-wrapper input': {
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '7px 12px', fontSize: 13, outline: 'none',
              backgroundColor: '#f8fafc', color: '#0f172a',
              '&:focus': { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.12)' },
            },
          }}>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="Select date"
            />
          </Box>

          {/* Doctor select */}
          <FormControl size="small">
            <Select
              value={selectedDoctor} displayEmpty
              onChange={e => setSelectedDoctor(e.target.value)}
              sx={selectSx}
            >
              <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Doctor</em></MenuItem>
              {inHousedoctors.map(d => (
                <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained" onClick={handleAppointMents}
            disabled={!selectedDate || !selectedDoctor || loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Search size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}
          >
            {loading ? 'Loading…' : 'Load Slots'}
          </Button>
        </Box>
      </Paper>

      {/* Alert */}
      {alert && (
        <Alert severity={alert.severity} onClose={() => setAlert(null)}
          sx={{ mb: 2, borderRadius: 2 }}>
          {alert.msg}
        </Alert>
      )}

      {/* Appointment slots */}
      {isSearched && appointment.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc',
          }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              Appointment Slots
            </Typography>
            <Chip label={`${appointment.length} slots`} size="small"
              sx={{ fontSize: 11, fontWeight: 600, height: 22, backgroundColor: '#eff6ff', color: '#2563eb' }} />
          </Box>

          <Box sx={{ px: 2.5, py: 2 }}>
            {/* Column headers */}
            <Box sx={{
              display: 'grid', gridTemplateColumns: '160px 1fr 56px',
              gap: 2, mb: 1, pb: 1, borderBottom: '1px solid #f1f5f9',
            }}>
              {['Time', 'Patient', ''].map((h, i) => (
                <Typography key={i} variant="caption" fontWeight={700} color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                  {h}
                </Typography>
              ))}
            </Box>

            <Box component="form" id="appointment-form">
              {appointment.map((app, index) => {
                const taken = appointment.filter((_, i) => i !== index).map(a => String(a.patient_id)).filter(Boolean);
                const available = patient.filter(p => !taken.includes(String(p.patient_id)));
                return (
                  <Box key={index} sx={{
                    display: 'grid', gridTemplateColumns: '160px 1fr 56px',
                    gap: 2, alignItems: 'center', py: 1,
                    borderBottom: '1px solid #f9fafb',
                    '&:hover': { backgroundColor: '#f8fafc' },
                  }}>
                    {/* Time */}
                    <Typography variant="body2" fontWeight={600} sx={{
                      color: '#0f172a', px: 1.5, py: 0.5,
                      backgroundColor: '#f1f5f9', borderRadius: 1, width: 'fit-content',
                    }}>
                      {app.appointment_time}
                    </Typography>

                    {/* Patient select */}
                    <FormControl size="small" fullWidth>
                      <Select
                        value={app.patient_id || ''}
                        onChange={e => handleChange(index, 'patient_id', e.target.value)}
                        disabled={!!app.APPOINTMENT_ID}
                        displayEmpty
                        sx={selectSx}
                      >
                        <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select Patient</em></MenuItem>
                        {available.map(p => (
                          <MenuItem key={p.patient_id} value={p.patient_id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Delete */}
                    <Button
                      size="small" variant="outlined" color="error"
                      onClick={() => deleteAppointment(app.APPOINTMENT_ID)}
                      disabled={!app.APPOINTMENT_ID}
                      sx={{ minWidth: 40, p: 0.5, borderRadius: 1.5 }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button
              form="appointment-form" onClick={saveAppointment}
              variant="contained" disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                background: 'linear-gradient(135deg,#059669,#047857)',
                boxShadow: '0 4px 12px rgba(5,150,105,0.30)',
              }}
            >
              {saving ? 'Saving…' : 'Save Appointments'}
            </Button>
          </Box>
        </Paper>
      )}

      {isSearched && appointment.length === 0 && !loading && (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
          <Calendar size={32} color="#cbd5e1" />
          <Typography variant="body2" color="text.secondary" mt={1}>
            No appointment slots found for the selected date and doctor.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default Appointment;
