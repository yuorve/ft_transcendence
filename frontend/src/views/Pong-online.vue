<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import initPong from "../games/pong";
import { puntuation } from "../games/pong";
import { Engine, Scene } from "@babylonjs/core";
import { useRoute, useRouter } from "vue-router";
import { API_URL, createGame, generateId, getProfile, updateGame, getUserImage } from "../api";
import { useWebSocket } from '../services/websocket';

let scene: Scene | null = null;
let engine: Engine | null = null;
const auth = inject<{ username: string }>("auth");
const route = useRoute();
const hasQueryParams = Object.keys(route.query).length > 0;
//const profileImage = ref("");
const username = auth?.username;
//const player1 = route.query.player1 || auth?.username;
//const player2 = route.query.player2 || "Invitado";
const gameid = String(
  Array.isArray(route.query.gameid)
    ? route.query.gameid[0]
    : route.query.gameid || generateId()
);
// const gameid = route.query.gameid || generateId();

if (!auth) {
  throw new Error("No se encontró al usuario");
}

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
        profileImageP1.value = (imageUrlP1 && imageUrlP1.profileImage) ? `${API_URL}${imageUrlP1.profileImage}` : defaultProfileImage;
        profileImageP2.value = (imageUrlP2 && imageUrlP2.profileImage) ? `${API_URL}${imageUrlP2.profileImage}` : defaultProfileImage;
    } catch (error) {
        console.error("Error al obtener la imagen del usuario:", error);
    }
}

// Uso del websocket
const token = localStorage.getItem("token") || "";
const { websocketState: { socket } } = useWebSocket(token || '');

let syncInterval: number | null = null;

if (socket) {
    socket.send(JSON.stringify({ type: gameMode, game: 'Pong', id: gameid, player: username }));
    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.type === 'newPlayer') {
          console.log("Nuevo Jugador");            
          if ( gameMode === 'newGame' ) {
              player1.value = auth?.username || 'ErrorUser';;
              player2.value = data.id;                
              console.log("Asignado Jugador 2");
              puntuation.isHost = true
              //@ts-ignore
              puntuation.playerPaddle = scene.getMeshByName("paddle1");
              //@ts-ignore
              puntuation.opponentPaddle = scene.getMeshByName("paddle2");
          } else {
              player1.value = data.id;
              player2.value = auth?.username || 'ErrorUser';;
              console.log("Asignado Jugador 1");
              //@ts-ignore
              puntuation.playerPaddle = scene.getMeshByName("paddle2");
              //@ts-ignore
              puntuation.opponentPaddle = scene.getMeshByName("paddle1");
              setTimeout(() => {
                socket.send(JSON.stringify({ type: 'startGame', gameId: gameid }));
            }, 100);          
          }
          loadProfileImage();
          console.log(data.id);
        } else if (data.type === 'startGame') {
          puntuation.gameState = 'playing'; 
          if (puntuation.isHost) {
            syncInterval = window.setInterval(() => {
                const ball = scene?.getMeshByName("mysphere");
                if (ball && socket) {
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: gameid,
                        ball: {
                            x: ball.position.x,
                            y: ball.position.y,
                            dx: puntuation.dx,
                            dy: puntuation.dy
                        }
                    }));
                }
            }, 100); // Sincronizar cada 100ms
          }
        } else if (data.type === 'ballUpdate') {
          //puntuation.dx = data.ball.dx;
          //puntuation.dy = data.ball.dy;
          // Actualiza sólo si no eres el anfitrión o si el juego aún no ha empezado
          if (gameMode !== 'newGame' || puntuation.gameState === 'waiting') {
              puntuation.dx = data.ball.dx;
              puntuation.dy = data.ball.dy;
              
              // Si hay información de posición, actualiza también la posición
              if (data.ball.x !== undefined && data.ball.y !== undefined) {
                  const ball = scene?.getMeshByName("mysphere");
                  if (ball) {
                      ball.position.x = ball.position.x * 0.3 + data.ball.x * 0.7;
                      ball.position.y = ball.position.y * 0.3 + data.ball.y * 0.7;
                  }
              }
          }
        } else if (data.type === 'scoreUpdate' ) {
          puntuation.pl = data.score1;
          puntuation.pr = data.score2;
        } else if (data.type === 'opponentMove') {
            if (puntuation.opponentPaddle) {
              puntuation.opponentPaddle.position.y = data.x;
            }
        } else if (data.type === 'opponentDisconnected' || data.type === 'gameAborted') {
            puntuation.gameState === 'gameOver';
            puntuation.gameOver = 1;
            //alert("Oponente Desconectado");
            setTimeout(() => {
                sendrouter.push({
                    path: "/",
                });
            }, 500);
        } 
    });
}

