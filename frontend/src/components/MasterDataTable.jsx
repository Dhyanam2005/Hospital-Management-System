import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper } from '@mui/material';

const GenericMasterTableView = ({ columns, rows, title }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2} color="text.primary">
        {title}
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#e8f0fe',
              color: '#1e40af',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            '& .MuiDataGrid-columnSeparator': { color: '#c7d7fd' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#f0f4ff' },
          }}
        />
      </Paper>
    </Box>
  );
};

export default GenericMasterTableView;
