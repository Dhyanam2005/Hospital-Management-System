import { createTheme } from '@mui/material/styles';

const hmsTheme = createTheme({
  palette: {
    primary   : { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', contrastText: '#fff' },
    secondary : { main: '#0891b2', light: '#06b6d4', dark: '#0e7490', contrastText: '#fff' },
    success   : { main: '#059669', light: '#34d399', dark: '#047857', contrastText: '#fff' },
    warning   : { main: '#d97706', light: '#fbbf24', dark: '#b45309', contrastText: '#fff' },
    error     : { main: '#dc2626', light: '#f87171', dark: '#b91c1c',  contrastText: '#fff' },
    info      : { main: '#0891b2', contrastText: '#fff' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
    text      : { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
    divider   : '#e2e8f0',
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },

  shape: { borderRadius: 8 },

  shadows: [
    'none',
    '0 1px 3px rgba(15,23,42,0.08)',
    '0 2px 6px rgba(15,23,42,0.10)',
    '0 4px 12px rgba(15,23,42,0.10)',
    '0 6px 16px rgba(15,23,42,0.12)',
    '0 8px 24px rgba(15,23,42,0.12)',
    ...Array(19).fill('0 8px 32px rgba(15,23,42,0.14)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f0f4f8' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(37,99,235,0.25)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
        },
        elevation1: { boxShadow: '0 1px 4px rgba(15,23,42,0.08)' },
        elevation2: { boxShadow: '0 2px 8px rgba(15,23,42,0.10)' },
        elevation6: { boxShadow: '0 6px 24px rgba(15,23,42,0.14)' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#e8f0fe',
            color: '#1e40af',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: '2px solid #bfdbfe',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f0f4f8' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem', borderRadius: 6 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#93c5fd' },
            '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 2 },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#2563eb', height: 3, borderRadius: 3 },
        root: { borderBottom: '1px solid #e2e8f0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'none',
          color: '#475569',
          '&.Mui-selected': { color: '#2563eb' },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          fontFamily: '"Inter", "Roboto", sans-serif',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#e8f0fe',
            borderBottom: '2px solid #bfdbfe',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            color: '#1e40af',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#f0f4f8' },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            color: '#0f172a',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14, boxShadow: '0 16px 48px rgba(15,23,42,0.18)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': { backgroundColor: '#eff6ff' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          fontSize: '0.75rem',
          borderRadius: 6,
          fontWeight: 500,
        },
        arrow: { color: '#0f172a' },
      },
    },
  },
});

export default hmsTheme;
