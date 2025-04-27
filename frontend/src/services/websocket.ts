// src/services/websocketService.ts
import { reactive } from 'vue';

// Dirección del Websocket
const WS_URL: string = "wss://" + window.location.host + "/socket";

export const websocketState = reactive({
    socket: null as WebSocket | null,
    isConnected: false,
    messages: [] as any[], // Almacena mensajes recibidos
});

export function useWebSocket() {
    const connect = (token: string) => {
        console.log(token);
        const url = `${WS_URL}?token=${token}`;
        websocketState.socket = new WebSocket(url);

        websocketState.socket.addEventListener('open', () => {
            console.log('Connected to server');
            websocketState.isConnected = true;
        });

        websocketState.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            websocketState.messages.push(data);
            //Guardar el Identificador
            if (data.type === 'playerId') {
                localStorage.setItem('playerId', data.id);
                console.log('Player ID stored:', data.id);
            }
            if (data.type === 'currentPlayers') {
                localStorage.setItem('players', JSON.stringify(data.players));
                console.log('Players stored:', data.players);
            }
            if (data.type === 'currentGames') {
                localStorage.setItem('games', JSON.stringify(data.games));
                console.log('Games stored:', data.games);
            }
            if (data.type === 'connectionReplaced') {
                if (window.location.pathname !== '/connection-lost') {
                    localStorage.setItem('redirectUrl', window.location.pathname);
                    window.location.replace('/connection-lost');
                    console.log('Conexión reemplazada por otra pestaña', data.games);
                }
            }
        });

        websocketState.socket.addEventListener('error', (error) => {
            console.error('WebSocket Error:', error);
            websocketState.isConnected = false;
        });

        websocketState.socket.addEventListener('close', () => {
            console.log('WebSocket closed');
            websocketState.isConnected = false;
        });
    };

    const send = (data: any) => {
        if (websocketState.socket && websocketState.isConnected) {
            websocketState.socket.send(JSON.stringify(data));
        } else {
            console.error("Socket is not open");
        }
    };

    const close = () => {
        if (websocketState.socket) {
            websocketState.socket.close();
        }
    };

    return {
        websocketState,
        connect,
        send,
        close,
    };
}
