const express = require('express');
const router = express.Router();
const db = require("../config/db")

function insertIntoAuditLog(db,{user_id,action,table_name,record_id,old_data,new_data},callback){
  const query = `
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data,timestamp)
    VALUES (?, ?, ?, ?, ?, ?,NOW())
  `;

  db.query(query,[user_id,action,table_name,record_id,old_data ? JSON.stringify(old_data) : null,new_data ? JSON.stringify(new_data) : null],callback);
}

module.exports = { insertIntoAuditLog };