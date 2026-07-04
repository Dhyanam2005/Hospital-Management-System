import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, IconButton,
  Select, MenuItem, FormControl, Alert, Divider,
  CircularProgress,
} from '@mui/material';
import { Plus, Trash2, ClipboardList, Save } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function PrescriptionForm({ selectedDoctor, selectedDate, selectedPatientRegId }) {
  const [rows, setRows] = useState([]);
  const [medicine, setMedicine] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const dosageSchedules = [
    { id: 1, name: '1-1-1' }, { id: 2, name: '1-0-1' }, { id: 3, name: '0-0-1' },
    { id: 4, name: '1-0-0' }, { id: 5, name: '0-1-0' }, { id: 6, name: '0.5-0.5-0.5' },
    { id: 7, name: '0.5-0-0.5' }, { id: 8, name: '0-0-0.5' }, { id: 9, name: '0.5-0-0' },
    { id: 10, name: '0-0.5-0' },
  ];

  const foodInstructions = [
    { id: 1, name: 'Before Food' }, { id: 2, name: 'After Food' },
    { id: 3, name: 'Empty Stomach' }, { id: 4, name: 'At bed time' },
    { id: 5, name: 'With Food' }, { id: 6, name: 'With Plenty of Water' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch(
          `${API_BASE_URL}/fetch-prescription?doc=${selectedDoctor}&date=${selectedDate}&reg=${selectedPatientRegId}`
        );
        const data = await res.json();
        if (res.ok) setRows(data.map(item => ({ ...item, update_flag: false })));
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchData();
  }, [selectedDate, selectedDoctor, selectedPatientRegId]);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/fetchMedicines`)
      .then(r => r.json())
      .then(data => setMedicine(data))
      .catch(err => console.error('Error fetching medicines:', err));
  }, []);

  const addRow = () => {
    setRows(prev => [...prev, { drug_id: '', dosage_schedule_id: '', food_instruction_id: '', update_flag: false }]);
  };

  const deleteRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, update_flag: true };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    const formattedPrescriptions = rows.map(row => ({
      drug_id: row.drug_id,
      dosage_schedule_id: row.dosage_schedule_id,
      food_instruction_id: row.food_instruction_id,
      prescription_id: row.prescription_id,
      update_flag: row.update_flag,
      prescription_detail_id: row.prescription_detail_id,
    }));
    try {
      const res = await authFetch(`${API_BASE_URL}/prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptions: formattedPrescriptions, selectedDate, selectedDoctor, selectedPatientRegId }),
      });
      if (res.ok) {
        setAlert({ severity: 'success', msg: 'Prescription saved successfully.' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setAlert({ severity: 'error', msg: 'Failed to save prescription.' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setAlert({ severity: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (i, id) => {
    if (!id) { deleteRow(i); return; }
    try {
      const res = await authFetch(`${API_BASE_URL}/prescription/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setAlert({ severity: 'success', msg: 'Prescription deleted successfully.' });
        setRows([]);
      } else {
        setAlert({ severity: 'error', msg: 'Failed to delete prescription.' });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const selectSx = {
    fontSize: 13, borderRadius: 1.5,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mt: 3 }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#f8fafc',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClipboardList size={17} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Prescription Details
          </Typography>
        </Box>
        <Button
          size="small" variant="outlined"
          startIcon={<Plus size={14} />}
          onClick={addRow}
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 12,
            borderColor: '#2563eb', color: '#2563eb', borderRadius: 1.5,
            '&:hover': { backgroundColor: '#eff6ff' },
          }}
        >
          Add Row
        </Button>
      </Box>

      {/* Alerts */}
      {alert && (
        <Box sx={{ px: 2.5, pt: 1.5 }}>
          <Alert severity={alert.severity} onClose={() => setAlert(null)}
            sx={{ borderRadius: 1.5, py: 0.5 }}>
            {alert.msg}
          </Alert>
        </Box>
      )}

      {/* Empty state */}
      {rows.length === 0 && !alert && (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <ClipboardList size={32} color="#cbd5e1" />
          <Typography variant="body2" color="text.secondary" mt={1}>
            No prescription rows. Click <strong>Add Row</strong> to begin.
          </Typography>
        </Box>
      )}

      {/* Column headers */}
      {rows.length > 0 && (
        <>
          <Box sx={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 48px',
            gap: 1.5, px: 2.5, pt: 2, pb: 0.5,
          }}>
            {['Drug Name', 'Dosage Schedule', 'Food Instruction', ''].map((h, i) => (
              <Typography key={i} variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                {h}
              </Typography>
            ))}
          </Box>
          <Divider sx={{ mx: 2.5, borderColor: '#f1f5f9' }} />
        </>
      )}

      {/* Rows */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        {rows.map((row, index) => (
          <Box key={index} sx={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 48px',
            gap: 1.5, alignItems: 'center', mt: 1.5,
            p: 1.5, borderRadius: 1.5, border: '1px solid #f1f5f9',
            backgroundColor: '#fafbfc',
            '&:hover': { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
          }}>
            {/* Drug */}
            <FormControl size="small" fullWidth>
              <Select value={row.drug_id || ''} displayEmpty
                onChange={e => handleChange(index, 'drug_id', e.target.value)} sx={selectSx}>
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Drug</em></MenuItem>
                {medicine.map(med => (
                  <MenuItem key={med.DRUG_ID} value={med.DRUG_ID}>{med.DRUG_NAME}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Dosage */}
            <FormControl size="small" fullWidth>
              <Select value={row.dosage_schedule_id || ''} displayEmpty
                onChange={e => handleChange(index, 'dosage_schedule_id', e.target.value)} sx={selectSx}>
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Dosage</em></MenuItem>
                {dosageSchedules.map(ds => (
                  <MenuItem key={ds.id} value={ds.id}>{ds.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Food Instruction */}
            <FormControl size="small" fullWidth>
              <Select value={row.food_instruction_id || ''} displayEmpty
                onChange={e => handleChange(index, 'food_instruction_id', e.target.value)} sx={selectSx}>
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Instruction</em></MenuItem>
                {foodInstructions.map(fi => (
                  <MenuItem key={fi.id} value={fi.id}>{fi.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Delete */}
            <IconButton size="small" onClick={() => handleDelete(index, row.prescription_detail_id)}
              sx={{ color: '#ef4444', borderRadius: 1.5, '&:hover': { backgroundColor: '#fef2f2' } }}>
              <Trash2 size={16} />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      {rows.length > 0 && (
        <>
          <Divider sx={{ borderColor: '#f1f5f9' }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button
              variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                background: 'linear-gradient(135deg,#059669,#047857)',
                boxShadow: '0 4px 12px rgba(5,150,105,0.30)',
                '&:hover': { boxShadow: '0 6px 18px rgba(5,150,105,0.40)' },
              }}
            >
              {saving ? 'Saving…' : 'Save Prescription'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default PrescriptionForm;
