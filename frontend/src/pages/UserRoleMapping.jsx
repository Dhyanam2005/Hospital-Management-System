/**
 * UserRoleMapping.jsx
 *
 * Assign one or more roles to a selected user.
 * – Flat grid: Sr | Role Code | Role Name | Assigned (checkbox)
 * – Assigned rows highlighted green; modified-but-unsaved rows highlighted amber
 * – Save: DELETE all existing for user → INSERT checked roles
 * – Supports sorting by Role Code and Role Name
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Snackbar,
  Alert,
  LinearProgress,
  Chip,
  FormHelperText,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Users } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

// ─────────────────────────────────────────────────────────────────────────────
//  UserRoleMapping — main component
// ─────────────────────────────────────────────────────────────────────────────

export default function UserRoleMapping() {
  const [users,    setUsers]    = useState([]);
  const [userId,   setUserId]   = useState('');
  const [rows,     setRows]     = useState([]);   // grid rows
  const [loaded,   setLoaded]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null); // { sev, msg }
  const [userErr,  setUserErr]  = useState('');

  /* ── Fetch user list on mount ── */
  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/users`)
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setToast({ sev: 'error', msg: 'Failed to load users.' }));
  }, []);

  /* ── Load roles + existing assignments ── */
  const handleLoad = useCallback(async () => {
    if (!userId) { setUserErr('Please select a user first.'); return; }
    setUserErr('');
    setLoading(true);
    try {
      const [rolesRes, assignedRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/roles`),
        authFetch(`${API_BASE_URL}/api/users/${userId}/roles`),
      ]);
      if (!rolesRes.ok || !assignedRes.ok) throw new Error('API error');

      const roles    = await rolesRes.json();     // [{ ROLE_ID, ROLE_CODE, ROLE_NAME, DISPLAY_ORDER, STATUS }]
      const assigned = await assignedRes.json();  // [ROLE_ID, ...]

      const assignedSet = new Set(assigned);

      const gridRows = roles
        .filter(r => r.STATUS === 'ACTIVE')
        .sort((a, b) => a.DISPLAY_ORDER - b.DISPLAY_ORDER)
        .map((r, i) => ({
          id:        r.ROLE_ID,
          sr:        i + 1,
          ROLE_CODE: r.ROLE_CODE,
          ROLE_NAME: r.ROLE_NAME,
          assigned:  assignedSet.has(r.ROLE_ID),
          baseline:  assignedSet.has(r.ROLE_ID),
        }));

      setRows(gridRows);
      setLoaded(true);
    } catch {
      setToast({ sev: 'error', msg: 'Failed to load role assignments.' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /* ── Reset to last-saved state ── */
  const handleReset = useCallback(() => {
    setRows(prev => prev.map(r => ({ ...r, assigned: r.baseline })));
  }, []);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!userId) { setUserErr('Please select a user first.'); return; }
    setSaving(true);
    try {
      const roleIds = rows.filter(r => r.assigned).map(r => r.id);
      const res = await authFetch(`${API_BASE_URL}/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleIds }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Save failed');

      // Commit baseline
      setRows(prev => prev.map(r => ({ ...r, baseline: r.assigned })));
      setToast({ sev: 'success', msg: `${body.count} role assignment(s) saved successfully.` });
    } catch (e) {
      setToast({ sev: 'error', msg: e.message || 'Failed to save assignments.' });
    } finally {
      setSaving(false);
    }
  }, [userId, rows]);

  /* ── Toggle a row's assigned state ── */
  const handleToggle = useCallback((roleId) => {
    setRows(prev =>
      prev.map(r => r.id === roleId ? { ...r, assigned: !r.assigned } : r)
    );
  }, []);

  /* ── User change ── */
  const handleUserChange = (e) => {
    setUserId(e.target.value);
    setUserErr('');
    setLoaded(false);
    setRows([]);
  };

  /* ── Derived counts ── */
  const assignedCount  = useMemo(() => rows.filter(r => r.assigned).length,              [rows]);
  const modifiedCount  = useMemo(() => rows.filter(r => r.assigned !== r.baseline).length, [rows]);

  /* ── Grid columns ── */
  const columns = useMemo(() => [
    {
      field: 'sr',
      headerName: 'Sr',
      width: 64,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'grid-header',
    },
    {
      field: 'ROLE_CODE',
      headerName: 'Role Code',
      flex: 1,
      minWidth: 160,
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
      headerClassName: 'grid-header',
    },
    {
      field: 'assigned',
      headerName: 'Assigned',
      width: 110,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'grid-header',
      renderCell: (params) => (
        <Checkbox
          size="small"
          checked={!!params.row.assigned}
          onChange={() => handleToggle(params.row.id)}
          sx={{ p: '4px' }}
          color="success"
        />
      ),
    },
  ], [handleToggle]);

  /* ── Row class for visual state ── */
  const getRowClassName = useCallback((params) => {
    const { assigned, baseline } = params.row;
    if (assigned !== baseline) return 'row--modified';
    if (assigned) return 'row--assigned';
    return '';
  }, []);

  return (
    <Box sx={{ p: 3 }}>

      {/* ── Page title ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Users size={24} color="#1976d2" />
        <Typography variant="h5" fontWeight={700}>User Role Mapping</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Assign roles to users. Select a user and click Load to view or modify role assignments.
      </Typography>

      {/* ── User selector card ── */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'white',
        }}
      >
        {(loading || saving) && (
          <LinearProgress sx={{ height: 2, borderRadius: '8px 8px 0 0' }} />
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', p: 2 }}>
          {/* User dropdown */}
          <FormControl size="small" sx={{ minWidth: 300 }} error={!!userErr}>
            <InputLabel required>User</InputLabel>
            <Select value={userId} label="User" onChange={handleUserChange}>
              <MenuItem value=""><em>— Select a user —</em></MenuItem>
              {users.map(u => (
                <MenuItem key={u.USER_ID} value={u.USER_ID}>
                  {u.USER_NAME}
                </MenuItem>
              ))}
            </Select>
            {userErr && <FormHelperText>{userErr}</FormHelperText>}
          </FormControl>

          {/* Load + Reset */}
          <Box sx={{ display: 'flex', gap: 1, mt: '2px' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleLoad}
              disabled={loading || saving}
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 72 }}
            >
              Load
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={handleReset}
              disabled={!loaded || loading || saving}
              sx={{ textTransform: 'none' }}
            >
              Reset
            </Button>
          </Box>

          {/* Save — pushed right */}
          <Box sx={{ ml: 'auto', mt: '2px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {loaded && modifiedCount > 0 && (
              <Typography variant="caption" color="warning.dark" fontWeight={600}>
                ● {modifiedCount} unsaved change{modifiedCount > 1 ? 's' : ''}
              </Typography>
            )}
            <Tooltip title={!loaded ? 'Load a user first' : ''}>
              <span>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={handleSave}
                  disabled={!loaded || saving}
                  sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* ── Grid panel (shown after Load) ── */}
      {loaded && (
        <Paper
          elevation={2}
          sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
        >
          {/* Summary bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {rows.length} role{rows.length !== 1 ? 's' : ''} loaded
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Assigned Roles:
              </Typography>
              <Chip
                label={`${assignedCount} / ${rows.length}`}
                size="small"
                color={
                  assignedCount === rows.length && rows.length > 0
                    ? 'success'
                    : assignedCount > 0
                    ? 'primary'
                    : 'default'
                }
                variant="filled"
                sx={{ fontWeight: 700, fontSize: '0.8rem', minWidth: 52 }}
              />
            </Box>
          </Box>

          {/* DataGrid */}
          <Box sx={{ height: Math.min(rows.length * 52 + 56 + 52, 580) }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              getRowClassName={getRowClassName}
              hideFooter={rows.length <= 100}
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'sr', sort: 'asc' }] },
              }}
              sx={{
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '0.875rem',

                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: '#f1f5f9',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                },

                /* Already assigned — light green */
                '& .row--assigned': {
                  backgroundColor: '#f0fdf4',
                  '&:hover': { backgroundColor: '#dcfce7' },
                },

                /* Changed since last load — amber */
                '& .row--modified': {
                  backgroundColor: '#fffbeb',
                  '&:hover': { backgroundColor: '#fef3c7' },
                },
              }}
            />
          </Box>

          {/* Legend */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              px: 2,
              py: 1,
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#fafafa',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }} />
              <Typography variant="caption" color="text.secondary">Assigned</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }} />
              <Typography variant="caption" color="text.secondary">Modified (unsaved)</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── Toast ── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast && (
          <Alert
            severity={toast.sev}
            onClose={() => setToast(null)}
            variant="filled"
            sx={{ minWidth: 260 }}
          >
            {toast.msg}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}
