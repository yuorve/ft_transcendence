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
        const friends = await all('SELECT * FROM friends WHERE request = "1" AND buddy = ?', [userName]);
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
  }

  module.exports = friendsRoutes;
  