const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');
const DATABASE_URL = process.env.DATABASE_URL || "sqlite:///data/data.db";

const dbPath = path.resolve(__dirname, DATABASE_URL.replace("sqlite://", ""));
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('Error al conectar con SQLite:', err.message);
  else console.log('Base de datos SQLite conectada');
});

const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Crear tablas si no existen
const initializeDatabase = async () => {
  try {
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,  -- La contraseña se almacenará encriptada con bcrypt
      profileImage TEXT DEFAULT NULL, -- URL o ruta de la imagen del usuario
      status TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      buddy TEXT NOT NULL,
      request TEXT NOT NULL,
      blocked TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);    

    await run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game TEXT NOT NULL,
      type TEXT NOT NULL,
      game_order INTEGER,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      score1 TEXT DEFAULT NULL,
      score2 TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament TEXT NOT NULL,
      game TEXT NOT NULL,
      round TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("Tablas verificadas y listas para usarse");
  } catch (error) {
    console.error("Error al crear/verificar tablas:", error.message);
  }
};

initializeDatabase();

module.exports = {
  run,
  get,
  all,
};