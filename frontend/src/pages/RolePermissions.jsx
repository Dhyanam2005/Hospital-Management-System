/**
 * RolePermissions.jsx
 *
 * Assign menus to a role via a hierarchical checkbox tree.
 * – Parent checkbox checks / unchecks all descendants
 * – Child checkbox propagates checked state up to ancestors
 * – Indeterminate state on parent when only some children are selected
 * – Expand All / Collapse All, Select All / Deselect All
 * – Counter: Assigned Menus X / Total
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
  Divider,
  Chip,
  FormHelperText,
} from '@mui/material';
import { ChevronRight, ChevronDown, KeyRound } from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

// ─────────────────────────────────────────────────────────────────────────────
//  Pure tree-utility functions
// ─────────────────────────────────────────────────────────────────────────────

function buildNodeMap(nodes, acc = {}) {
  nodes.forEach(n => {
    acc[n.MENU_ID] = n;
    if (n.children?.length) buildNodeMap(n.children, acc);
  });
  return acc;
}

function buildParentMap(nodes, parentId = null, acc = {}) {
  nodes.forEach(n => {
    acc[n.MENU_ID] = parentId;
    if (n.children?.length) buildParentMap(n.children, n.MENU_ID, acc);
  });
  return acc;
}

/** All IDs in a subtree (node + descendants) */
function subtreeIds(node) {
  return [node.MENU_ID, ...(node.children || []).flatMap(subtreeIds)];
}

/** All IDs in the entire tree */
function allTreeIds(nodes) {
  return nodes.flatMap(subtreeIds);
}

/** IDs of nodes that have children (used for Expand All) */
function collectParentIds(nodes, acc = []) {
  nodes.forEach(n => {
    if (n.children?.length) {
      acc.push(n.MENU_ID);
      collectParentIds(n.children, acc);
    }
  });
  return acc;
}

/**
 * Returns 'on' | 'mid' | 'off' for a node.
 * Parent state is derived purely from children — own ID is irrelevant.
 */
function checkState(node, checked) {
  if (!node.children?.length) {
    return checked.has(node.MENU_ID) ? 'on' : 'off';
  }
  const states = node.children.map(c => checkState(c, checked));
  if (states.every(s => s === 'on'))  return 'on';
  if (states.every(s => s === 'off')) return 'off';
  return 'mid';
}

/**
 * Toggle a node:
 * – If fully checked → uncheck subtree + remove ancestor IDs
 * – Otherwise       → check subtree + add ancestor IDs if all siblings become checked
 */
