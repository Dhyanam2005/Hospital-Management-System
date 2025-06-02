import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const GenericMasterTableView = ({ columns, rows, title }) => {
  return (
    <div style={{ padding: '1rem', marginLeft: '20%' }}>
      <h3>{title}</h3>
      <div
        style={{
          height: 500,
          overflowX: 'auto', // enable horizontal scrolling
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ minWidth: '1000px' /* adjust as needed */ }}>
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
