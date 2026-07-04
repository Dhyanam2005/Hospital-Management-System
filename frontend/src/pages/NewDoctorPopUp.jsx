import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, Alert, Grid, Divider, CircularProgress, InputAdornment,
} from '@mui/material';
import { Stethoscope, User, Mail, Phone, MapPin, Award, Hash, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function NewDoctorPopUp() {
  const [doctorName, setDoctorName]         = useState('');
  const [email, setEmail]                   = useState('');
  const [phone, setPhone]                   = useState('');
  const [address, setAddress]               = useState('');
  const [qualification, setQualification]   = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber]   = useState('');
  const [docType, setDocType]               = useState('');
  const [errorMessage, setErrorMessage]     = useState('');
  const [success, setSuccess]               = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [saving, setSaving]                 = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    authFetch(`${API_BASE_URL}/specializations`)
      .then(r => r.json())
      .then(data => setSpecializations(data))
      .catch(() => setErrorMessage('Failed to load specializations'));
  }, []);

  const handleDoctorFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); setSuccess('');
    if (!token) { setErrorMessage('User not authenticated'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName, email, phone, address, qualification,
          specialization: parseInt(specialization), licenseNumber, docType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Doctor created successfully.');
        setDoctorName(''); setEmail(''); setPhone(''); setAddress('');
        setQualification(''); setSpecialization(''); setLicenseNumber(''); setDocType('');
      } else {
        setErrorMessage(data.message || 'Something went wrong');
      }
    } catch {
      setErrorMessage('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5, backgroundColor: '#f8fafc',
      '&:hover fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
      '&.Mui-focused': { backgroundColor: '#fff' },
    },
  };

  const selectSx = {
    borderRadius: 1.5, backgroundColor: '#f8fafc',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
  };

  const label = (text) => (
    <Typography variant="caption" fontWeight={700} color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, mb: 0.5, display: 'block' }}>
      {text}
    </Typography>
  );

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <Stethoscope size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Add New Doctor</Typography>
          <Typography variant="caption" color="text.secondary">Register a new doctor in the system</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
          display: 'flex', alignItems: 'center', gap: 1 }}>
          <User size={16} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">Doctor Details</Typography>
        </Box>

        {(success || errorMessage) && (
          <Box sx={{ px: 2.5, pt: 2 }}>
            {success && <Alert severity="success" onClose={() => setSuccess('')}
              sx={{ borderRadius: 1.5, py: 0.5 }}>{success}</Alert>}
            {errorMessage && <Alert severity="error" onClose={() => setErrorMessage('')}
              sx={{ borderRadius: 1.5, py: 0.5 }}>{errorMessage}</Alert>}
          </Box>
        )}

        <Box component="form" onSubmit={handleDoctorFormSubmit} sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={700} color="primary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, mb: 1.5, display: 'block' }}>
            Personal Information
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              {label('Full Name')}
              <TextField fullWidth size="small" placeholder="Doctor's full name"
                value={doctorName} onChange={e => setDoctorName(e.target.value)} required
                InputProps={{ startAdornment: <InputAdornment position="start"><User size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Email Address')}
              <TextField fullWidth size="small" type="email" placeholder="Doctor's email"
                value={email} onChange={e => setEmail(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Phone Number')}
              <TextField fullWidth size="small" placeholder="Phone number"
                value={phone} onChange={e => setPhone(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Qualification')}
              <TextField fullWidth size="small" placeholder="e.g. MBBS, MD"
                value={qualification} onChange={e => setQualification(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Award size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              {label('Address')}
              <TextField fullWidth size="small" multiline rows={2} placeholder="Full address"
                value={address} onChange={e => setAddress(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 0.5 }}><MapPin size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
          </Grid>

          <Typography variant="caption" fontWeight={700} color="primary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, mb: 1.5, display: 'block' }}>
            Professional Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {label('Specialization')}
              <FormControl fullWidth size="small">
                <Select value={specialization} displayEmpty onChange={e => setSpecialization(e.target.value)} sx={selectSx}>
                  <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select specialization</em></MenuItem>
                  {specializations.map(s => (
                    <MenuItem key={s.doc_spe_id} value={s.doc_spe_id}>{s.specialization}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Doctor Type')}
              <FormControl fullWidth size="small">
                <Select value={docType} displayEmpty onChange={e => setDocType(e.target.value)} sx={selectSx}>
                  <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select type</em></MenuItem>
                  <MenuItem value="I">In-House (I)</MenuItem>
                  <MenuItem value="R">Referral (R)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('License Number')}
              <TextField fullWidth size="small" placeholder="Medical license number"
                value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                inputProps={{ maxLength: 10 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Hash size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: '#f1f5f9' }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, p: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleDoctorFormSubmit} variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}>
            {saving ? 'Saving…' : 'Create Doctor'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NewDoctorPopUp;
