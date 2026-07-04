import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button,
  Select, MenuItem, FormControl, RadioGroup,
  FormControlLabel, Radio, Alert, Grid,
  Divider, CircularProgress, InputAdornment,
} from '@mui/material';
import {
  UserPlus, User, Phone, Mail, MapPin,
  Hash, Heart, AlertCircle, Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function NewPatient() {
  const [patientName, setPatientName]         = useState('');
  const [dob, setDob]                         = useState('');
  const [phone, setPhone]                     = useState('');
  const [address, setAddress]                 = useState('');
  const [email, setEmail]                     = useState('');
  const [pincode, setPinCode]                 = useState('');
  const [gender, setGender]                   = useState('');
  const [nextOfKinName, setNextOfKinName]     = useState('');
  const [nextOfKinPhone, setNextOfKinPhone]   = useState('');
  const [cityId, setCityId]                   = useState('');
  const [cities, setCities]                   = useState([]);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [saving, setSaving]                   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authFetch(`${API_BASE_URL}/cities`)
      .then(r => r.json()).then(setCities).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) { setError('User not authenticated.'); setSaving(false); return; }
    try {
      const res = await authFetch(`${API_BASE_URL}/patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, dob, phone, address, email, pincode, gender, nextOfKinName, nextOfKinPhone, cityId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Patient registered successfully.');
        setPatientName(''); setDob(''); setPhone(''); setAddress('');
        setEmail(''); setPinCode(''); setGender(''); setNextOfKinName('');
        setNextOfKinPhone(''); setCityId('');
      } else {
        setError(data.message || 'Failed to register patient.');
      }
    } catch {
      setError('Network error. Please try again.');
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
          <UserPlus size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">New Patient</Typography>
          <Typography variant="caption" color="text.secondary">Register a new patient in the system</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
          display: 'flex', alignItems: 'center', gap: 1 }}>
          <User size={16} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">Patient Details</Typography>
        </Box>

        {(success || error) && (
          <Box sx={{ px: 2.5, pt: 2 }}>
            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 1.5, py: 0.5 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1.5, py: 0.5 }}>{error}</Alert>}
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          {/* Section: Personal Info */}
          <Typography variant="caption" fontWeight={700} color="primary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, mb: 1.5, display: 'block' }}>
            Personal Information
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              {label('Full Name')}
              <TextField fullWidth size="small" placeholder="Enter patient's full name"
                value={patientName} onChange={e => setPatientName(e.target.value)} required
                InputProps={{ startAdornment: <InputAdornment position="start"><User size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Date of Birth')}
              <TextField fullWidth size="small" type="date"
                value={dob} onChange={e => setDob(e.target.value)} required
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Phone Number')}
              <TextField fullWidth size="small" placeholder="Enter phone number"
                value={phone} onChange={e => setPhone(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Email Address')}
              <TextField fullWidth size="small" type="email" placeholder="Enter email"
                value={email} onChange={e => setEmail(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Gender')}
              <RadioGroup row value={gender} onChange={e => setGender(e.target.value)}
                sx={{ mt: 0.5, gap: 2 }}>
                <FormControlLabel value="M" control={<Radio size="small" sx={{ color: '#2563eb', '&.Mui-checked': { color: '#2563eb' } }} />} label={<Typography variant="body2">Male</Typography>} />
                <FormControlLabel value="F" control={<Radio size="small" sx={{ color: '#2563eb', '&.Mui-checked': { color: '#2563eb' } }} />} label={<Typography variant="body2">Female</Typography>} />
              </RadioGroup>
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('City')}
              <FormControl fullWidth size="small">
                <Select value={cityId} displayEmpty onChange={e => setCityId(e.target.value)}
                  sx={{ borderRadius: 1.5, backgroundColor: '#f8fafc',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  }}>
                  <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select city</em></MenuItem>
                  {cities.map(c => <MenuItem key={c.city_id} value={c.city_id}>{c.CITY_NAME}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Section: Address */}
          <Typography variant="caption" fontWeight={700} color="primary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, mb: 1.5, display: 'block' }}>
            Address & Location
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={8}>
              {label('Address')}
              <TextField fullWidth size="small" multiline rows={2} placeholder="Enter full address"
                value={address} onChange={e => setAddress(e.target.value)}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              {label('Pincode')}
              <TextField fullWidth size="small" placeholder="Enter pincode"
                value={pincode} onChange={e => setPinCode(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Hash size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
          </Grid>

          {/* Section: Emergency Contact */}
          <Typography variant="caption" fontWeight={700} color="primary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, mb: 1.5, display: 'block' }}>
            Emergency Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {label('Contact Name')}
              <TextField fullWidth size="small" placeholder="Emergency contact name"
                value={nextOfKinName} onChange={e => setNextOfKinName(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Heart size={15} color="#94a3b8" /></InputAdornment> }}
                sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {label('Contact Phone')}
              <TextField fullWidth size="small" placeholder="Emergency contact phone"
                value={nextOfKinPhone} onChange={e => setNextOfKinPhone(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><AlertCircle size={15} color="#94a3b8" /></InputAdornment> }}
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
          <Button type="submit" form="newPatientForm" onClick={handleSubmit} variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
            }}>
            {saving ? 'Registering…' : 'Register Patient'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NewPatient;
