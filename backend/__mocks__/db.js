module.exports = {
  query: (sql, values, callback) => {
    // Simulate different SQL behavior
    if (sql.includes('SELECT')) {
      callback(null, [{ id: 1, name: 'Mock Patient' }]);
    } else {
      callback(null, { affectedRows: 1 });
    }
  },
  connect: (cb) => cb && cb(null),
  end: (cb) => cb && cb(),
};
