const db = require("../config/db");

const findUserByUsername = (username,callback) => {
    db.query(
        'SELECT * from user where user_name = ?',[username],(err,result) => callback(err,result)
    );
}

module.exports = { findUserByUsername }