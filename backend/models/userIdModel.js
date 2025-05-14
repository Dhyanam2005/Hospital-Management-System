const db = require("../config/db");

const findUserById = (userid,callback) => {
    db.query(
        'SELECT * from user where user_id = ?',[userid],(err,result) => callback(err,result)
    );
}

module.exports = { findUserById }