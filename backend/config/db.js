const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hospital_management',
    multipleStatements: true
});

connection.connect((err) => {
    if(err){
        console.error('DB error : ' , err);
    }else{
        console.log('Connected to MYSQL')
    }
})

module.exports = connection;