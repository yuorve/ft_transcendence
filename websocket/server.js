require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const url = require("url");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const db = require("./db");

// Función para extraer el ID del usuario de la request
function getUserFromRequest(request) {
  // Obtener el token
  const urlParams = new URLSearchParams(request.url.split("?")[1]);
  const token = urlParams.get("token");

  //Verificar y decodificar el token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.username;
  } catch (error) {
    console.error("Error al verificar el token JWT:", error);
    return null;
  }
}

//const wss = new WebSocket.Server({ port: process.env.PORT });

// Crear un servidor HTTP que usaremos para montar el WebSocket
const server = http.createServer();

// Crear el servidor WebSocket y montarlo en el servidor HTTP
const wss = new WebSocket.Server({
  server,
  // Permitir conexiones desde cualquier origen
  verifyClient: (info, cb) => {
    // Parse de la URL para obtener el token
    const { query } = url.parse(info.req.url, true);

    if (!query.token) {
      return cb(false, 401, "Unauthorized");
    }

    try {
      // Verificar token JWT (usa el mismo secret que usas en tu backend)
      const decoded = jwt.verify(query.token, JWT_SECRET);
      info.req.user = decoded; // Guardar la info del usuario para usarla después
      return cb(true);
    } catch (err) {
      console.error("Error de autenticación WebSocket:", err);
      return cb(false, 401, "Unauthorized");
    }
  },
});

let games = {}; //Partidas Activas
let players = {}; //Jugadores en Línea
let ball = { x: 0, y: 0, dx: 0.1, dy: 0.1 }; //Necesario para pong
let userBlocks = {}; // Bloqueo de usuarios

