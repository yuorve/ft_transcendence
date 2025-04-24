require('dotenv').config();
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

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
  
const wss = new WebSocket.Server({ port: process.env.PORT });

let games = {}; //Partidas Activas
let players = {}; //Jugadores en Línea
let ball = { x: 0, y: 0, dx: 0.1, dy: 0.1 }; //Necesario para pong?

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

    players[username] = { gameId: null };
    //const id = generatePlayerId();
    //ws.id = id; // Añadir el id al objeto ws
    //players[id] = { username: ws.username }; 
    //console.log('User connected', id);
 
    //ws.send(JSON.stringify({ type: 'playerId', id: id }));
    broadcast(JSON.stringify({ type: 'currentPlayers', players }));
    broadcast(JSON.stringify({ type: 'currentGames', games }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'chat') {
                if (!data.recipientId || !data.message) {
                    console.warn("Mensaje inválido recibido:", message);
                    return;
                }
                // Gestión del Chat
                console.log(`Mensaje de ${id} a ${data.recipientId}: ${data.message}`);
                const clientsArray = Array.from(wss.clients);
                const recipientSocket = clientsArray.find(client => client.id === data.recipientId);
                const senderSocket = clientsArray.find(client => client.id === id);
                if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
                    recipientSocket.send(JSON.stringify({
                        senderId: id,
                        message: data.message,
                    }));
                } else {
                    console.log(`Usuario ${data.recipientId} no conectado o no disponible.`);
                    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                        senderSocket.send(JSON.stringify({
                            system: true,
                            message: `Usuario no conectado`,
                        }));
                    }
                }
                if (senderSocket && senderSocket.readyState === WebSocket.OPEN && data.senderId !== data.recipientId) {
                    senderSocket.send(JSON.stringify({
                        senderId: id,
                        message: data.message,
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
                        player2: null,
                    };
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
                        if (data.game === 'pong') {
                            games[data.id].ball = { x: 0.0, y: 0.0, dx: 0.0, dy: 0.0 };
                        }
                        games[data.id].score1 = 0;
                        games[data.id].score2 = 0;
                
                        // Avisa a los jugadores de la nueva partida
                        const clientsArray = Array.from(wss.clients);                        
                        const player1 = clientsArray.find(client => client.username === games[data.id].player1);
                        const player2 = clientsArray.find(client => client.username === games[data.id].player2);                        
                        if (player1 && player1.readyState === WebSocket.OPEN) {
                            player1.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player2 }));
                        }
                        if (player2 && player2.readyState === WebSocket.OPEN) {
                            player2.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player1 }));
                        }
                    }
                }
            }
            if(data.type === "score"){
                console.log("Punto para:", id);
                if (games[data.gameId]) {
                    if (!games[data.gameId].player1 === id) {
                        games[data.gameId].score1 += 1;
                    }
                    if (!games[data.gameId].player2 === id) {
                        games[data.gameId].score2 += 1;
                    }
                }
                //broadcast(JSON.stringify({type:'scoreUpdate', playerId: id}));
            }
            if(data.type === "gameOver"){
                console.log("Partida Finalizada:", data.gameId);
                players[games[data.gameId].player1].gameId = "";
                players[games[data.gameId].player2].gameId = "";
                delete games[data.gameId]; // Elimina la partida
                broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);;
            }
            if (data.type === 'gameAborted') {
                console.log("Partida: ", data.gameId);
                console.log("Abandono de: ", ws.username);
                const clientsArray = Array.from(wss.clients);                
                const player1 = clientsArray.find(client => client.username === games[data.gameId].player1);
                const player2 = clientsArray.find(client => client.username === games[data.gameId].player2);
                // Avisa al oponente del abandono
                if (games[data.gameId].player2 === ws.username && player1 && player1.readyState === WebSocket.OPEN) {
                    player1.send(JSON.stringify({ type: 'opponentDisconnected', x: 0 }));
                    console.log("Enviado a: ", player1.username);
                }
                if (games[data.gameId].player1 === ws.username && player2 && player2.readyState === WebSocket.OPEN) {
                    player2.send(JSON.stringify({ type: 'opponentDisconnected', x: 0 }));
                    console.log("Enviado a: ", player2.username);
                }
                if (games[data.gameId].player1) {
                    players[games[data.gameId].player1].gameId = null;
                }
                if (games[data.gameId].player2) {
                    players[games[data.gameId].player2].gameId = null;
                }
                delete games[data.gameId]; // Elimina la partida
                console.log("Partida eliminada:", data.gameId);
                broadcast(JSON.stringify({ type: 'currentPlayers', players }), ws);
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);
            }
            if (data.type === 'opponentMove') {
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
            if (data.type === 'ballUpdate') {              
                games[data.gameId].ball.dx = data.ball.dx;
                games[data.gameId].ball.dy = data.ball.dy;
            }
            if (data.type === 'ballReset') {
                games[data.gameId].ball.x = data.ball.x;
                games[data.gameId].ball.y = data.ball.y;
                games[data.gameId].ball.dx = data.ball.dx;
                games[data.gameId].ball.dy = data.ball.dy;    
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

function generateGameId() {
    return Math.random().toString(36).substring(2, 8); // Genera id más corto para los juegos
}

setInterval(() => {    
    for (const gameId in games) {
        // Verifica si la partida tiene una pelota
        if (games[gameId].ball) {
            games[gameId].ball.x += games[gameId].ball.dx;
            games[gameId].ball.y += games[gameId].ball.dy;

            // Enviar el estado de la partida a los jugadores
            const clientsArray = Array.from(wss.clients);
            const player1 = clientsArray.find(client => client.id === games[gameId].player1);
            const player2 = clientsArray.find(client => client.id === games[gameId].player2);

            if (player1 && player1.readyState === WebSocket.OPEN) {
                player1.send(JSON.stringify({ type: 'state', ball: games[gameId].ball }));
            }
            if (player2 && player2.readyState === WebSocket.OPEN) {
                player2.send(JSON.stringify({ type: 'state', ball: games[gameId].ball }));
            }
        }
    }
}, 1000 / 60);