function toggle(nodeId, checked, nodeMap, parentMap) {
  const node = nodeMap[nodeId];
  if (!node) return checked;

  const state = checkState(node, checked);
  const ids   = subtreeIds(node);
  const next  = new Set(checked);

  if (state === 'on') {
    // Uncheck subtree
    ids.forEach(id => next.delete(id));
    // Remove all ancestors (they can no longer be fully checked)
    let pid = parentMap[nodeId];
    while (pid) { next.delete(pid); pid = parentMap[pid]; }
  } else {
    // Check subtree
    ids.forEach(id => next.add(id));
    // Walk up: add ancestor only when ALL its children subtrees are fully 'on'
    let pid = parentMap[nodeId];
    while (pid) {
      const parent = nodeMap[pid];
      if (!parent) break;
      const allOn = parent.children.every(c => checkState(c, next) === 'on');
      if (allOn) {
        next.add(pid);
        pid = parentMap[pid];
      } else {
        // This ancestor and every ancestor above it cannot be fully checked
        next.delete(pid);
        let apid = parentMap[pid];
        while (apid) { next.delete(apid); apid = parentMap[apid]; }
        break;
      }
    }
  }

  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MenuTreeNode — recursive row component
// ─────────────────────────────────────────────────────────────────────────────

function MenuTreeNode({ node, depth, serial, checked, expanded, nodeMap, parentMap, onToggle, onToggleExpand }) {
  const hasKids = !!node.children?.length;
  const isOpen  = expanded.has(node.MENU_ID);
  const state   = checkState(node, checked);

  const rowBg = depth === 0 ? '#f8fafc' : '#ffffff';

  return (
    <Box>
      {/* ── Row ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: `${8 + depth * 20}px`,
          pr: 2,
          py: '5px',
          backgroundColor: rowBg,
          borderBottom: '1px solid #e5e7eb',
          '&:hover': { backgroundColor: '#eff6ff' },
        }}
      >
        {/* Sr number — top-level rows only */}
        <Box sx={{ width: 36, flexShrink: 0 }}>
          {serial != null && (
            <Typography variant="caption" color="text.disabled" fontWeight={600}>
              {serial}
            </Typography>
          )}
        </Box>

        {/* Expand / collapse toggle */}
        <Box
          sx={{
            width: 22,
            height: 22,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasKids ? 'pointer' : 'default',
            color: hasKids ? 'text.secondary' : 'transparent',
            borderRadius: '4px',
            '&:hover': hasKids ? { backgroundColor: 'action.hover' } : {},
          }}
          onClick={hasKids ? () => onToggleExpand(node.MENU_ID) : undefined}
        >
          {hasKids && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </Box>

        {/* Checkbox */}
        <Checkbox
          size="small"
          checked={state === 'on'}
          indeterminate={state === 'mid'}
          onChange={() => onToggle(node.MENU_ID)}
          sx={{ p: '3px', mx: '2px' }}
        />

        {/* Menu name */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: hasKids ? 700 : 400,
            color: hasKids ? 'text.primary' : '#374151',
            userSelect: 'none',
            lineHeight: 1.5,
          }}
        >
          {node.MENU_NAME}
        </Typography>

        {/* URL hint for leaf nodes */}
        {!hasKids && node.MENU_URL && (
          <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
            {node.MENU_URL}
          </Typography>
        )}
      </Box>

      {/* ── Children ── */}
      {hasKids && isOpen && node.children.map((child, i) => (
        <MenuTreeNode
          key={child.MENU_ID}
          node={child}
          depth={depth + 1}
          serial={null}
          checked={checked}
          expanded={expanded}
          nodeMap={nodeMap}
          parentMap={parentMap}
          onToggle={onToggle}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RolePermissions — main page
// ─────────────────────────────────────────────────────────────────────────────

export default function RolePermissions() {
  const [roles,     setRoles]     = useState([]);
  const [roleId,    setRoleId]    = useState('');
  const [tree,      setTree]      = useState([]);
  const [checked,   setChecked]   = useState(new Set());
  const [expanded,  setExpanded]  = useState(new Set());
  const [baseline,  setBaseline]  = useState(new Set()); // last-saved snapshot for Reset
  const [loaded,    setLoaded]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);   // { sev, msg }
  const [roleErr,   setRoleErr]   = useState('');

  // Derived maps — recomputed only when tree changes
  const nodeMap  = useMemo(() => buildNodeMap(tree),   [tree]);
  const parentMap = useMemo(() => buildParentMap(tree), [tree]);
  const allIds   = useMemo(() => allTreeIds(tree),     [tree]);
  const pIds     = useMemo(() => collectParentIds(tree), [tree]);

  /* ── Fetch role list on mount ── */
  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/roles`)
      .then(r => r.json())
      .then(data => setRoles(Array.isArray(data) ? data : []))
      .catch(() => setToast({ sev: 'error', msg: 'Failed to load roles.' }));
  }, []);

  /* ── Load menu tree + existing assignments ── */
  const handleLoad = useCallback(async () => {
    if (!roleId) { setRoleErr('Please select a role first.'); return; }
    setRoleErr('');
    setLoading(true);
    try {
      const [treeRes, menuRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/menus/tree`),
        authFetch(`${API_BASE_URL}/api/roles/${roleId}/menus`),
      ]);
      if (!treeRes.ok || !menuRes.ok) throw new Error('API error');
      const treeData = await treeRes.json();
      const assigned = await menuRes.json();  // array of MENU_IDs
      setTree(treeData);
      const s = new Set(assigned);
      setChecked(s);
      setBaseline(s);
      setExpanded(new Set());
      setLoaded(true);
    } catch {
      setToast({ sev: 'error', msg: 'Failed to load permissions.' });
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  /* ── Reset to last-saved snapshot ── */
  const handleReset = useCallback(() => {
    setChecked(new Set(baseline));
  }, [baseline]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!roleId) { setRoleErr('Please select a role first.'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/roles/${roleId}/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuIds: [...checked] }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Save failed');
      setBaseline(new Set(checked));
      setToast({ sev: 'success', msg: `${body.count} menu permission(s) saved successfully.` });
    } catch (e) {
      setToast({ sev: 'error', msg: e.message || 'Failed to save permissions.' });
    } finally {
      setSaving(false);
    }
  }, [roleId, checked]);

  /* ── Tree interaction ── */
  const handleToggle = useCallback((menuId) => {
    setChecked(prev => toggle(menuId, prev, nodeMap, parentMap));
  }, [nodeMap, parentMap]);

  const handleExpand = useCallback((menuId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      return next;
    });
  }, []);

  const handleExpandAll   = useCallback(() => setExpanded(new Set(pIds)),    [pIds]);
  const handleCollapseAll = useCallback(() => setExpanded(new Set()),         []);
  const handleSelectAll   = useCallback(() => setChecked(new Set(allIds)),    [allIds]);
  const handleDeselectAll = useCallback(() => setChecked(new Set()),          []);

  const assignedCount = checked.size;
  const totalCount    = allIds.length;

  /* ── Role change ── */
  const handleRoleChange = (e) => {
    setRoleId(e.target.value);
    setRoleErr('');
    setLoaded(false);
    setChecked(new Set());
    setBaseline(new Set());
    setTree([]);
    setExpanded(new Set());
  };

  return (
    <Box sx={{ p: 3 }}>

      {/* ── Page title ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <KeyRound size={24} color="#1976d2" />
        <Typography variant="h5" fontWeight={700}>Role Permissions</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Assign menu access to roles. Select a role, click Load, then check the menus to grant access.
      </Typography>

      {/* ── Controls card (sticky) ── */}
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
          {/* Role dropdown */}
          <FormControl size="small" sx={{ minWidth: 300 }} error={!!roleErr}>
            <InputLabel required>Role</InputLabel>
            <Select value={roleId} label="Role" onChange={handleRoleChange}>
              <MenuItem value=""><em>— Select a role —</em></MenuItem>
              {roles.map(r => (
                <MenuItem key={r.ROLE_ID} value={r.ROLE_ID}>
                  {r.ROLE_CODE} — {r.ROLE_NAME}
                </MenuItem>
              ))}
            </Select>
            {roleErr && <FormHelperText>{roleErr}</FormHelperText>}
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

          {/* Save — pushed to right */}
          <Box sx={{ ml: 'auto', mt: '2px' }}>
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
          </Box>
        </Box>
      </Paper>

      {/* ── Tree panel (visible after Load) ── */}
      {loaded && (
        <Paper
          elevation={2}
          sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
        >
          {/* Secondary toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              px: 2,
              py: 1,
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{ textTransform: 'none', fontSize: '0.78rem', py: '3px' }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              sx={{ textTransform: 'none', fontSize: '0.78rem', py: '3px' }}
            >
              Deselect All
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Button
              size="small"
              variant="text"
              onClick={handleExpandAll}
              sx={{ textTransform: 'none', fontSize: '0.78rem', py: '3px' }}
            >
              Expand All
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleCollapseAll}
              sx={{ textTransform: 'none', fontSize: '0.78rem', py: '3px' }}
            >
              Collapse All
            </Button>

            {/* Assigned count — pushed right */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Assigned Menus:
              </Typography>
              <Chip
                label={`${assignedCount} / ${totalCount}`}
                size="small"
                color={
                  assignedCount === totalCount && totalCount > 0
                    ? 'success'
                    : assignedCount > 0
                    ? 'primary'
                    : 'default'
                }
                variant="filled"
                sx={{ fontWeight: 700, fontSize: '0.8rem', minWidth: 56 }}
              />
            </Box>
          </Box>

          {/* Column header row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              py: '6px',
              backgroundColor: '#f1f5f9',
              borderBottom: '2px solid #cbd5e1',
            }}
          >
            <Box sx={{ width: 44 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', pl: 1 }}
              >
                Sr
              </Typography>
            </Box>
            <Box sx={{ width: 22 }} />
            <Box sx={{ width: 30 }} />
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              Menu / Resource Hierarchy
            </Typography>
          </Box>

          {/* Tree */}
          <Box sx={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {tree.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                No active menus found.
              </Typography>
            ) : (
              tree.map((root, i) => (
                <MenuTreeNode
                  key={root.MENU_ID}
                  node={root}
                  depth={0}
                  serial={i + 1}
                  checked={checked}
                  expanded={expanded}
                  nodeMap={nodeMap}
                  parentMap={parentMap}
                  onToggle={handleToggle}
                  onToggleExpand={handleExpand}
                />
              ))
            )}
          </Box>
        </Paper>
      )}

      {/* ── Toast notification ── */}
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
