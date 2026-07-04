import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Select,
  MenuItem, FormControl, Alert, CircularProgress,
} from '@mui/material';
import { ClipboardList, Search } from 'lucide-react';
import PrescriptionForm from './PresrciptionForm.jsx';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function Prescription() {
  const [doctors, setDoctors] = useState([]);
  const [patient, setPatient] = useState([]);
  const [selectedDoctor, setIsSelectedDoctor] = useState('');
  const [selectedPatientRegId, setSelectedPatientRegId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API_BASE_URL}/doctor`).then(r => r.json()),
      authFetch(`${API_BASE_URL}/fetchLatestRegPatient`).then(r => r.json()),
    ]).then(([docs, pats]) => {
      setDoctors(docs);
      setPatient(pats);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const searchData = () => {
    if (selectedDoctor && selectedPatientRegId && selectedDate) {
      setShowForm(true);
      setAlert('');
    } else {
      setAlert('Please select doctor, patient, and date before searching.');
      setShowForm(false);
    }
  };

  const selectSx = {
    fontSize: 13, borderRadius: 1.5, minWidth: 200,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
    backgroundColor: '#f8fafc',
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
          <ClipboardList size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Prescription</Typography>
          <Typography variant="caption" color="text.secondary">Select doctor, patient, and date to write a prescription</Typography>
        </Box>
      </Box>

      {/* Filter card */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10, mb: 1.5, display: 'block' }}>
          Filter
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} sx={{ color: '#2563eb' }} />
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Doctor */}
            <FormControl size="small">
              <Select value={selectedDoctor} displayEmpty onChange={e => setIsSelectedDoctor(e.target.value)} sx={selectSx}>
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Doctor</em></MenuItem>
                {doctors.map(d => <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>

            {/* Patient */}
            <FormControl size="small">
              <Select value={selectedPatientRegId} displayEmpty onChange={e => setSelectedPatientRegId(e.target.value)} sx={selectSx}>
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Patient</em></MenuItem>
                {patient.map(p => <MenuItem key={p.reg_id} value={p.reg_id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>

            {/* Date */}
            <Box sx={{
              '& input': {
                border: '1px solid #e2e8f0', borderRadius: '6px',
                padding: '7px 12px', fontSize: 13, outline: 'none',
                backgroundColor: '#f8fafc', color: '#0f172a',
              },
            }}>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </Box>

            <Button
              variant="contained" onClick={searchData}
              startIcon={<Search size={15} />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
              }}
            >
              Load Prescription
            </Button>
          </Box>
        )}
      </Paper>

      {/* Validation alert */}
      {alert && (
        <Alert severity="warning" onClose={() => setAlert('')} sx={{ mb: 2, borderRadius: 2 }}>
          {alert}
        </Alert>
      )}

      {/* Prescription form */}
      {showForm && (
        <PrescriptionForm
          selectedDoctor={selectedDoctor}
          selectedDate={selectedDate}
          selectedPatientRegId={selectedPatientRegId}
        />
      )}
    </Box>
  );
}

export default Prescription;
