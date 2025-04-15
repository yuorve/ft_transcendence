//const WS_URL: string = "ws://4000-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io/ws";
// Dirección del Websocket
const WS_URL: string = "wss://80-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io/socket";

let socket: WebSocket | null = null;

interface ReceivedMessageData {
    senderId: string;
    message: string;
    private?: boolean;
    system?: boolean;
    username?: string;
}

export function connectWebSocket(
    token: string,
    chatId: string,
    onMessageReceived: (data: ReceivedMessageData) => void
): void {
    const url: string = `${WS_URL}?token=${token}&chatId=${chatId}`;
    socket = new WebSocket(url);

    socket.onopen = (): void => {
        console.log("Conectado al WebSocket del backend");
    };

    socket.onmessage = (event: MessageEvent): void => {
        try {
            const data: ReceivedMessageData = JSON.parse(event.data);
            console.log("Mensaje recibido:", data);

            if (onMessageReceived) {
                onMessageReceived(data);
            }
        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    };

    socket.onclose = (): void => {
        console.log("Conexión WebSocket cerrada.");
        socket = null;
    };

    socket.onerror = (error: Event): void => {
        console.error("Error en WebSocket:", error);
    };
}

export function sendMessage(
    chatId: string,
    senderId: string,
    message: string
): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const data: string = JSON.stringify({ chatId, senderId, message });
        console.log("Enviando mensaje:", data);
        socket.send(data);
    } else {
        console.error("No hay conexión WebSocket activa");
    }
}