// Obtener la imagen de perfil desde la API cuando el componente se monta
// onMounted(async () => {
//   const defaultProfileImage = "../assets/default-profile.png";
//   try {
//     const profileData = await getProfile(); // Llamada a la API
//     profileImage.value = profileData[0].profileImage
//       ? `${API_URL}${profileData[0].profileImage}` 
//       : defaultProfileImage;
// 	  username.value = profileData[0].username;
//   } catch (error) {
//     console.error("Error al obtener la imagen de perfil:", error);
//     profileImage.value = defaultProfileImage;
// 	username.value = "Usuario";
//   }
// });

onMounted(() => {
  try {
    puntuation.gameMode = <string>gameMode;
    puntuation.gameState = 'waiting';
    puntuation.online = 1;
    const result = initPong(); // Llamamos la función del juego
    scene = result.scene;
    engine = result.engine;
    if (!hasQueryParams)
      createGame(gameid, "pong", player1 as string, player2 as string, "", "");
  } catch (error) {
    console.error("Error al inicializar Pong:", error);
  }
});

onUnmounted(() => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  if (socket && puntuation.gameState === 'playing') {
    socket.send(JSON.stringify({ type: 'gameAborted', gameId: gameid }));
  }
  if (scene) {
    scene.dispose(); // Eliminar la escena de Babylon.js
    scene = null;
  }
  if (engine) {
    engine.dispose(); // Apagar el motor de Babylon.js
    engine = null;
  }
  puntuation.pr = 0;  //sin estas dos lineas la puntuación se guarda aunque se cambie de vista
  puntuation.pl = 0;
});

const sendrouter = useRouter();
const sendPunt = (winner: string) => {
  console.log("gameid en pong es " + gameid);
  updateGame(gameid, String(puntuation.pl), String(puntuation.pr));
  if (hasQueryParams) {
    setTimeout(() => {
      sendrouter.push({
        path: "/Tournament",
      });
    }, 2000);
  }
};

// Observa la puntuación del lado izquierdo
watch(
  () => puntuation.pl,
  (newVal) => {
    console.log("punto");
    if (socket) {
      socket.send(JSON.stringify({ type: 'score', gameId: gameid, score1: newVal, score2: puntuation.pr }));
    }
    if (newVal >= 5) {
      console.log("¡La puntuación del jugador izquierdo ha llegado a 5!");
      sendPunt(player1 as string);
    }
  }
);

// Observa la puntuación del lado derecho
watch(
  () => puntuation.pr,
  (newVal) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'score', gameId: gameid, score1: puntuation.pl, score2: newVal }));
    }
    if (newVal >= 5) {
      console.log("¡La puntuación del jugador derecho ha llegado a 5!");
      sendPunt(player2 as string);
    }
  }
);

watch(
  () => puntuation.playerPaddle?.position.y,
  (newVal) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'opponentMove', gameId: gameid, x: newVal }));
    }
  }
);

watch(
  () => [puntuation.dx, puntuation.dy],
  ([newDx, newDy]) => {    
    const ball = scene?.getMeshByName("mysphere");
    if (ball && socket && gameMode === 'newGame') {
      socket.send(JSON.stringify({ 
        type: 'ballUpdate', 
        gameId: gameid, 
        ball: {
          dx: newDx, 
          dy: newDy,
          x: ball?.position.x,
          y: ball?.position.y
        } 
      }));
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <div class="border-b-3 border-b-gray-700 h-3/4">
      <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="flex justify-center items-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4">
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <img :src="profileImageP1" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ player1 }}</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ player2 }}</p>
        <img :src="profileImageP2" alt="" class=" w-25 h-25 rounded-full shadow-2xl border-2">
      </div>
    </div>
  </div>
  <div class="absolute w-full h-full text-9xl flex flex-col text-center items-center justify-center pointer-events-none"
    v-if="puntuation.pr >= 5 || puntuation.pr >= 5">
    <h1>FIN DE LA PARTIDA</h1>
    <h2 v-if="puntuation.pl >= 5">GANADOR {{ player1 }}</h2>
    <h2 v-else>GANADOR {{ player2 }}</h2>
  </div>

</template>