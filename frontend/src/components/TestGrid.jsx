import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, IconButton,
  Select, MenuItem, FormControl, TextField,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { Plus, Trash2, FlaskConical, Save } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function TestGrid({ regId }) {
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regStatus, setRegStatus] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setRows([]);
    setSuccess('');
    setError('');
  }, [regId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch(`${API_BASE_URL}/fetchInHouseDoctors`).then(r => r.json()),
      authFetch(`${API_BASE_URL}/fetchTests`).then(r => r.json()),
      authFetch(`${API_BASE_URL}/regStatus?regId=${regId}`).then(r => r.json()),
    ])
      .then(([docs, testsData, regData]) => {
        setDoctors(docs);
        setTests(testsData);
        setRegStatus(regData[0]?.reg_status || '');
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, [regId]);

  const addRow = () => {
    setRows(prev => [...prev, { testDate: '', doctorId: '', testId: '' }]);
    setSuccess('');
    setError('');
  };

  const deleteRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const updateRow = (i, field, value) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    const incomplete = rows.some(r => !r.testDate || !r.doctorId || !r.testId);
    if (incomplete) { setError('Please fill in all fields before saving.'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    const rowsForApi = rows.map(r => ({
      testDate: r.testDate,
      doctor: doctors.find(d => d.doc_id.toString() === r.doctorId),
      test: tests.find(t => t.test_id.toString() === r.testId),
    }));

    try {
      const res = await authFetch(`${API_BASE_URL}/saveTestGridData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regId, rows: rowsForApi, testDate: rows[0]?.testDate }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess('Tests saved successfully.');
        setRows([]);
      } else {
        setError(result.message || 'Failed to save tests.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
        <CircularProgress size={28} sx={{ color: '#2563eb' }} />
        <Typography variant="body2" color="text.secondary" mt={1}>Loading test data…</Typography>
      </Paper>
    );
  }

  if (regStatus === 'D') {
    return (
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #fecaca', borderRadius: 2, background: '#fef2f2' }}>
        <Typography variant="body1" fontWeight={600} color="error.main" textAlign="center">
          Patient has been discharged — tests cannot be assigned.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 1.5, borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#f8fafc',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlaskConical size={17} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Tests for Registration #{regId}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          onClick={addRow}
          variant="outlined"
          sx={{
            textTransform: 'none', fontWeight: 600, fontSize: 12,
            borderColor: '#2563eb', color: '#2563eb', borderRadius: 1.5,
            '&:hover': { backgroundColor: '#eff6ff' },
          }}
        >
          Add Test
        </Button>
      </Box>

      {/* ── Alerts ─────────────────────────────────────────────────────── */}
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

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {rows.length === 0 && !success && (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <FlaskConical size={32} color="#cbd5e1" />
          <Typography variant="body2" color="text.secondary" mt={1}>
            No tests added yet. Click <strong>Add Test</strong> to begin.
          </Typography>
        </Box>
      )}

      {/* ── Column headers ──────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1fr 48px',
            gap: 1.5, px: 2.5, pt: 2, pb: 0.5,
          }}>
            {['Test Date', 'Doctor', 'Test Name', ''].map((h, i) => (
              <Typography key={i} variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                {h}
              </Typography>
            ))}
          </Box>
          <Divider sx={{ mx: 2.5, borderColor: '#f1f5f9' }} />
        </>
      )}

      {/* ── Test rows ───────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        {rows.map((row, i) => (
          <Box key={i} sx={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1fr 48px',
            gap: 1.5, alignItems: 'center', mt: 1.5,
            p: 1.5, borderRadius: 1.5,
            border: '1px solid #f1f5f9',
            backgroundColor: '#fafbfc',
            '&:hover': { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
          }}>
            {/* Date */}
            <TextField
              type="date"
              size="small"
              value={row.testDate}
              onChange={e => updateRow(i, 'testDate', e.target.value)}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: 13, borderRadius: 1.5,
                  '&:hover fieldset': { borderColor: '#2563eb' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
              }}
            />

            {/* Doctor */}
            <FormControl size="small" fullWidth>
              <Select
                value={row.doctorId}
                displayEmpty
                onChange={e => updateRow(i, 'doctorId', e.target.value)}
                sx={{
                  fontSize: 13, borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Doctor</em></MenuItem>
                {doctors.map(d => (
                  <MenuItem key={d.doc_id} value={d.doc_id.toString()}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Test */}
            <FormControl size="small" fullWidth>
              <Select
                value={row.testId}
                displayEmpty
                onChange={e => updateRow(i, 'testId', e.target.value)}
                sx={{
                  fontSize: 13, borderRadius: 1.5,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
                }}
              >
                <MenuItem value="" disabled><em style={{ color: '#94a3b8' }}>Select Test</em></MenuItem>
                {tests.map(t => (
                  <MenuItem key={t.test_id} value={t.test_id.toString()}>{t.test_name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Delete */}
            <IconButton
              size="small"
              onClick={() => deleteRow(i)}
              sx={{
                color: '#ef4444', borderRadius: 1.5,
                '&:hover': { backgroundColor: '#fef2f2' },
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* ── Footer / Save ───────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <>
          <Divider sx={{ borderColor: '#f1f5f9' }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                background: 'linear-gradient(135deg,#059669,#047857)',
                boxShadow: '0 4px 12px rgba(5,150,105,0.30)',
                '&:hover': { boxShadow: '0 6px 18px rgba(5,150,105,0.40)' },
              }}
            >
              {saving ? 'Saving…' : 'Save Tests'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default TestGrid;
