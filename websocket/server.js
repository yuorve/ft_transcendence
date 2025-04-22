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

let games = {};
let players = {};
let ball = { x: 0, y: 0, dx: 0.1, dy: 0.1 };

wss.on('connection', (ws, request) => {
    const username = getUserFromRequest(request);   
    if (username) {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                if (client.username === username) {
                    //client.send(JSON.stringify({ type: 'connectionReplaced' }));
                    //client.close()
                    console.log(`Usuario con ID ${username} YA conectado`);
                }
            }
        });
        ws.username = username;
        console.log(`Usuario con ID ${username} conectado`);
    } else {
        ws.close();
        return;
    }

    const id = generatePlayerId();
    ws.id = id; // Añadir el id al objeto ws
    players[id] = { username: ws.username }; 
    console.log('User connected', id);

    ws.send(JSON.stringify({ type: 'playerId', id: id }));
    broadcast(JSON.stringify({ type: 'currentPlayers', players }));
    broadcast(JSON.stringify({ type: 'currentGames', games }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'globalChat') {
                console.log(`Mensaje global de ${ws.username}: ${data.message}`);
                
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
            if (data.type === 'newGame') {
                // Creación de la partida
                const gameId = generateGameId();
                console.log("Nueva Partida creada:", gameId);
                players[id].gameId = gameId;
                players[id].username = data.player;
                if (!games[gameId]) {
                    games[gameId] = {
                        game: data.game,
                        player1: id,
                        name1: data.player,
                        player2: null,
                        name2: null,
                    };
                }
                ws.send(JSON.stringify({ type: 'gameId', id: gameId }));
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);
            }
            if (data.type === 'joinGame') {
                console.log("Nuevo jugador en la Partida:", data.id);
                players[id].gameId = data.id;
                players[id].username = data.player;
                if (games[data.id]) {
                    if (!games[data.id].player2) {
                        games[data.id].player2 = id;
                        games[data.id].name2 = data.player;
                        if (data.game === 'pong') {
                            games[data.id].ball = { x: 0.0, y: 0.0, dx: 0.0, dy: 0.0 };
                        }
                        games[data.id].score1 = 0;
                        games[data.id].score2 = 0;
                
                        // Avisa a los jugadores de la nueva partida
                        const clientsArray = Array.from(wss.clients);                        
                        const player1 = clientsArray.find(client => client.id === games[data.id].player1);
                        const player2 = clientsArray.find(client => client.id === games[data.id].player2);                        
                        const namePlayer1 = players[games[data.id].player1].username;
                        const namePlayer2= players[games[data.id].player2].username;                        
                        if (player1 && player1.readyState === WebSocket.OPEN) {
                            player1.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player2, name: namePlayer2 }));
                        }
                        if (player2 && player2.readyState === WebSocket.OPEN) {
                            player2.send(JSON.stringify({ type: 'newPlayer', id: games[data.id].player1, name: namePlayer1 }));
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
                console.log("Partida Finalizada:",data.gameId);
                delete games[gameId]; // Elimina la partida
                broadcast(JSON.stringify({ type: 'currentGames', games }), ws);;
            }
            if (data.type === 'opponentMove') {
                console.log("Partida: ", data.gameId);
                console.log("Jugador: ", ws.id);
                const clientsArray = Array.from(wss.clients);
                const player1 = clientsArray.find(client => client.id === games[data.gameId].player1);
                const player2 = clientsArray.find(client => client.id === games[data.gameId].player2);
                // Avisa al oponente del movimiento
                if (games[data.gameId].player2 === ws.id && player1 && player1.readyState === WebSocket.OPEN) {
                    player1.send(JSON.stringify({ type: 'opponentMove', x: data.x }));
                }
                if (games[data.gameId].player1 === ws.id && player2 && player2.readyState === WebSocket.OPEN) {
                    player2.send(JSON.stringify({ type: 'opponentMove', x: data.x }));
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
            console.log("Mensaje no JSON ignorado:", message);            
        }
    });

    ws.on('close', () => {
        delete players[id];
        console.log('User disconnected', id);
        let gameId = null;
        // Buscamos la partida del jugador desconectado
        for (const idgame in games) {
            if (games[idgame].player1 === ws.id || games[idgame].player2 === ws.id) {
                gameId = idgame;
                break;
            }
        }
        if (gameId) {
            console.log("Partida encontrada:", gameId);
            const oponenteId = games[gameId].player1 === ws.id ? games[gameId].player2 : games[gameId].player1;
            const clientsArray = Array.from(wss.clients);
            const oponente = clientsArray.find(client => client.id === oponenteId);
            if (oponente && oponente.readyState === WebSocket.OPEN) {
                oponente.send(JSON.stringify({ type: 'opponentDisconnected' }));
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
