const { promisify } = require('util');
const { run, get, all } = require('../db'); // Importa las funciones de la base de datos

async function gamesRoutes(fastify) {
// Ruta para listar partidas
  fastify.get('/games/:user', async (request, reply) => {
      try {
        const userName = request.params.user;
        const games = await all('SELECT * FROM games WHERE player1 = ? ORDER BY id ASC', [userName]);
        reply.send({ games });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });

    // Ruta para borrar partidas
    fastify.get('/delete-game/:id', async (request, reply) => {
      try {
        const gameId = request.params.id;
        console.log("eliminando partida...")        
        await run('DELETE FROM games WHERE game = ?', [gameId]);
        reply.send({ message: 'Partida eliminada' });        
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para registrar una partida
    fastify.post('/games', async (request, reply) => {
      const { game, type, game_order, player1, player2, score1, score2 } = request.body;
      if (!game || !type || !player1 || !player2 || score1 === undefined || score2 === undefined) {
        return reply.status(400).send({ error: 'Faltan datos' });
      }
      console.log("guardando partida...")
      try {
        await run('INSERT INTO games (game, type, game_order, player1, player2, score1, score2) VALUES (?, ?, ?, ?, ?, ?, ?)', [game, type, game_order, player1, player2, score1, score2]);
        reply.send({ message: 'Partida registrada' });
      } catch (error) {
        console.error("🔥 ERROR AL GUARDAR PARTIDA:", error);
        reply.status(500).send({ error: error.message });
      }
    });

    // Ruta para actualizar una partida
    fastify.put('/games/:id', async (request, reply) => {
      const { id } = request.params;
      const { score1, score2 } = request.body;
      if (score1 === undefined || score2 === undefined) {
        return reply.status(400).send({ error: "Faltan datos de puntaje" });
      }
      try {
        // Asumiendo que usas una consulta SQL para actualizar
        await run('UPDATE games SET score1 = ?, score2 = ? WHERE game = ?', [score1, score2, id]);
        reply.send({ message: 'Partida actualizada correctamente' });
      } catch (error) {
        reply.status(500).send({ error: 'Error al actualizar la partida' });
      }
    });
    
    // Ruta para listar TODOS torneos
    fastify.get('/tournaments', async (request, reply) => {
      try {
        // Usamos JOIN para unir las tablas de torneos y juegos según el campo "game"
        const data = await all(`
          SELECT tournaments.*, games.*
          FROM tournaments
          JOIN games ON tournaments.game = games.game
        `);
        reply.send({ tournaments: data });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });
    
    // Ruta para listar toda la info de los torneos en los que participo
    fastify.get('/mytournaments/:username', async (request, reply) => {
      try {
        const username = request.params.username;
        const games = await all(`
          SELECT t.*, g.*
          FROM tournaments t
          JOIN games g ON t.game = g.game
          WHERE t.tournament IN (
            SELECT DISTINCT t2.tournament
            FROM tournaments t2
            JOIN games g2 ON t2.game = g2.game
            WHERE g2.player1 = ? OR g2.player2 = ?
          )
        `, [username, username]);
        reply.send({ games });
      } catch (error) {
        reply.status(500).send({ error: error.message });
      }
    });

    // Ruta para listar torneos
    fastify.get('/tournament/:username', async (request, reply) => {
      try {
        const username = request.params.username;
        const games = await all('SELECT * FROM tournaments, games WHERE tournaments.game = games.game AND games.score1 = \'\' AND games.score2 = \'\' AND (games.player1 = ? OR games.player2 = ?)', [username, username]);
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
