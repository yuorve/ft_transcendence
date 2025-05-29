const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = process.env;
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos
const path = require('path'); // Para manejar rutas de archivos
const fs = require("fs");

async function userRoutes(fastify) {
// Ruta para listar usuarios
  fastify.get('/users', async (request, reply) => {
    try {
      const users = await all('SELECT * FROM users');
      reply.send({ users });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta para obtener un usuario a partir del id
  fastify.get('/user/:username', async (request, reply) => {
    try {
      const { username } = request.params;
      // Seleccionamos todas las columnas salvo la contraseña
      const row = await get(
        `SELECT 
           id,
           username,
           email,
           profileImage,
           status,
           favlang,
           created_at
         FROM users 
         WHERE username = ?`,
        [username]
      );
      if (!row) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }
      // Enviamos el objeto user completo
      reply.send({ user: row });
    } catch (error) {
      console.error('Error al obtener usuario por username:', error);
      reply.status(500).send({ error: error.message });
    }
  });


  const defaultProfileImage = "/src/assets/default-profile.png";
  // Ruta para obtener l imagen de un usuario a partir del nombre
  fastify.get('/user-image/:user', async (request, reply) => {
    try {
      const { user } = request.params;
      const users = await all('SELECT profileImage FROM users WHERE username = ?', [user]);
      const profileImage = users.length > 0 ? users[0].profileImage !== null ? users[0].profileImage : defaultProfileImage : defaultProfileImage;

      reply.send({ profileImage });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta para verificar si un nombre de usuario está disponible
  fastify.get('/check-username/:username', async (request, reply) => {
    try {
      const { username } = request.params;
      const user = await get('SELECT username FROM users WHERE username = ?', [username]);

      if (user) {
        reply.send({ available: false, message: 'El nombre de usuario ya está en uso' });
      } else {
        reply.send({ available: true, message: 'El nombre de usuario está disponible' });
      }
    } catch (error) {
      reply.status(500).send({ error: 'Error al verificar el nombre de usuario' });
    }
  });

  // Ruta protegida (solo accesible con token)
  fastify.get('/profile', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) return reply.status(401).send({ error: 'Token requerido' });

      // Verificar el token
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
    
      // Obtener datos completos del usuario desde la base de datos
      const user = await all('SELECT username, email, profileImage, favlang, created_at FROM users WHERE id = ?', [userId]);

      if (!user) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      reply.send({ user });
    } catch (error) {
      console.error('Error en perfil:', error);
      reply.status(401).send({ error: 'Token inválido o expirado' });
    }
  });

  // Ruta para registrar un usuario con contraseña cifrada
  fastify.post('/register', async (request, reply) => {
    try {
      const { username, email, password, profileImage } = request.body;
    
      // Validar campos de texto
      if (!username || !email || !password) {
        return reply.status(400).send({ error: "Faltan datos" });
      }

      // Validar que se haya subido un archivo
      if (!profileImage || profileImage.type !== 'file') {
        return reply.status(400).send({ error: "No se subió ninguna imagen de perfil." });
      }

      // Generar la ruta para guardar la imagen
      const profileImagePath = `/uploads/${username.value}_${Date.now()}_${profileImage.filename}`;
      const filePath = path.join(__dirname, '..', profileImagePath);

      // Escribir el Buffer directamente en el archivo
      fs.writeFileSync(filePath, profileImage._buf);

      // Guardar el usuario en la base de datos
      const hashedPassword = await bcrypt.hash(password.value, 10);
      await run(
          "INSERT INTO users (username, email, password, profileImage, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
          [username.value, email.value, hashedPassword, profileImagePath]
      );

      reply.send({ success: true, message: "Usuario registrado con éxito", profilePicture: filePath });
    } catch (err) {
        console.error("Error al guardar la imagen:", err);
        return reply.status(500).send({ error: "Error al guardar la imagen." });
    }
  });

  // Ruta para actualizar la imagen de usuario
  fastify.post('/update-profile', async (request, reply) => {
    try {
      const { username, profileImage } = request.body;
      if (!username) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      
      const user = await get('SELECT * FROM users WHERE username = ?', [username.value]);
      if (!user) return reply.status(401).send({ error: 'Usuario incorrecto' });

      // Validar que se haya subido un archivo
      if (!profileImage || profileImage.type !== 'file') {
        return reply.status(400).send({ error: "No se subió ninguna imagen de perfil." });
      }

      // Generar la ruta para guardar la imagen
      const profileImagePath = `/uploads/${username.value}_${Date.now()}_${profileImage.filename}`;
      const filePath = path.join(__dirname, '..', profileImagePath);

      // Escribir el Buffer directamente en el archivo
      fs.writeFileSync(filePath, profileImage._buf);

      // Guardar el usuario en la base de datos
      await run(
          "UPDATE users SET profileImage = ? WHERE id = ?",
          [profileImagePath, user.id]
      );
      
      reply.send({ success: true, message: "Imagen actualizada con éxito", profilePicture: profileImagePath });
    } catch (error) {
      reply.status(500).send({ error: 'Error en el servidor' });
    }
  });

// Ruta para actualizar favlang
fastify.patch('/user/:username/favlang', async (req, reply) => {
  const { username } = req.params;
  const { favlang } = req.body;
  if (typeof favlang !== 'string') {
    return reply.status(400).send({ error: 'Idioma no válido' });
  }
  try {
    await run(
      'UPDATE users SET favlang = ? WHERE username = ?',
      [favlang, username]
    );
    reply.send({ success: true });
  } catch (err) {
    console.error('Error actualizando favlang:', err);
    reply.status(500).send({ error: err.message });
  }
});

  // Ruta para actualizar la contraseña
  fastify.post('/update-password', async (request, reply) => {
    const { username, password, newpassword } = request.body;
    if (!username || !password || !newpassword) {
      return reply.status(400).send({ error: 'Faltan datos' });
    }

    try {
      const user = await get('SELECT * FROM users WHERE username = ?', [username.value]);
      if (!user) return reply.status(401).send({ error: 'Usuario incorrecto' });

      const match = await bcrypt.compare(password.value, user.password);
      if (!match) return reply.status(401).send({ error: 'contraseña incorrecta' });

      // Guardar el usuario en la base de datos
      const hashedPassword = await bcrypt.hash(newpassword.value, 10);
      await run(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedPassword, user.id]
      );

      reply.send({ success: true, message: "Constraseña actualizada con éxito" });
    } catch (error) {
      reply.status(500).send({ error: 'Error en el servidor' });
    }
  });

  // Ruta para actualizar la contraseña
  fastify.post('/delete-account', async (request, reply) => {
    const { username, password } = request.body;
    if (!username || !password) {
      return reply.status(400).send({ error: 'Faltan datos' });
    }

    try {
      const user = await get('SELECT * FROM users WHERE username = ?', [username.value]);
      if (!user) return reply.status(401).send({ error: 'Usuario incorrecto' });

      const match = await bcrypt.compare(password.value, user.password);
      if (!match) return reply.status(401).send({ error: 'contraseña incorrecta' });

      // Elimina el usuario de la base de datos
      await run(
          "DELETE FROM users WHERE id = ?",
          [user.id]
      );

      reply.send({ success: true, message: "Cuenta eliminada con éxito" });
    } catch (error) {
      reply.status(500).send({ error: 'Error en el servidor' });
    }
  });  
}

module.exports = userRoutes;