// chatws.js
const WebSocket = require('ws');

function setupWebSocket(server) {
	const wss = new WebSocket.Server({ server });

	const clients = new Set();

	wss.on('connection', (ws) => {
		console.log('Nuevo cliente conectado');
		clients.add(ws);

		ws.on('message', (message) => {
			console.log('Mensaje recibido:', message.toString());

			// Reenviar el mensaje a todos los clientes conectados
			for (const client of clients) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message.toString());
				}
			}
		});

		ws.on('close', () => {
			console.log('Cliente desconectado');
			clients.delete(ws);
		});
	});
}

module.exports = setupWebSocket;
