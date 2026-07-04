import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
  Alert, Divider, CircularProgress, Grid,
} from '@mui/material';
import { Save, RefreshCw, UserCheck } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function RegistrationForm({ patientId }) {
  const [regCharges, setRegCharges]         = useState('');
  const [patientType, setPatientType]       = useState('');
  const [docId, setDocId]                   = useState('');
  const [referredBy, setReferredBy]         = useState('');
  const [inHouseDoc, setInHouseDoc]         = useState([]);
  const [refferedDoctors, setRefferedDoctors] = useState([]);
  const [oldRegistrations, setOldRegistrations] = useState([]);
  const [editableCharges, setEditableCharges]   = useState('');
  const [editableDocId, setEditableDocId]       = useState('');
  const [editbalePatType, setEditablePatType]   = useState('');
  const [editableReferredBy, setEditableReferredBy] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving]   = useState(false);

  // Reset form fields when patient changes
  useEffect(() => {
    setRegCharges(''); setPatientType(''); setDocId('');
    setReferredBy(''); setError(''); setSuccess('');
  }, [patientId]);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/fetchInHouseDoctors`)
      .then(r => r.json()).then(setInHouseDoc).catch(() => {});
    authFetch(`${API_BASE_URL}/refferedby`)
      .then(r => r.json()).then(setRefferedDoctors).catch(() => {});
  }, []);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/fetch-registration?patientId=${patientId}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const withId = data.map((item, i) => ({ id: item.patient_id || i, ...item }));
        setOldRegistrations(withId);
        if (withId.length === 1) {
          setEditableDocId(withId[0].doc_id);
          setEditablePatType(withId[0].patient_type);
          setEditableCharges(withId[0].reg_charges);
          setEditableReferredBy(withId[0].referred_by || '');
        }
      })
      .catch(() => {});
  }, [patientId]);

  const isEdit = oldRegistrations.length > 0;

  const submit = async (payload) => {
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const res = await authFetch(`${API_BASE_URL}/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(isEdit ? 'Registration updated successfully.' : 'Patient registered successfully.');
        if (!isEdit) {
          setRegCharges(''); setPatientType(''); setDocId(''); setReferredBy('');
        }
      } else {
        setError(data.message || 'Operation failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    submit({ regCharges, patientType, docId, patientId, referredBy });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    submit({
      regCharges: editableCharges,
      patientType: editbalePatType,
      docId: editableDocId,
      patientId,
      regId: oldRegistrations[0].reg_id,
      referredBy: editableReferredBy,
    });
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      '&:hover fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
    },
  };

  const charges    = isEdit ? editableCharges    : regCharges;
  const patType    = isEdit ? editbalePatType    : patientType;
  const doctor     = isEdit ? editableDocId      : docId;
  const referred   = isEdit ? editableReferredBy : referredBy;
  const setCharges = isEdit ? setEditableCharges : setRegCharges;
  const setType    = isEdit ? setEditablePatType : setPatientType;
  const setDoctor  = isEdit ? setEditableDocId   : setDocId;
  const setReferred= isEdit ? setEditableReferredBy : setReferredBy;

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 1,
        background: isEdit ? '#f0fdf4' : '#f0f7ff',
      }}>
        <UserCheck size={17} color={isEdit ? '#059669' : '#2563eb'} />
        <Typography variant="subtitle2" fontWeight={700}
          color={isEdit ? 'success.dark' : 'primary.dark'}>
          {isEdit
            ? `Edit Registration  —  #${oldRegistrations[0].reg_id}`
            : 'New Registration'}
        </Typography>
      </Box>

      {/* Alerts */}
      <Box sx={{ px: 2.5 }}>
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')}
            sx={{ mt: 1.5, borderRadius: 1.5, py: 0.5 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError('')}
            sx={{ mt: 1.5, borderRadius: 1.5, py: 0.5 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Form */}
      <Box component="form" onSubmit={isEdit ? handleUpdate : handleRegisterSubmit}
        id="regForm" sx={{ p: 2.5 }}>
        <Grid container spacing={2}>
          {/* Registration Fees */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
              Registration Fees
            </Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. 500"
              value={charges}
              onChange={e => setCharges(e.target.value)}
              type="number" inputProps={{ min: 0 }}
              sx={fieldSx}
            />
          </Grid>

          {/* Patient Type */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
              Patient Type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={patType} displayEmpty
                onChange={e => setType(e.target.value)}
                sx={{ borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select patient type</em></MenuItem>
                <MenuItem value="I">In-Patient</MenuItem>
                <MenuItem value="O">Out-Patient</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Doctor */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
              Doctor
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={doctor} displayEmpty
                onChange={e => setDoctor(e.target.value)}
                sx={{ borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select doctor</em></MenuItem>
                {inHouseDoc.map(d => (
                  <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Referred By */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
              Referred By
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={referred} displayEmpty
                onChange={e => setReferred(e.target.value)}
                sx={{ borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select referring doctor</em></MenuItem>
                {refferedDoctors.map(d => (
                  <MenuItem key={d.doc_id} value={d.doc_id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Footer / Submit */}
      <Divider sx={{ borderColor: '#f1f5f9' }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 1.5 }}>
        <Button
          form="regForm" type="submit" variant="contained"
          disabled={saving}
          startIcon={saving
            ? <CircularProgress size={14} color="inherit" />
            : isEdit ? <RefreshCw size={15} /> : <Save size={15} />}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
            background: isEdit
              ? 'linear-gradient(135deg,#059669,#047857)'
              : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            boxShadow: isEdit
              ? '0 4px 12px rgba(5,150,105,0.30)'
              : '0 4px 12px rgba(37,99,235,0.30)',
            '&:hover': {
              boxShadow: isEdit
                ? '0 6px 18px rgba(5,150,105,0.40)'
                : '0 6px 18px rgba(37,99,235,0.40)',
            },
          }}
        >
          {saving ? 'Saving…' : isEdit ? 'Update Registration' : 'Save Registration'}
        </Button>
      </Box>
    </Paper>
  );
}

export default RegistrationForm;
