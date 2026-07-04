import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Plus, Pencil } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const EMPTY_FORM = {
  DOCUMENT_CODE: '',
  DOCUMENT_NAME: '',
  ALLOWED_FILE_TYPES: 'pdf,jpg,jpeg,png',
  MAX_FILE_SIZE_MB: 10,
  DISPLAY_ORDER: 0,
  STATUS: 'ACTIVE',
};

export default function DocumentMasterPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [form, setForm]       = useState(EMPTY_FORM);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const headers = { 'Content-Type': 'application/json' };

  const fetchAll = useCallback(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/api/document-master/all`, { headers })
      .then(r => r.json())
      .then(data => {
        setRows(Array.isArray(data) ? data.map(d => ({ ...d, id: d.DOCUMENT_ID })) : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      DOCUMENT_CODE:      row.DOCUMENT_CODE,
      DOCUMENT_NAME:      row.DOCUMENT_NAME,
      ALLOWED_FILE_TYPES: row.ALLOWED_FILE_TYPES,
      MAX_FILE_SIZE_MB:   row.MAX_FILE_SIZE_MB,
      DISPLAY_ORDER:      row.DISPLAY_ORDER,
      STATUS:             row.STATUS,
    });
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.DOCUMENT_CODE.trim() || !form.DOCUMENT_NAME.trim()) {
      setError('Code and Name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url    = editing
        ? `${API_BASE_URL}/api/document-master/${editing.DOCUMENT_ID}`
        : `${API_BASE_URL}/api/document-master`;
      const method = editing ? 'PUT' : 'POST';
      const res    = await authFetch(url, { method, headers, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed.'); return; }
      setOpen(false);
      fetchAll();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: 'DOCUMENT_ID',        headerName: 'ID',              width: 70  },
    { field: 'DOCUMENT_CODE',      headerName: 'Code',            width: 150 },
    { field: 'DOCUMENT_NAME',      headerName: 'Name',            width: 180 },
    { field: 'ALLOWED_FILE_TYPES', headerName: 'Allowed Types',   width: 200 },
    { field: 'MAX_FILE_SIZE_MB',   headerName: 'Max Size (MB)',   width: 120 },
    { field: 'DISPLAY_ORDER',      headerName: 'Order',           width: 80  },
    {
      field: 'STATUS', headerName: 'Status', width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            bgcolor: value === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
            color:   value === 'ACTIVE' ? '#16a34a' : '#dc2626',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: '_actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" startIcon={<Pencil size={14} />} onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Document Master</Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={openAdd}>
          Add Category
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Document Category' : 'Add Document Category'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {error && (
            <Box sx={{ bgcolor: '#fee2e2', color: '#dc2626', p: 1.5, borderRadius: 1, fontSize: 14 }}>
              {error}
            </Box>
          )}
          <TextField
            label="Document Code"
            value={form.DOCUMENT_CODE}
            onChange={e => setForm(f => ({ ...f, DOCUMENT_CODE: e.target.value.toUpperCase() }))}
            disabled={!!editing}
            size="small"
            fullWidth
          />
          <TextField
            label="Document Name"
            value={form.DOCUMENT_NAME}
            onChange={e => setForm(f => ({ ...f, DOCUMENT_NAME: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Allowed File Types (comma-separated)"
            value={form.ALLOWED_FILE_TYPES}
            onChange={e => setForm(f => ({ ...f, ALLOWED_FILE_TYPES: e.target.value }))}
            size="small"
            fullWidth
            helperText="e.g. pdf,jpg,jpeg,png,doc,docx"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Max File Size (MB)"
              type="number"
              value={form.MAX_FILE_SIZE_MB}
              onChange={e => setForm(f => ({ ...f, MAX_FILE_SIZE_MB: Number(e.target.value) }))}
              size="small"
              sx={{ flex: 1 }}
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              label="Display Order"
              type="number"
              value={form.DISPLAY_ORDER}
              onChange={e => setForm(f => ({ ...f, DISPLAY_ORDER: Number(e.target.value) }))}
              size="small"
              sx={{ flex: 1 }}
              inputProps={{ min: 0 }}
            />
          </Box>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.STATUS}
              label="Status"
              onChange={e => setForm(f => ({ ...f, STATUS: e.target.value }))}
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
