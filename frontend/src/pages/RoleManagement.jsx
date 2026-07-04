/**
 * RoleManagement.jsx
 *
 * Inline-editable DataGrid for maintaining application roles.
 * Supports Add (new blank row), inline cell editing, Save (batch POST/PUT),
 * client-side validation, dirty-row highlighting, and toast notifications.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { Plus, Save, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

/* ─── constants ─────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];

/* ─── ID helpers ─────────────────────────────────────────────────────────── */

let tempCounter = 0;
const newTempId = () => `__new_${++tempCounter}`;

/* ─── validation ─────────────────────────────────────────────────────────── */

/**
 * Validates every modified row.
 * Returns an array of human-readable error strings (empty = valid).
 *
 * @param {Object[]} modified  - rows being saved
 * @param {Object[]} allRows   - current full grid rows (for cross-row uniqueness)
 */
function validateAll(modified, allRows) {
  const errors = [];

  // Collect codes from rows NOT being modified (already-committed data)
  const stableIds = new Set(modified.map((r) => r.id));
  const existingCodes = new Set(
    allRows
      .filter((r) => !stableIds.has(r.id))
      .map((r) => r.ROLE_CODE?.trim().toUpperCase())
      .filter(Boolean)
  );

  const batchCodes = new Set();

  modified.forEach((row, idx) => {
    const tag = row.ROLE_CODE?.trim()
      ? `"${row.ROLE_CODE.trim()}"`
      : `Row ${idx + 1}`;

    // Role Code
    const code = row.ROLE_CODE?.trim().toUpperCase();
    if (!code) {
      errors.push(`${tag}: Role Code is required.`);
    } else if (existingCodes.has(code) || batchCodes.has(code)) {
      errors.push(`${tag}: Role Code must be unique.`);
    } else {
      batchCodes.add(code);
    }

    // Role Name
    if (!row.ROLE_NAME?.trim()) {
      errors.push(`${tag}: Role Name is required.`);
    }

    // Display Order
    const order = Number(row.DISPLAY_ORDER);
    if (
      row.DISPLAY_ORDER === '' ||
      row.DISPLAY_ORDER === null ||
      row.DISPLAY_ORDER === undefined ||
      !Number.isInteger(order) ||
      order < 1
    ) {
      errors.push(`${tag}: Display Order must be a positive integer.`);
    }

    // Status
    if (!row.STATUS) {
      errors.push(`${tag}: Status is required.`);
    }
  });

  return errors;
}

/* ─── component ─────────────────────────────────────────────────────────── */

