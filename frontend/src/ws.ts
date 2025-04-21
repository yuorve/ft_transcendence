// src/ws.ts
let socket: WebSocket | null = null;

export function connectWebSocket(username: string) {
    console.log("username", username);

	socket = new WebSocket(`ws://${window.location.hostname}:3000`);
	socket.onopen = () => {
		console.log("[WebSocket] Conectado de ws.ts");
		socket?.send(JSON.stringify({
			type: "setUsername",
			username,
		}));
	};

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		console.log("[WebSocket] Mensaje recibido:", data);
	};

    socket.onclose = (event) => {
        console.warn("[WebSocket] Desconectado. Código:", event.code, "Razón:", event.reason);
        socket = null;
      };
      

	socket.onerror = (err) => {
		console.error("[WebSocket] Error:", err);
	};
}

export function closeWebSocket() {
	socket?.close();
}
