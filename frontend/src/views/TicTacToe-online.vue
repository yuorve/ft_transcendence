<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from "vue";
import initTicTacToe from "../games/tictactoe";
import { Engine, Scene } from "@babylonjs/core";
import { API_URL, createGame, updateGame, deleteGame, generateId, getUserImage } from "../api";
import { useRoute, useRouter } from "vue-router";
import { puntuation, matriz } from "../games/tictactoe";
import { useWebSocket } from '../services/websocket';

let scene: Scene | null = null;
let engine: Engine | null = null;
const auth = inject<{ username: string }>("auth");
const route = useRoute();
const hasQueryParams = Object.keys(route.query).length > 0;
const username = auth?.username;
const gameid = String(
    Array.isArray(route.query.gameid)
    ? route.query.gameid[0]
    : route.query.gameid || generateId()
);

//const game = ref(route.params.game as string);
const gameMode = route.query.mode;
const defaultProfileImage = "/src/assets/default-profile.png";

const player1 = ref<string>(String(route.query.player1 || "Jugador1"));
const player2 = ref<string>(String(route.query.player2 || "Jugador2"));
const profileImageP1 = ref<string>(String(defaultProfileImage));
const profileImageP2 = ref<string>(String(defaultProfileImage));

async function loadProfileImage() {
     try {
        const promiseP1 = getUserImage(player1.value);
        const promiseP2 = getUserImage(player2.value);
        const [imageUrlP1, imageUrlP2] = await Promise.all([promiseP1, promiseP2]);        
        profileImageP1.value = (imageUrlP1 && imageUrlP1.profileImage) ? `${imageUrlP1.profileImage}` : defaultProfileImage;
        profileImageP2.value = (imageUrlP2 && imageUrlP2.profileImage) ? `${imageUrlP2.profileImage}` : defaultProfileImage;
    } catch (error) {
        console.error("Error al obtener la imagen del usuario:", error);
    }
}

// Uso del websocket
const { websocketState: { socket } } = useWebSocket();

if (socket) {
    socket.send(JSON.stringify({ type: gameMode, game: 'TicTacToe', id: gameid, player: username }));
    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        //console.log(data);
        if (data.type === 'newPlayer') {
            puntuation.pl = 0;
            puntuation.pr = 0;
            puntuation.gameOver = 0;
            puntuation.online = 1;
            //console.log("Nuevo Jugador");
            if ( gameMode === 'newGame' && gameid === data.game ) {
                player1.value = auth?.username || 'ErrorUser';
                player2.value = data.id;
                //Si queremos que sea aleatorio --> Math.random() > 0.5 ? 1 : 2;
                puntuation.playerFigure = 1;
                puntuation.playerTurn = 1;
                //console.log("Asignado Jugador 2");
                createGame(
                    gameid,
                    "TicTacToe",
                    -1,
                    player1.value,      // YA tenemos username cargado
                    player2.value,
                    "",
                    ""
                );
            } else if ( gameid === data.game ) {
                player1.value = data.id;
                player2.value = auth?.username || 'ErrorUser';
                puntuation.playerFigure = 2;
                puntuation.playerTurn = 0;
                //console.log("Asignado Jugador 1");
                updateGame(
                    gameid,
                    player1.value,
                    player2.value,
                    "",
                    ""
                );
            }
            loadProfileImage();
        } else if (data.type === 'opponentDisconnected' || data.type === 'gameAborted') {
            setTimeout(() => {
                sendrouter.push({
                    path: "/",
                });
            }, 500);
            //alert("Oponente Desconectado");
        }
    });
}

onMounted(() => {
    try {
        puntuation.playerTurn = 0;
        puntuation.gameOver = 0;
        puntuation.online = 1;
        const result = initTicTacToe(); // Llamamos la función del juego
        scene = result.scene;
        engine = result.engine;
    } catch (error) {
        console.error("Error al inicializar Tic Tac Toe:", error);
    }
});

