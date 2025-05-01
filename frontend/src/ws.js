const WS_URL = "ws://localhost:4000/ws";
let socket;

export function connectWebSocket(username, onMessageReceived) {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("Conectado al WebSocket del backend");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Mensaje recibido:", data);

      if (onMessageReceived) {
        onMessageReceived(data);
      }
    } catch (error) {
      console.error("Error procesando mensaje:", error);
    }
  };

  socket.onclose = () => {
    console.log("Conexión WebSocket cerrada. Intentando reconectar...");
    setTimeout(() => connectWebSocket(username, onMessageReceived), 3000); // 🔄 Reconectar tras 3 segundos
  };

  socket.onerror = (error) => {
    console.error("Error en WebSocket:", error);
  };
}

export function sendMessage(username, message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const data = JSON.stringify({ username, message });
    console.log("Enviando mensaje:", data);
    socket.send(data);
  } else {
    console.error("No hay conexión WebSocket activa");
  }
}
