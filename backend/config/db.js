const mysql = require('mysql2');

const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'hospital_management',
  charset:  'utf8mb4',
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: true } }),
};

let connection = null;

function makeConnection() {
  connection = mysql.createConnection(dbConfig);

  connection.connect(err => {
    if (err) {
      console.error('DB connection error:', err.message);
      setTimeout(makeConnection, 3000);
      return;
    }
    console.log('Connected to MYSQL');
  });

  // Reconnect automatically if MySQL drops the connection (idle timeout, restart, etc.)
  connection.on('error', err => {
    console.error('DB error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      makeConnection();
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  makeConnection();

  // Keep-alive ping every 4 minutes — prevents MySQL from closing idle connections
  // (MySQL default wait_timeout is 8 hours, but can be shorter in some configs)
  setInterval(() => {
    if (connection && connection.state === 'authenticated') {
      connection.query('SELECT 1', err => {
        if (err) console.error('DB keepalive error:', err.message);
      });
    }
  }, 4 * 60 * 1000);
}

// Proxy always delegates to the *current* connection reference.
// This means route files that import `db` once will automatically
// use the new connection after a reconnect, with zero code changes.
module.exports = new Proxy({}, {
  get(_, prop) {
    if (!connection) return undefined;
    const val = connection[prop];
    return typeof val === 'function' ? val.bind(connection) : val;
  },
});
