import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Container } from '@mui/material';


const GenericMasterTableView = ({ columns, rows, title }) => {
  return (
    <div style={{ marginLeft: '20%' }}>
      <h3>{title}</h3>
      <div
        style={{
          height: 500,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ minWidth: '1000px'}}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            pagination
            disableSelectionOnClick
            autoHeight
          />
        </div>
      </div>
    </div>
  );
};

export default GenericMasterTableView;
