const { promisify } = require('util');
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos

async function chatsRoutes(fastify) {
  // Ruta para listar un chat
  fastify.get('/chats/:id', async (request, reply) => {
      try {
        const id = request.params.id;
        const chat = await all('SELECT sender, message FROM chats WHERE chat = ?', [id]);
        reply.send({ chat });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para guardar un mensaje
    fastify.post('/chats', async (request, reply) => {
      const { chat, sender, message } = request.body;
      if (!chat || !sender || !message) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("Guardando Mensaje...")
      try {
        await run('INSERT INTO chats (chat, sender, message) VALUES (?, ?, ?)', [chat, sender, message]);
        reply.send({ message: 'Mensaje guardado' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al guardar el mensaje' });
      }
    });
  }

  module.exports = chatsRoutes;
  