export default function RoleManagement() {
  const apiRef = useGridApiRef();

  // Grid data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dirty tracking: { [rowId]: rowObject }
  const [modifiedRows, setModifiedRows] = useState({});
  // IDs of rows that are new (not yet persisted)
  const [newRowIds, setNewRowIds] = useState(new Set());

  // Validation
  const [validationErrors, setValidationErrors] = useState([]);

  // Toast
  const [snackbar, setSnackbar] = useState(null); // { severity, message }

  /* ── fetch ────────────────────────────────────────────────────────────── */

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/roles`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      // DataGrid requires a unique `id` field
      setRows(data.map((r) => ({ ...r, id: r.ROLE_ID })));
      setModifiedRows({});
      setNewRowIds(new Set());
      setValidationErrors([]);
    } catch {
      setSnackbar({ severity: 'error', message: 'Failed to load roles.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /* ── add blank row ────────────────────────────────────────────────────── */

  const handleAdd = useCallback(() => {
    const tempId = newTempId();
    const newRow = {
      id: tempId,
      ROLE_ID: null,
      ROLE_CODE: '',
      ROLE_NAME: '',
      DISPLAY_ORDER: rows.length + 1,
      STATUS: 'ACTIVE',
    };

    setRows((prev) => [newRow, ...prev]);
    setModifiedRows((prev) => ({ ...prev, [tempId]: newRow }));
    setNewRowIds((prev) => new Set([...prev, tempId]));
    // Clear stale validation so Save becomes re-enabled
    setValidationErrors([]);

    // Auto-focus the first editable cell of the new row
    setTimeout(() => {
      try {
        apiRef.current.startCellEditMode({ id: tempId, field: 'ROLE_CODE' });
      } catch {
        /* grid may not be ready yet — harmless */
      }
    }, 80);
  }, [apiRef, rows.length]);

  /* ── inline edit callback ─────────────────────────────────────────────── */

  const processRowUpdate = useCallback((newRow) => {
    setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
    setModifiedRows((prev) => ({ ...prev, [newRow.id]: newRow }));
    // Editing clears previous validation so Save re-enables
    setValidationErrors([]);
    return newRow;
  }, []);

  /* ── save ─────────────────────────────────────────────────────────────── */

  const handleSave = useCallback(async () => {
    const modified = Object.values(modifiedRows);
    if (!modified.length) return;

    // Client-side validation
    const errors = validateAll(modified, rows);
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);

    try {
      const results = await Promise.allSettled(
        modified.map((row) => {
          const payload = {
            ROLE_CODE: row.ROLE_CODE.trim(),
            ROLE_NAME: row.ROLE_NAME.trim(),
            DISPLAY_ORDER: Number(row.DISPLAY_ORDER),
            STATUS: row.STATUS,
          };

          if (newRowIds.has(row.id)) {
            // New row → POST
            return authFetch(`${API_BASE_URL}/api/roles`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }).then(async (res) => {
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Create failed');
              }
              return res.json();
            });
          }

          // Existing row → PUT
          return authFetch(`${API_BASE_URL}/api/roles/${row.ROLE_ID}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || 'Update failed');
            }
            return res.json();
          });
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');

      if (failed.length) {
        const messages = failed.map((f) => f.reason?.message).filter(Boolean);
        setSnackbar({
          severity: 'error',
          message: `${failed.length} record(s) failed: ${messages.join('; ')}`,
        });
      } else {
        setSnackbar({ severity: 'success', message: 'Roles saved successfully.' });
        fetchRoles(); // reload clean data
      }
    } catch {
      setSnackbar({ severity: 'error', message: 'Unexpected error while saving.' });
    } finally {
      setSaving(false);
    }
  }, [modifiedRows, newRowIds, rows, fetchRoles]);

  /* ── grid columns ─────────────────────────────────────────────────────── */

  const columns = useMemo(
    () => [
      {
        field: 'ROLE_CODE',
        headerName: 'Role Code',
        flex: 1,
        minWidth: 160,
        editable: true,
        headerClassName: 'grid-header',
        renderCell: (params) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.04em' }}>
            {params.value}
          </span>
        ),
      },
      {
        field: 'ROLE_NAME',
        headerName: 'Role Name',
        flex: 2,
        minWidth: 220,
        editable: true,
        headerClassName: 'grid-header',
      },
      {
        field: 'DISPLAY_ORDER',
        headerName: 'Display Order',
        type: 'number',
        width: 150,
        editable: true,
        align: 'center',
        headerAlign: 'center',
        headerClassName: 'grid-header',
      },
      {
        field: 'STATUS',
        headerName: 'Status',
        width: 160,
        editable: true,
        type: 'singleSelect',
        valueOptions: STATUS_OPTIONS,
        headerClassName: 'grid-header',
        renderCell: (params) =>
          params.value ? (
            <Chip
              label={params.value}
              size="small"
              color={params.value === 'ACTIVE' ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
            />
          ) : null,
      },
    ],
    []
  );

  /* ── derived state ────────────────────────────────────────────────────── */

  const unsavedCount = Object.keys(modifiedRows).length;
  const saveDisabled =
    unsavedCount === 0 || saving || validationErrors.length > 0;

  /* ── render ───────────────────────────────────────────────────────────── */

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200 }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <ShieldCheck size={26} color="#1976d2" />
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Role Management
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Define and maintain application roles. Double-click any cell to edit inline.
      </Typography>

      <Paper
        elevation={2}
        sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            backgroundColor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={15} />}
            onClick={handleAdd}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add
          </Button>

          <Tooltip
            title={
              validationErrors.length > 0
                ? 'Fix validation errors before saving'
                : unsavedCount === 0
                ? 'No changes to save'
                : ''
            }
          >
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<Save size={15} />}
                onClick={handleSave}
                disabled={saveDisabled}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </span>
          </Tooltip>

          {unsavedCount > 0 && !saving && (
            <Typography
              variant="caption"
              sx={{
                ml: 1,
                color: 'warning.dark',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              ● {unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* ── Loading bar ───────────────────────────────────────────────── */}
        {(loading || saving) && (
          <LinearProgress sx={{ height: 2 }} />
        )}

        {/* ── Validation errors ─────────────────────────────────────────── */}
        {validationErrors.length > 0 && (
          <Alert
            severity="error"
            onClose={() => setValidationErrors([])}
            sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'error.light' }}
          >
            <Typography variant="body2" fontWeight={600} mb={0.5}>
              Please fix the following errors before saving:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {validationErrors.map((e, i) => (
                <li key={i}>
                  <Typography variant="caption">{e}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        {/* ── Data grid ─────────────────────────────────────────────────── */}
        <Box sx={{ height: 520 }}>
          <DataGrid
            apiRef={apiRef}
            rows={rows}
            columns={columns}
            loading={loading}
            editMode="cell"
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(err) => {
              console.error('Row update error:', err);
            }}
            /* Row class for visual dirty / new state */
            getRowClassName={(params) => {
              if (newRowIds.has(params.id)) return 'row--new';
              if (modifiedRows[params.id]) return 'row--modified';
              return '';
            }}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            slotProps={{
              loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
            }}
            sx={{
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',

              /* Header styling */
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'text.secondary',
              },

              /* Editable cell hover cue */
              '& .MuiDataGrid-cell--editable': {
                cursor: 'cell',
                '&:hover': { backgroundColor: 'action.hover' },
              },

              /* New row — green tint */
              '& .row--new': {
                backgroundColor: '#f0fdf4',
                '&:hover': { backgroundColor: '#dcfce7' },
              },

              /* Modified (existing) row — amber tint */
              '& .row--modified': {
                backgroundColor: '#fffbeb',
                '&:hover': { backgroundColor: '#fef3c7' },
              },
            }}
          />
        </Box>
      </Paper>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, ml: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }} />
          <Typography variant="caption" color="text.secondary">New row</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }} />
          <Typography variant="caption" color="text.secondary">Modified row</Typography>
        </Box>
      </Box>

      {/* ── Toast notification ────────────────────────────────────────────── */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4500}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snackbar && (
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(null)}
            variant="filled"
            sx={{ minWidth: 280, boxShadow: 4 }}
          >
            {snackbar.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}
