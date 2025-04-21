const WebSocket = require('ws');

module.exports = function setupWebSocket(server) {
  const clients = new Set();
  const wss = new WebSocket.Server({ server });
  const userList = [];
  const userBlocks = {}; // { [username]: ["bloqueado1", "bloqueado2"] }

  wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    clients.add(ws);

    ws.send(JSON.stringify({ type: 'message', user: "chat", message: '¡Bienvenido al chat!' }));

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log('Mensaje analizado:', parsedMessage);

      } catch (error) {
        console.error('Error al analizar el mensaje:', error);
      }
    });

    ws.on('close', () => {
      console.log('Cliente desconectado');
      const userIndex = userList.findIndex(user => user.ws === ws);
      if (userIndex !== -1) {
        const user = userList.splice(userIndex, 1)[0];
        console.log(`${user.username} se ha desconectado`);
      }
      broadcastUserList();
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  });
};
