const { promisify } = require('util');
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos

async function friendsRoutes(fastify) {
 // Ruta para listar amigos
  fastify.get('/friends/:user', async (request, reply) => {
      try {
        const userName = request.params.user;
        const friends = await all('SELECT * FROM friends WHERE request = "0" AND blocked = "0" AND username = ?', [userName]);
        reply.send({ friends });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para listar solicitudes de amistad
    fastify.get('/friend-request/:user', async (request, reply) => {
      try {
        const userName = request.params.user;
        const friends = await all('SELECT * FROM friends WHERE request = "1" AND username = ?', [userName]);
        reply.send({ friends });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para enviar una solicitud de amistad
    fastify.post('/friend-request', async (request, reply) => {
      const { username, buddy } = request.body;
      if (!username || !buddy) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("Enviando solicitud de amistad...")
      try {
        await run('INSERT INTO friends (username, buddy, request, blocked) VALUES (?, ?, ?, ?)', [username, buddy, "1", "0"]);
        reply.send({ message: 'Solicitud enviada' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al registrar solicitud' });
      }
    });

    fastify.post('/friend-block', async (request, reply) => {
      const { username, buddy, blocked } = request.body;
    
      if (!username || !buddy || typeof blocked === 'undefined') {
        return reply.status(400).send({ error: 'Missing data' });
      }
    
      try {
        if (blocked === "1") {
          // Intenta actualizar
          const result = await run(
            'UPDATE friends SET blocked = ?, request = "0" WHERE username = ? AND buddy = ?',
            [blocked, username, buddy]
          );
    
          // Si no existía, creamos una relación con bloqueo
          if (result.changes === 0) {
            await run(
              'INSERT INTO friends (username, buddy, request, blocked) VALUES (?, ?, "0", "1")',
              [username, buddy]
            );
          }
    
          return reply.send({ message: 'User blocked' });
        }
    
        // Si está desbloqueando, eliminamos cualquier relación existente con bloqueo previo
        const existing = await get(
          'SELECT * FROM friends WHERE username = ? AND buddy = ?',
          [username, buddy]
        );
    
        if (existing && existing.blocked === "1") {
          await run(
            'DELETE FROM friends WHERE username = ? AND buddy = ?',
            [username, buddy]
          );
        }
    
        return reply.send({ message: 'User unblocked and record deleted' });
    
      } catch (error) {
        console.error('Error in /friend-block:', error);
        return reply.status(500).send({ error: 'Error updating block status' });
      }
    });
    
    // Ruta para aceptar/rechazar/bloquear amistad
    fastify.post('/friends', async (request, reply) => {
      const { id, req, blocked } = request.body;
      if (!id || !req || !blocked) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("Actualizando registro de amistad...")
      try {
        // 1. Actualiza el estado de la solicitud original
        await run('UPDATE friends SET request = ?, blocked = ? WHERE id = ?', [req, blocked, id]);
      
        // 2. Si fue aceptada, crear relación inversa si no existe
        if (req === "0" && blocked === "0") {
          const original = await get('SELECT * FROM friends WHERE id = ?', [id]);
          
          const alreadyExists = await get(
            'SELECT * FROM friends WHERE username = ? AND buddy = ?',
            [original.buddy, original.username]
          );
      
          if (!alreadyExists) {
            await run(
              'INSERT INTO friends (username, buddy, request, blocked) VALUES (?, ?, "0", "0")',
              [original.buddy, original.username]
            );
          }
        }
      
        reply.send({ message: 'Amistad actualizada' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al actualizar amistad' });
      }
    });
    
    // Ruta para listar amigos bloqueados
    fastify.get('/friend-blocked/:user', async (request, reply) => {
      try {
        const userName = request.params.user;
        const friends = await all('SELECT * FROM friends WHERE blocked = "1" AND username = ?', [userName]);
        reply.send({ friends });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    // Eliminar amistad en ambos sentidos
    fastify.delete('/friends', async (request, reply) => {
      const { username, buddy } = request.body;
    
      if (!username || !buddy) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
    
      try {
        await run('DELETE FROM friends WHERE username = ? AND buddy = ?', [username, buddy]);
        await run('DELETE FROM friends WHERE username = ? AND buddy = ?', [buddy, username]);
        reply.send({ message: 'Amistad eliminada' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al eliminar amistad' });
      }
    });
  }


  module.exports = friendsRoutes;
  