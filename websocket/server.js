require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const db = require('./db');

// Rest of your code remains unchanged
function fetchProfileImage(username) {
    return db.get('SELECT profileImage FROM users WHERE username = ?', [username])
    .then(user => {
   		return user?.profileImage || null;
    })
    .catch(error => {
        console.error("Error al obtener imagen de perfil:", error.message);
        return null;
    });
}

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
      return cb(false, 401, 'Unauthorized');
    }
    
    try {
      // Verificar token JWT (usa el mismo secret que usas en tu backend)
      const decoded = jwt.verify(query.token, JWT_SECRET);
      info.req.user = decoded; // Guardar la info del usuario para usarla después
      return cb(true);
    } catch (err) {
      console.error('Error de autenticación WebSocket:', err);
      return cb(false, 401, 'Unauthorized');
    }
  }
});

let games = {}; //Partidas Activas
let players = {}; //Jugadores en Línea
let ball = { x: 0, y: 0, dx: 0.1, dy: 0.1 }; //Necesario para pong

wss.on('connection', (ws, request) => {
    const username = getUserFromRequest(request);
    if (username) {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                if (client.username === username) {
                    //client.send(JSON.stringify({ type: 'connectionReplaced' }));
                    console.log(`Usuario ${username} YA conectado`);
                    client.close()
                }
            }
        });

        ws.username = username;
        console.log(`Usuario ${username} conectado`);
    } else {
        ws.close();
        return;
    }

    players[username] = { gameId: null, profileImage: null };
    //broadcast(JSON.stringify({ type: 'currentPlayers', players }));
    //broadcast(JSON.stringify({ type: 'currentGames', games }));

    //const id = generatePlayerId();
    //ws.id = id; // Añadir el id al objeto ws
    //players[id] = { username: ws.username }; 
    //console.log('User connected', id);

    // fetchProfileImage(ws.username)
    //     .then(profileImage => {
    //         // Añadimos la imagen de perfil al objeto del jugador
    //         players[username].profileImage = profileImage || '/uploads/hello.jpg'; // Proporciona una imagen por defecto                
    //    })
    //     .catch(error => {
    //         console.error("Error al obtener imagen de perfil:", error);
    //         // Incluso en caso de error, continuamos con una imagen por defecto
    //         players[username].profileImage = '/uploads/hello.jpg';            
    //     });
        broadcast(JSON.stringify({ type: 'currentPlayers', players }));
        broadcast(JSON.stringify({ type: 'currentGames', games }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'globalChat') {
                // Crear objeto de mensaje con toda la información necesaria
                const chatMessage = {
                    type: 'globalChat',
                    senderId: id,
                    username: ws.username || players[id].username,
                    message: data.message,
                    timestamp: new Date().toISOString()
                };
                
                // Enviar a todos los clientes (incluido el remitente)
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(chatMessage));
                    }
                });
            }
            if (data.type === 'privateChat') {
                const toUsername = data.to;
                const fromUsername = ws.username;
            
                const recipient = Array.from(wss.clients).find(client => client.username === toUsername);
            
                if (recipient && recipient.readyState === WebSocket.OPEN) {
                    // Mandar el mensaje privado al destinatario
                    recipient.send(JSON.stringify({
                        type: 'privateChat',
                        from: fromUsername,
                        message: data.message,
                        timestamp: new Date().toISOString(),
                        openChat: data.openChat || false, // Esta flag viene del emisor
                    }));
                }
            }            
            if (data.type === 'newGame') {
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
                    if (data.game === 'Pong') {                        
                        games[gameId].ball = { x: 0.0, y: 0.0, dx: 0.0, dy: 0.0 };
                    }
                }
                //ws.send(JSON.stringify({ type: 'gameId', id: gameId }));
                broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);
            }
            if (data.type === 'joinGame') {
                console.log("Nuevo jugador en la Partida:", data.id);
                players[data.player].gameId = data.id;
                if (games[data.id]) {
                    if (!games[data.id].player2) {
                        games[data.id].player2 = data.player;                        
                        games[data.id].score2 = 0;
                
                        // Avisa a los jugadores de la nueva partida
                        const clientsArray = Array.from(wss.clients);                        
                        const player1 = clientsArray.find(client => client.username === games[data.id].player1);
                        const player2 = clientsArray.find(client => client.username === games[data.id].player2);                        
                        if (player1 && player1.readyState === WebSocket.OPEN) {
                            player1.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player2, game: data.id }));
                        }
                        if (player2 && player2.readyState === WebSocket.OPEN) {
                            player2.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player1, game: data.id }));
                            if (data.game === 'Pong') {
                                player2.send(JSON.stringify({ type: 'ballUpdate', ball: games[data.id].ball }));
                            }
                        }
                    }
                }
            }
            if(data.type === "score"){
                console.log("Actualizando puntuación");
                if (games[data.gameId]) {
                    games[data.gameId].score1 = data.score1;
                    games[data.gameId].score2 = data.score2;
                    const clientsArray = Array.from(wss.clients);                
                    const oponenteId = games[data.gameId].player1 === ws.username ? games[data.gameId].player2 : games[data.gameId].player1;
                    if (oponenteId) {
                        players[oponenteId].gameId = null;
                        const oponente = clientsArray.find(client => client.username === oponenteId);
                        if (oponente && oponente.readyState === WebSocket.OPEN) {
                            oponente.send(JSON.stringify({ type: 'scoreUpdate', score1: data.score1, score2: data.score2 }));
                            console.log("Enviado a: ", oponente.username);
                        }
                    }
                }
            }
            if(data.type === "gameOver"){
                console.log("Partida Finalizada:", data.gameId);
                if (games[data.gameId])
                {
                    if (games[data.gameId].player1)
                    {
                      if (players[games[data.gameId].player1])
                        {
                            players[games[data.gameId].player1].gameId = "";
                        }  
                    }
                    if (games[data.gameId].player2)
                        {
                          if (players[games[data.gameId].player2])
                            {
                                players[games[data.gameId].player2].gameId = "";
                            }  
                        }
                    delete games[data.gameId]; // Elimina la partida
                }
                broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);;
            }
            if (data.type === 'gameAborted') {
                console.log("Partida: ", data.gameId);
                console.log("Abandono de: ", ws.username);
                players[ws.username].gameId = null;
                const clientsArray = Array.from(wss.clients);                
                const oponenteId = games[data.gameId].player1 === ws.username ? games[data.gameId].player2 : games[data.gameId].player1;
                if (oponenteId) {
                    players[oponenteId].gameId = null;
                    const oponente = clientsArray.find(client => client.username === oponenteId);
                    if (oponente && oponente.readyState === WebSocket.OPEN) {
                        oponente.send(JSON.stringify({ type: 'gameAborted' }));
                        console.log("Enviado a: ", oponente.username);
                    }
                }
                delete games[data.gameId]; // Elimina la partida
                console.log("Partida eliminada:", data.gameId);
                broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);
            }
            if (data.type === 'opponentMove') {
                if (data.gameId === 'gameid')
                {
                    // Si no recibimos el gameid, lo obtenemos del array de jugadores
                    data.gameId = players[ws.username].gameId;
                }
                console.log("Partida: ", data.gameId);
                console.log("Movimiento de: ", ws.username);
                const clientsArray = Array.from(wss.clients);                
                const player1 = clientsArray.find(client => client.username === games[data.gameId].player1);
                const player2 = clientsArray.find(client => client.username === games[data.gameId].player2);
                // Avisa al oponente del movimiento
                if (games[data.gameId].player2 === ws.username && player1 && player1.readyState === WebSocket.OPEN) {
                    player1.send(JSON.stringify({ type: 'opponentMove', x: data.x }));
                    console.log("Enviado a: ", player1.username);
                }
                if (games[data.gameId].player1 === ws.username && player2 && player2.readyState === WebSocket.OPEN) {
                    player2.send(JSON.stringify({ type: 'opponentMove', x: data.x }));
                    console.log("Enviado a: ", player2.username);
                }
            }
            if (data.type === 'startGame') {
                console.log("Iniciando Partida: ", data.gameId);                
                const clientsArray = Array.from(wss.clients);                
                const player1 = clientsArray.find(client => client.username === games[data.gameId].player1);
                const player2 = clientsArray.find(client => client.username === games[data.gameId].player2);
                // Avisa del comienzo
                if (player1 && player1.readyState === WebSocket.OPEN) {
                    player1.send(JSON.stringify({ type: 'startGame' }));
                    console.log("Enviado a: ", player1.username);
                }
                if (player2 && player2.readyState === WebSocket.OPEN) {
                    player2.send(JSON.stringify({ type: 'startGame' }));
                    console.log("Enviado a: ", player2.username);
                }
            }
            if (data.type === 'ballUpdate') {                
                if (games[data.gameId].ball) {
                    //console.log("Actualizando bola en: ", data.gameId);
                    games[data.gameId].ball.x = data.ball.x;
                    games[data.gameId].ball.y = data.ball.y;
                    games[data.gameId].ball.dx = data.ball.dx;
                    games[data.gameId].ball.dy = data.ball.dy;

                    const clientsArray = Array.from(wss.clients);                
                    const oponenteId = games[data.gameId].player1 === ws.username ? games[data.gameId].player2 : games[data.gameId].player1;
                    if (oponenteId) {                        
                        const oponente = clientsArray.find(client => client.username === oponenteId);
                        if (oponente && oponente.readyState === WebSocket.OPEN) {                            
                            oponente.send(JSON.stringify({ type: 'ballUpdate', ball: games[data.gameId].ball }));
                            //console.log("Enviado a: ", oponente.username);
                        }
                    }
                }
            }
            if (data.type === 'ballReset') { // Esta no hace falta
                games[data.gameId].ball.x = data.ball.x;
                games[data.gameId].ball.y = data.ball.y;
                games[data.gameId].ball.x += data.ball.dx;
                games[data.gameId].ball.y += data.ball.dy;
    
                // Enviar el estado de la partida a los jugadores
                const clientsArray = Array.from(wss.clients);
                const player1 = clientsArray.find(client => client.username === games[data.gameId].player1);
                const player2 = clientsArray.find(client => client.username === games[data.gameId].player2);
    
                if (player1 && player1.readyState === WebSocket.OPEN) {
                    player1.send(JSON.stringify({ type: 'state', ball: games[data.gameId].ball }));
                }
                if (player2 && player2.readyState === WebSocket.OPEN) {
                    player2.send(JSON.stringify({ type: 'state', ball: games[data.gameId].ball }));
                }
            }
        } catch (error) {            
            console.error("Error al analizar JSON:", error.message);
        }
    });

    ws.on('close', () => {
        delete players[username];
        console.log('User disconnected', username);
        let gameId = null;
        // Buscamos la partida del jugador desconectado
        for (const idgame in games) {
            if (games[idgame].player1 === ws.username || games[idgame].player2 === ws.username) {
                gameId = idgame;
                break;
            }
        }
        if (gameId) {
            console.log("Partida encontrada:", gameId);
            const oponenteId = games[gameId].player1 === ws.username ? games[gameId].player2 : games[gameId].player1;
            const clientsArray = Array.from(wss.clients);
            const oponente = clientsArray.find(client => client.username === oponenteId);
            if (oponente && oponente.readyState === WebSocket.OPEN) {
                oponente.send(JSON.stringify({ type: 'opponentDisconnected' }));
            }
            if (oponenteId) {
                players[oponenteId].gameId = null;
            }
            delete games[gameId]; // Elimina la partida
            console.log("Partida eliminada:", gameId);
        }
        broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
        broadcast(JSON.stringify({ type: 'currentGames', games }), ws);
    });
});

function broadcast(data, sender) {
    wss.clients.forEach(client => {
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
    console.log('Servidor WebSocket escuchando en puerto 3000');
  });
