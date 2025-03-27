const { promisify } = require('util');
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos

async function gamesRoutes(fastify) {
// Ruta para listar partidas
  fastify.get('/games', async (request, reply) => {
    try {
      const games = await all('SELECT * FROM games');
      reply.send({ games });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
  fastify.get('/games/:user', async (request, reply) => {
      try {
        const userName = request.params.user;
        const games = await all('SELECT * FROM games WHERE player1 = ?', [userName]);
        reply.send({ games });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para registrar una partida
    fastify.post('/games', async (request, reply) => {
      const { game, type, player1, player2, score1, score2 } = request.body;
      if (!game || !type || !player1 || !player2 || score1 === undefined || score2 === undefined) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("guardando partida...")
      try {
        await run('INSERT INTO games (player1, player2, score1, score2, game, type) VALUES (?, ?, ?, ?, ?, ?)', [player1, player2, score1, score2, game, type]);
        reply.send({ message: 'Partida registrada' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al registrar partida' });
      }
    });
    
    // Ruta para listar torneos
    fastify.get('/tournaments', async (request, reply) => {
      try {        
        const games = await all('SELECT * FROM tournaments');
        reply.send({ games });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });    
    fastify.get('/tournament/:username', async (request, reply) => {
      try {
        const username = request.params.username;
        const games = await all('SELECT * FROM tournaments, games WHERE tournaments.game = games.game AND games.score1 = NULL AND games.score2 = NULL AND (games.player1 = ? OR games.player2 = ?)', [username], [username]);
        reply.send({ games });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para registrar una partida
    fastify.post('/tournament', async (request, reply) => {
      const { id, game, round } = request.body;
      if (id === undefined || !game || round === undefined) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("guardando partida del torneo...")
      try {
        await run('INSERT INTO tournaments (tournament, game, round) VALUES (?, ?, ?)', [id, game, round]);
        reply.send({ message: 'Partida registrada' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al registrar torneo' });
      }
    });
  }

  module.exports = gamesRoutes;
      