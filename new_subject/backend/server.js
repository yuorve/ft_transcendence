require('dotenv').config();
const Fastify = require('fastify');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcrypt');
const { promisify } = require('util');
const { OAuth2Client } = require('google-auth-library');
const DATABASE_URL = process.env.DATABASE_URL || "sqlite:///data/data.db";
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const WebSocket = require('ws');
const fs = require("fs");
const util = require("util");
const pump = util.promisify(require("stream").pipeline);

const fastify = Fastify({ logger: true });

// Habilitar CORS
fastify.register(require('@fastify/cors'), {
  origin: ["http://localhost:5173", "http://localhost"], // Permite el frontend en Vite
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["Cross-Origin-Opener-Policy", "Cross-Origin-Embedder-Policy", "Cross-Origin-Resource-Policy"],
});

fastify.addHook("onSend", (request, reply, payload, done) => {
  reply.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  reply.header("Cross-Origin-Embedder-Policy", "require-corp");
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  done(null, payload);
});

// Conectar SQLite con Promesas
const dbPath = path.resolve(__dirname, DATABASE_URL.replace("sqlite://", ""));
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('Error al conectar con SQLite:', err.message);
  else console.log('Base de datos SQLite conectada');
});

// Convertir funciones SQLite a Promesas
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Crear tablas si no existen
(async () => {
  try {
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,  -- La contraseña se almacenará encriptada con bcrypt
      profileImage TEXT DEFAULT NULL, -- URL o ruta de la imagen del usuario
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      score TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("Tablas verificadas y listas para usarse");
  } catch (error) {
    console.error("Error al crear/verificar tablas:", error.message);
  }
})();

// Ruta de prueba
fastify.get('/status', async (req, reply) => {
  reply.send({ message: 'Backend funcionando!' });
});

fastify.post('/google-login', async (req, reply) => {
  const { token } = req.body;
  if (!token) {
    return reply.status(400).send({ error: 'Token de Google requerido' });
  }

  try {
    // Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const username = payload.email.split("@")[0];
    const email = payload.email;

    // Buscar el usuario en la base de datos
    let user = await get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      // Si el usuario no existe, lo registramos automáticamente
      await run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, 'GOOGLE_AUTH'], email);
      user = await get('SELECT * FROM users WHERE username = ?', [username]);
    }

    // Generar JWT
    const jwtToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    reply.send({ message: 'Inicio de sesión con Google exitoso', token: jwtToken, username });
  } catch (error) {
    reply.status(401).send({ error: 'Error verificando el token de Google' });
  }
});

// Ruta para listar usuarios
fastify.get('/users', async (req, reply) => {
  try {
    const users = await all('SELECT * FROM users');
    reply.send({ users });
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
});

const formbody = require("@fastify/formbody");
const fastifyMultipart = require("@fastify/multipart");
fastify.register(formbody);
// Habilitar `multipart/form-data`
fastify.register(fastifyMultipart, { 
  attachFieldsToBody: true, // Adjunta los campos al `body`
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Ruta para registrar un usuario con contraseña cifrada
fastify.post('/register', async (request, reply) => {
  console.log("Body recibido:", request.body);
  const data = await request.file();
  
  // Extraer datos del body
  const username = request.body.username?.value;
  const email = request.body.email?.value;
  const password = request.body.password?.value;
  const profileImage = request.body.profileImage; // Es un objeto con `file`

  if (!username || !email || !password) {
    return reply.status(400).send({ error: "Faltan datos" });
  }
  
  // Guardar la imagen en el servidor
  const filePath = `./uploads/${username}_${Date.now()}_${profileImage.filename}`;
  await pump(profileImage.file, fs.createWriteStream(filePath));

  // Guardar el usuario en la base de datos
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.run(
      "INSERT INTO users (username, email, password, profileImage, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [username, email, hashedPassword, filePath]
  );

  reply.send({ success: true, message: "Usuario registrado con éxito", profilePicture: filePath });
});

// Ruta para iniciar sesión y devolver un JWT
fastify.post('/login', async (req, reply) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return reply.status(400).send({ error: 'Faltan datos' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return reply.status(401).send({ error: 'Usuario o contraseña incorrectos' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return reply.status(401).send({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    reply.send({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    reply.status(500).send({ error: 'Error en el servidor' });
  }
});

// Ruta protegida (solo accesible con token)
fastify.get('/profile', async (req, reply) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return reply.status(401).send({ error: 'Token requerido' });

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
   
    // Obtener datos completos del usuario desde la base de datos
    const user = await all('SELECT username, email, profileImage, created_at FROM users WHERE id = ?', [userId]);

    if (!user) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }

    reply.send({ user });
  } catch (error) {
    console.error('Error en perfil:', error);
    reply.status(401).send({ error: 'Token inválido o expirado' });
  }
});

// Ruta para listar partidas
fastify.get('/games', async (req, reply) => {
  try {
    const games = await all('SELECT * FROM games');
    reply.send({ games });
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
});

// Ruta para registrar una partida
fastify.post('/games', async (req, reply) => {
  const { player1, player2, score } = req.body;
  if (!player1 || !player2 || !score) {
    return reply.status(400).send({ error: 'Faltan datos' });
  }

  try {
    await run('INSERT INTO games (player1, player2, score) VALUES (?, ?, ?)', [player1, player2, score]);
    reply.send({ message: 'Partida registrada' });
  } catch (error) {
    reply.status(500).send({ error: 'Error al registrar partida' });
  }
});

// Crear servidor WebSocket independiente
const wss = new WebSocket.Server({ noServer: true });

const clients = new Set();

// Manejar conexiones WebSocket manualmente
fastify.server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  console.log("Cliente conectado por WebSocket");
  clients.add(ws);

  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({ system: true, message: "Conectado al servidor WebSocket" }));

  // Manejar mensajes recibidos
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (!data.username || !data.message) {
        console.warn("Mensaje inválido recibido:", message);
        return;
      }

      console.log(`${data.username}: ${data.message}`);

      // Reenviar mensaje a todos los clientes conectados
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ username: data.username, message: data.message }));
        }
      }
    } catch (error) {
      console.error("Error procesando mensaje:", error);
    }
  });

  // Manejar desconexión del cliente
  ws.on("close", () => {
    console.log("Cliente desconectado");
    clients.delete(ws);
  });

  // Manejar errores
  ws.on("error", (error) => {
    console.error("Error en WebSocket:", error);
  });
});

// Servir archivos estáticos (para acceder a las imágenes subidas)
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

// Iniciar servidor
fastify.listen({ port: process.env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Backend corriendo en ${address}`);
});
