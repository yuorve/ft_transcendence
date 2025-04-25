// websocket/db.js
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');

// Point to the shared database volume
const dbPath = '/database/data.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error('Error connecting to SQLite:', err.message);
  else console.log('WebSocket service connected to SQLite database');
});

const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

module.exports = {
  run,
  get,
  all,
};