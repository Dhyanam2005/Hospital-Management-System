import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const GenericMasterTableViewForRegistration = ({ columns, rows }) => {
  return (
    <div style={{ padding: '1rem', marginLeft: '20%' }}>
      <div
        style={{
          width: '100%',
          minWidth: '1000px',  
          height: 200,         
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={4}               
          rowsPerPageOptions={[]}   
          disableSelectionOnClick
          sx={{ 
            width: '100%',
          }} 
          getRowHeight={() => 30} 
          pagination
        />
      </div>
    </div>
  );
};

export default GenericMasterTableViewForRegistration;
