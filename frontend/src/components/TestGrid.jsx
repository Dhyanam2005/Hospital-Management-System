import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

function TestGrid() {
  const [rows, setRows] = useState([
    { id: 0, name: 'Alice', age: 25 },
    { id: 1, name: 'Bob', age: 30 },
  ]);

  const columns = [
    { key: 'name', name: 'Name', editable: true },
    { key: 'age', name: 'Age', editable: true },
  ];

  const handleAddRow = () => {
    // Create a new empty row with unique id
    const newRow = { id: rows.length ? rows[rows.length - 1].id + 1 : 0, name: '', age: '' };
    setRows([...rows, newRow]);
  };

  return (
    <div>
        
    </div>
  );
}

export default TestGrid;