const sendrouter = useRouter();
const sendPunt = (winner: string) => {
  // Actualizar partida actual
  console.log('puntuación izq: ', puntuation.pl);
  console.log('puntuación der: ', puntuation.pr);
  socket.send(JSON.stringify({ type: 'gameOver', gameId: gameid }));
  updateGame(
    gameid,
    player1.value,
    player2.value,
    String(puntuation.pl),
    String(puntuation.pr)
  );
  if (hasQueryParams) {
    setTimeout(() => {
      sendrouter.push({
        path: "/",
      });
    }, 2000);
  }
};

onUnmounted(() => {
	//console.log("desomantando...");
    if (socket && puntuation.gameOver === 0) {
        socket.send(JSON.stringify({ type: 'gameAborted', gameId: gameid }));
        deleteGame(gameid);
    }
    if (scene) {
        scene.dispose(); // Eliminar la escena de Babylon.js
        scene = null;
    }
    if (engine) {
        engine.dispose(); // Apagar el motor de Babylon.js
        engine = null;
    }
});

// Observa la puntuación del lado izquierdo
watch(
  () => puntuation.pl,
  (newVal) => {
    if (newVal >= 1) {
      console.log("¡La puntuación del jugador izquierdo ha llegado a 1!");
      sendPunt(player1.value as string);
    }
  }
);

// Observa la puntuación del lado derecho
watch(
  () => puntuation.pr,
  (newVal) => {
    if (newVal >= 1) {
      console.log("¡La puntuación del jugador derecho ha llegado a 1!");
      sendPunt(player2.value as string);
    }
  }
);

// watch(
//     () => JSON.parse(JSON.stringify(matriz.value)), 
    
//     (nuevaCopiaMatriz, antiguaCopiaMatriz) => {
//         console.log('Detectado cambio en la matriz');

//         if (!nuevaCopiaMatriz || !antiguaCopiaMatriz) return;

//         const rows = nuevaCopiaMatriz.length;
//         if (antiguaCopiaMatriz.length !== rows) return;
//         const cols = nuevaCopiaMatriz[0]?.length || 0;
//         if (antiguaCopiaMatriz[0]?.length !== cols) return;

//         for (let i = 0; i < rows; i++) {
//             for (let j = 0; j < cols; j++) {
//                 if (nuevaCopiaMatriz[i] && antiguaCopiaMatriz[i]) {
//                     const nuevoElemento = nuevaCopiaMatriz[i][j];
//                     const antiguoElemento = antiguaCopiaMatriz[i][j];

//                     if (nuevoElemento !== antiguoElemento) {
//                         console.log(`Cambio detectado en [${i}][${j}]`);
//                         console.log(`Valor nuevo: ${nuevoElemento}`);
//                         const cell = {
//                             i: i,
//                             j: j
//                         };
//                         if (socket) {
//                             if (puntuation.playerFigure === nuevoElemento) {
//                                 //socket.send(JSON.stringify({ type: 'opponentMove', gameId: gameid, x: cell }));
//                                 //Al final es mejor hacer esto desde dentro del juego porque a veces no lo detecta
//                             }
//                             if (puntuation.gameOver === 1) {
//                                 socket.send(JSON.stringify({ type: 'gameOver', gameId: gameid }));
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     },
//     { 
//         deep: true
//     } 
// );
</script>

<template>
	<div class="flex h-full">
		<div class="w-1/6 flex flex-col bg-gradient-to-b from-blue-400 to-transparent">
			<div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
				<img :src="profileImageP1" alt="Profile Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-blue-200 border-1 border-blue-700 shadow-2xl rounded-md p-1">{{ player1 }}</p>
			</div>
		</div>
		<div class="flex flex-col flex-1 m-0 p-0 h-full border-l-3 border-l-blue-700 border-r-3 border-r-amber-700">
			<div class="border-b-3 border-b-gray-700 h-full">
				<canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
			</div>
			<!-- <div class="bg-gradient-to-b from-gray-400 to-transparent w-full h-1/4">
			contador 3 en raya boton de reiniciar?
			</div> -->
		</div>
		<div class="w-1/6 flex flex-col bg-gradient-to-b from-amber-400 to-transparent ">
			<div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
				<img :src="profileImageP2" alt="Guest Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-amber-200 border-1 border-amber-700 shadow-2xl rounded-md p-1">{{ player2 }}</p>
			</div>
			</div>
		</div>
</template>