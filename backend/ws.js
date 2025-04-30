const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
require('dotenv').config();

function setupWebSocket(server) {
  // Crear servidor WebSocket independiente
  const wss = new WebSocket.Server({ noServer: true });

  const connectedUsers = new Map();

  // Función para extraer el ID del usuario de la request
  function getUserIdFromRequest(request) {
    // Obtener el token
    const urlParams = new URLSearchParams(request.url.split("?")[1]);
    const token = urlParams.get("token");

    //Verificar y decodificar el token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch (error) {
        console.error("Error al verificar el token JWT:", error);
        return null;
    }
  }

  // Manejar conexiones WebSocket manualmente
  server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, request) => {
    console.log("Cliente conectado por WebSocket");

    const userId = getUserIdFromRequest(request);
    if (userId) {
        connectedUsers.set(userId, ws);
        ws.userId = userId;
        console.log(`Usuario con ID ${userId} conectado`);
    } else {
        ws.close();
        return;
    }

    // Enviar mensaje de bienvenida
    //ws.send(JSON.stringify({ system: true, message: "Conectado al servidor WebSocket" }));

    // Manejar mensajes recibidos
    ws.on("message", (message) => {
      try {
          const data = JSON.parse(message);
          if (!data.senderId || !data.recipientId || !data.message) {
              console.warn("Mensaje inválido recibido:", message);
              return;
          }

          console.log(`Mensaje de ${data.senderId} a ${data.recipientId}: ${data.message}`);

          const recipientSocket = connectedUsers.get(Number(data.recipientId));
          const senderSocket = connectedUsers.get(data.senderId);

          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
              recipientSocket.send(JSON.stringify({
                  senderId: data.senderId,
                  message: data.message,
                  private: true,
              }));
          } else {
              console.log(`Usuario ${data.recipientId} no conectado o no disponible.`);
              if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                  senderSocket.send(JSON.stringify({
                      system: true,
                      message: `Usuario con ID ${data.recipientId} no encontrado`,
                  }));
              }
          }

          if (senderSocket && senderSocket.readyState === WebSocket.OPEN && data.senderId !== data.recipientId) {
              senderSocket.send(JSON.stringify({
                  senderId: data.senderId,
                  message: data.message,
                  private: true,
              }));
          }
      } catch (error) {
          console.error("Error procesando mensaje:", error);
      }
    });

    // Manejar cierre de sensiones
    ws.on("close", () => {
        console.log(`Usuario con ID ${ws.userId} desconectado`);
        connectedUsers.delete(ws.userId);
    });

    // Manejar errores
    ws.on("error", (error) => {
      console.error("Error en WebSocket:", error);
    });
  });
}

module.exports = setupWebSocket;
