const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos
const { JWT_SECRET, GOOGLE_CLIENT_ID } = process.env;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function authRoutes(fastify) {
  // Ruta de prueba
  fastify.get('/status', async (request, reply) => {
    reply.send({ message: 'Backend funcionando!' });
  });
  // Ruta para iniciar sesión y devolver un JWT
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    if (!username || !password) {
      return reply.status(400).send({ error: 'Faltan datos' });
    }

    try {
      const user = await get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) return reply.status(401).send({ error: 'Usuario o contraseña incorrectos' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return reply.status(401).send({ error: 'Usuario o contraseña incorrectos' });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      reply.send({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
      reply.status(500).send({ error: 'Error en el servidor' });
    }
  });

  fastify.post('/google-login', async (request, reply) => {
    const { token } = request.body;
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
}

module.exports = authRoutes;