wss.on("connection", (ws, request) => {
  const username = getUserFromRequest(request);
  if (username) {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        if (client.username === username) {
          //client.send(JSON.stringify({ type: 'connectionReplaced' }));
          console.log(`Usuario ${username} YA conectado`);
          client.close();
        }
      }
    });

    ws.username = username;
    console.log(`Usuario ${username} conectado`);
  } else {
    ws.close();
    return;
  }

  players[username] = { gameId: null, username: username };
  // Inicializar la lista de bloqueados del usuario si no existe
  if (!userBlocks[username]) {
    userBlocks[username] = [];
  }
  // Enviar la lista de usuarios bloqueados cuando se conecte
  ws.send(
    JSON.stringify({
      type: "blockedUsers",
      blockedUsers: userBlocks[username],
    })
  );

  broadcast(JSON.stringify({ type: "currentPlayers", players }));
  broadcast(JSON.stringify({ type: "currentGames", games }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "blockUser") {
        const blocker = ws.username;
        const blocked = data.blockedUser;

        console.log(`Usuario ${blocker} ha bloqueado a ${blocked}`);

        // Inicializar arrays si no existen
        if (!userBlocks[blocker]) {
          userBlocks[blocker] = [];
        }

        // Verificar si ya está bloqueado para evitar duplicados
        if (!userBlocks[blocker].includes(blocked)) {
          userBlocks[blocker].push(blocked);

          // Notificar al usuario que ha bloqueado exitosamente
          ws.send(
            JSON.stringify({
              type: "userBlocked",
              blockedUser: blocked,
              success: true,
            })
          );
        }
      }

      // Nuevo tipo de mensaje para desbloquear usuarios
      if (data.type === "unblockUser") {
        const unblocker = ws.username;
        const unblocked = data.unblockedUser;

        // Verificar si existe la lista de bloqueados
        if (userBlocks[unblocker]) {
          // Encontrar y eliminar el usuario desbloqueado
          const index = userBlocks[unblocker].indexOf(unblocked);
          if (index !== -1) {
            userBlocks[unblocker].splice(index, 1);

            // Notificar al usuario que ha desbloqueado exitosamente
            ws.send(
              JSON.stringify({
                type: "userUnblocked",
                unblockedUser: unblocked,
                success: true,
              })
            );
          }
        }
      }
      if (data.type === "tournamentCreated") {
        const systemMessage = {
          type: "globalChat",
          senderId: "System",
          username: "System", // nombre visible en el chat
          message: data.message,
          timestamp: new Date().toISOString(),
        };

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(systemMessage));
          }
        });
      }
      if (data.type === "game-invite") {
        const toUsername = data.to;
        const fromUsername = ws.username;
        const gameId = data.gameId;

        const recipient = [...wss.clients].find(
          (client) =>
            client.readyState === WebSocket.OPEN &&
            client.username === toUsername
        );

        if (recipient) {
          recipient.send(
            JSON.stringify({
              type: "game-invite",
              from: fromUsername,
              gameId, // reenviamos el gameId al receptor
            })
          );
        }
      }
      // Código modificado para server.js

      if (data.type === "game-invite-response") {
        const toUsername = data.to; // El jugador que envió la invitación
        const fromUsername = ws.username; // El jugador que responde
		console.log("Invitación de: ", fromUsername);
        const gameId = data.gameId;
        const accepted = data.accepted;

        // Primero, encontrar al usuario que envió la invitación
        const inviter = [...wss.clients].find(
          (client) =>
            client.readyState === WebSocket.OPEN &&
            client.username === toUsername
        );

        // Enviar respuesta al invitador
        if (inviter) {
          inviter.send(
            JSON.stringify({
              type: "game-invite-response",
              from: fromUsername,
              accepted: accepted,
              gameId: gameId,
            })
          );

          // Si la invitación fue aceptada, redirigimos al invitador al juego
          if (accepted) {
            inviter.send(
              JSON.stringify({
                type: "startGame",
                gameId,
                players: [toUsername, fromUsername],
                mode: "newGame",
              })
            );
          }
        }

        // Continuar con la lógica existente solo si se aceptó la invitación
        if (accepted) {
          console.log(
            `Invitación a partida ${gameId} aceptada por ${fromUsername}`
          );

          // Create game if it doesn't exist
          if (!games[gameId]) {
            games[gameId] = {
              id: gameId,
              game: "Pong",
              player1: toUsername,
              player2: fromUsername,
              score1: 0,
              score2: 0,
              state: "waiting",
              ball: { x: 0.0, y: 0.0, dx: 0.0, dy: 0.0 },
            };
          }

          // Assign gameId to both players
          if (players[toUsername]) players[toUsername].gameId = gameId;
          if (players[fromUsername]) players[fromUsername].gameId = gameId;

          // Notify both players
          const clientsArray = Array.from(wss.clients);
          const player1Client = clientsArray.find(
            (client) => client.username === toUsername
          );
          const player2Client = clientsArray.find(
            (client) => client.username === fromUsername
          );

          const startGameMsg1 = JSON.stringify({
            type: "startGame",
            gameId,
            players: [toUsername, fromUsername],
            mode: "newGame",
			player1: toUsername,
			player2: fromUsername,
			player: "player1",
          });

          const startGameMsg2 = JSON.stringify({
            type: "startGame",
            gameId,
            players: [toUsername, fromUsername],
            mode: "joinGame",
			player1: toUsername,
			player2: fromUsername,
			player: "player2",
          });

          // Informar a todos los clientes de la partida actualizada
          broadcast(JSON.stringify({ type: "currentGames", games }));
          broadcast(JSON.stringify({ type: "currentPlayers", players }));

          // El jugador que acepta la invitación ya será redirigido desde el frontend
          if (player1Client && player1Client.readyState === WebSocket.OPEN) {
            player1Client.send(startGameMsg1);
          }
		  if (player2Client && player2Client.readyState === WebSocket.OPEN) {
			player2Client.send(startGameMsg2);
		  }
        }
      }

      // Modificar el manejo de los mensajes globales para filtrar mensajes de usuarios bloqueados
      if (data.type === "globalChat") {
        // Crear objeto de mensaje con toda la información necesaria
        const chatMessage = {
          type: "globalChat",
          senderId: username,
          username: ws.username || players[username].username,
          message: data.message,
          timestamp: new Date().toISOString(),
        };

        // Enviar a todos los clientes excepto a los que han bloqueado al remitente
        // o han sido bloqueados por el remitente
        wss.clients.forEach((client) => {
          const senderIsBlocked = userBlocks[client.username]?.includes(
            ws.username
          );
          const receiverIsBlocked = userBlocks[ws.username]?.includes(
            client.username
          );

          if (
            client.readyState === WebSocket.OPEN &&
            !senderIsBlocked &&
            !receiverIsBlocked
          ) {
            client.send(JSON.stringify(chatMessage));
          }
        });
      }

      // Modificar el manejo de los mensajes privados para verificar bloqueos
      if (data.type === "privateChat") {
        const toUsername = data.to;
        const fromUsername = ws.username;

        // Verificar si alguno de los usuarios ha bloqueado al otro
        const isBlockedByReceiver =
          userBlocks[toUsername]?.includes(fromUsername);
        const hasSenderBlockedReceiver =
          userBlocks[fromUsername]?.includes(toUsername);

        // Si no hay bloqueos entre los usuarios, procesar el mensaje
        if (!isBlockedByReceiver && !hasSenderBlockedReceiver) {
          const recipient = Array.from(wss.clients).find(
            (client) => client.username === toUsername
          );

          if (recipient && recipient.readyState === WebSocket.OPEN) {
            // Mandar el mensaje privado al destinatario
            recipient.send(
              JSON.stringify({
                type: "privateChat",
                from: fromUsername,
                message: data.message,
                timestamp: new Date().toISOString(),
                openChat: data.openChat || false,
              })
            );
          }
        } else {
          // Notificar al remitente que el mensaje no se pudo enviar por bloqueo
          ws.send(
            JSON.stringify({
              type: "messageFailed",
              to: toUsername,
              reason: "blocked",
              message:
                "No puedes enviar mensajes a este usuario porque está bloqueado o te ha bloqueado.",
            })
          );
        }
      }
      if (data.type === "newGame") {
        // Creación de la partida
        const gameId = data.id;
        console.log("Nueva Partida creada:", gameId);
        console.log("Partida creada por:", data.player);
        players[data.player].gameId = gameId;
        console.log("Asignando partida");
        //players[id].username = data.player;
        if (!games[gameId]) {
          games[gameId] = {
            game: data.game,
            player1: data.player,
            score1: 0,
            player2: null,
            score2: null,
          };
          if (data.game === "Pong") {
            games[gameId].ball = {
              x: 0.0,
              y: 0.0,
              dx: 0.0,
              dy: 0.0,
            };
          }
        }
        //ws.send(JSON.stringify({ type: 'gameId', id: gameId }));
        broadcast(JSON.stringify({ type: "currentPlayers", players }), ws);
        broadcast(JSON.stringify({ type: "currentGames", games }), ws);
      }
      if (data.type === "joinGame") {
        console.log("Nuevo jugador en la Partida:", data.id);
        players[data.player].gameId = data.id;
        if (games[data.id]) {
          if (!games[data.id].player2) {
            games[data.id].player2 = data.player;
            games[data.id].score2 = 0;

            // Avisa a los jugadores de la nueva partida
            const clientsArray = Array.from(wss.clients);
            const player1 = clientsArray.find(
              (client) => client.username === games[data.id].player1
            );
            const player2 = clientsArray.find(
              (client) => client.username === games[data.id].player2
            );
            if (player1 && player1.readyState === WebSocket.OPEN) {
              player1.send(
                JSON.stringify({
                  type: "newPlayer",
                  id: games[data.id].player2,
                  game: data.id,
                })
              );
            }
            if (player2 && player2.readyState === WebSocket.OPEN) {
              player2.send(
                JSON.stringify({
                  type: "newPlayer",
                  id: games[data.id].player1,
                  game: data.id,
                })
              );
              if (data.game === "Pong") {
                player2.send(
                  JSON.stringify({
                    type: "ballUpdate",
                    ball: games[data.id].ball,
                  })
                );
              }
            }
          }
        }
      }
      if (data.type === "score") {
        console.log("Actualizando puntuación");
        if (games[data.gameId]) {
          games[data.gameId].score1 = data.score1;
          games[data.gameId].score2 = data.score2;
          const clientsArray = Array.from(wss.clients);
          const oponenteId =
            games[data.gameId].player1 === ws.username
              ? games[data.gameId].player2
              : games[data.gameId].player1;
          if (oponenteId) {
            players[oponenteId].gameId = null;
            const oponente = clientsArray.find(
              (client) => client.username === oponenteId
            );
            if (oponente && oponente.readyState === WebSocket.OPEN) {
              oponente.send(
                JSON.stringify({
                  type: "scoreUpdate",
                  score1: data.score1,
                  score2: data.score2,
                })
              );
              console.log("Enviado a: ", oponente.username);
            }
          }
        }
      }
      if (data.type === "gameOver") {
        console.log("Partida Finalizada:", data.gameId);
        if (games[data.gameId]) {
          if (games[data.gameId].player1) {
            if (players[games[data.gameId].player1]) {
              players[games[data.gameId].player1].gameId = "";
            }
          }
          if (games[data.gameId].player2) {
            if (players[games[data.gameId].player2]) {
              players[games[data.gameId].player2].gameId = "";
            }
          }
          delete games[data.gameId]; // Elimina la partida
        }
        broadcast(JSON.stringify({ type: "currentPlayers", players }), ws);
        broadcast(JSON.stringify({ type: "currentGames", games }), ws);
      }
      if (data.type === "gameAborted") {
        console.log("Partida: ", data.gameId);
        console.log("Abandono de: ", ws.username);
        players[ws.username].gameId = null;
        const clientsArray = Array.from(wss.clients);
        const oponenteId =
          games[data.gameId].player1 === ws.username
            ? games[data.gameId].player2
            : games[data.gameId].player1;
        if (oponenteId) {
          players[oponenteId].gameId = null;
          const oponente = clientsArray.find(
            (client) => client.username === oponenteId
          );
          if (oponente && oponente.readyState === WebSocket.OPEN) {
            oponente.send(JSON.stringify({ type: "gameAborted" }));
            console.log("Enviado a: ", oponente.username);
          }
        }
        delete games[data.gameId]; // Elimina la partida
        console.log("Partida eliminada:", data.gameId);
        broadcast(JSON.stringify({ type: "currentPlayers", players }), ws);
        broadcast(JSON.stringify({ type: "currentGames", games }), ws);
      }
      if (data.type === "opponentMove") {
        if (data.gameId === "gameid") {
          // Si no recibimos el gameid, lo obtenemos del array de jugadores
          data.gameId = players[ws.username].gameId;
        }
        console.log("Partida: ", data.gameId);
        console.log("Movimiento de: ", ws.username);
        const clientsArray = Array.from(wss.clients);
        const player1 = clientsArray.find(
          (client) => client.username === games[data.gameId].player1
        );
        const player2 = clientsArray.find(
          (client) => client.username === games[data.gameId].player2
        );
        // Avisa al oponente del movimiento
        if (
          games[data.gameId].player2 === ws.username &&
          player1 &&
          player1.readyState === WebSocket.OPEN
        ) {
          player1.send(JSON.stringify({ type: "opponentMove", x: data.x }));
          console.log("Enviado a: ", player1.username);
        }
        if (
          games[data.gameId].player1 === ws.username &&
          player2 &&
          player2.readyState === WebSocket.OPEN
        ) {
          player2.send(JSON.stringify({ type: "opponentMove", x: data.x }));
          console.log("Enviado a: ", player2.username);
        }
      }
      if (data.type === "startGame") {
        console.log("Iniciando Partida: ", data.gameId);
        const clientsArray = Array.from(wss.clients);
        const player1 = clientsArray.find(
          (client) => client.username === games[data.gameId].player1
        );
        const player2 = clientsArray.find(
          (client) => client.username === games[data.gameId].player2
        );
        // Avisa del comienzo
        if (player1 && player1.readyState === WebSocket.OPEN) {
          player1.send(JSON.stringify({ type: "startGame" }));
          console.log("Enviado a: ", player1.username);
        }
        if (player2 && player2.readyState === WebSocket.OPEN) {
          player2.send(JSON.stringify({ type: "startGame" }));
          console.log("Enviado a: ", player2.username);
        }
      }
      if (data.type === "ballUpdate") {
        if (games[data.gameId].ball) {
          //console.log("Actualizando bola en: ", data.gameId);
          games[data.gameId].ball.x = data.ball.x;
          games[data.gameId].ball.y = data.ball.y;
          games[data.gameId].ball.dx = data.ball.dx;
          games[data.gameId].ball.dy = data.ball.dy;

          const clientsArray = Array.from(wss.clients);
          const oponenteId =
            games[data.gameId].player1 === ws.username
              ? games[data.gameId].player2
              : games[data.gameId].player1;
          if (oponenteId) {
            const oponente = clientsArray.find(
              (client) => client.username === oponenteId
            );
            if (oponente && oponente.readyState === WebSocket.OPEN) {
              oponente.send(
                JSON.stringify({
                  type: "ballUpdate",
                  ball: games[data.gameId].ball,
                })
              );
              //console.log("Enviado a: ", oponente.username);
            }
          }
        }
      }
      if (data.type === "ballReset") {
        // Esta no hace falta
        games[data.gameId].ball.x = data.ball.x;
        games[data.gameId].ball.y = data.ball.y;
        games[data.gameId].ball.x += data.ball.dx;
        games[data.gameId].ball.y += data.ball.dy;

        // Enviar el estado de la partida a los jugadores
        const clientsArray = Array.from(wss.clients);
        const player1 = clientsArray.find(
          (client) => client.username === games[data.gameId].player1
        );
        const player2 = clientsArray.find(
          (client) => client.username === games[data.gameId].player2
        );

        if (player1 && player1.readyState === WebSocket.OPEN) {
          player1.send(
            JSON.stringify({
              type: "state",
              ball: games[data.gameId].ball,
            })
          );
        }
        if (player2 && player2.readyState === WebSocket.OPEN) {
          player2.send(
            JSON.stringify({
              type: "state",
              ball: games[data.gameId].ball,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error al analizar JSON:", error.message);
    }
  });

  ws.on("close", () => {
    delete players[username];
    console.log("User disconnected", username);
    let gameId = null;
    // Buscamos la partida del jugador desconectado
    for (const idgame in games) {
      if (
        games[idgame].player1 === ws.username ||
        games[idgame].player2 === ws.username
      ) {
        gameId = idgame;
        break;
      }
    }
    if (gameId) {
      console.log("Partida encontrada:", gameId);
      const oponenteId =
        games[gameId].player1 === ws.username
          ? games[gameId].player2
          : games[gameId].player1;
      const clientsArray = Array.from(wss.clients);
      const oponente = clientsArray.find(
        (client) => client.username === oponenteId
      );
      if (oponente && oponente.readyState === WebSocket.OPEN) {
        oponente.send(JSON.stringify({ type: "opponentDisconnected" }));
      }
      if (oponenteId) {
        players[oponenteId].gameId = null;
      }
      delete games[gameId]; // Elimina la partida
      console.log("Partida eliminada:", gameId);
    }
    broadcast(JSON.stringify({ type: "currentPlayers", players }), ws);
    broadcast(JSON.stringify({ type: "currentGames", games }), ws);
  });
});

function broadcast(data, sender) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

// function generateGameId() {
//     return Math.random().toString(36).substring(2, 8); // Genera id más corto para los juegos
// }

// setInterval(() => {
//     for (const gameId in games) {
//         // Verifica si la partida tiene una pelota
//         if (games[gameId].ball) {
//             games[gameId].ball.x += games[gameId].ball.dx;
//             games[gameId].ball.y += games[gameId].ball.dy;

//             // Enviar el estado de la partida a los jugadores
//             const clientsArray = Array.from(wss.clients);
//             const player1 = clientsArray.find(client => client.id === games[gameId].player1);
//             const player2 = clientsArray.find(client => client.id === games[gameId].player2);

//             if (player1 && player1.readyState === WebSocket.OPEN) {
//                 player1.send(JSON.stringify({ type: 'state', ball: games[gameId].ball }));
//             }
//             if (player2 && player2.readyState === WebSocket.OPEN) {
//                 player2.send(JSON.stringify({ type: 'state', ball: games[gameId].ball }));
//             }
//         }
//     }
// }, 1000 / 60);

// Iniciar el servidor HTTP en el puerto 3000
server.listen(process.env.PORT, () => {
  console.log("Servidor WebSocket escuchando en puerto 3000");
});
