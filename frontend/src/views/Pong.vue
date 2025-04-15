<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import initPong from "../games/pong";
import { puntuation } from "../games/pong";
import { Engine, Scene } from "@babylonjs/core";
import { useRoute, useRouter } from "vue-router";
import { API_URL, createGame, generateId, getProfile, updateGame } from "../api";

let scene: Scene | null = null;
let engine: Engine | null = null;
const auth = inject<{ username: string }>("auth");
const route = useRoute();
const hasQueryParams = Object.keys(route.query).length > 0;
const profileImage = ref("");
const username = ref("");
const player1 = route.query.player1 || auth?.username;
const player2 = route.query.player2 || "Invitado";
const gameid = String(
  Array.isArray(route.query.gameid)
    ? route.query.gameid[0]
    : route.query.gameid || generateId()
);
// const gameid = route.query.gameid || generateId();

if (!auth) {
  throw new Error("No se encontró al usuario");
}

// Obtener la imagen de perfil desde la API cuando el componente se monta
onMounted(async () => {
  const defaultProfileImage = "../assets/default-profile.png";
  try {
    const profileData = await getProfile(); // Llamada a la API
    profileImage.value = profileData[0].profileImage
      ? `${API_URL}${profileData[0].profileImage}` 
      : defaultProfileImage;
	  username.value = profileData[0].username;
  } catch (error) {
    console.error("Error al obtener la imagen de perfil:", error);
    profileImage.value = defaultProfileImage;
	username.value = "Usuario";
  }
});

onMounted(() => {
  try {
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
    if (newVal >= 5) {
      console.log("¡La puntuación del jugador derecho ha llegado a 5!");
      sendPunt(player2 as string);
    }
  }
);
</script>

<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <div class="border-b-3 border-b-gray-700 h-3/4">
      <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="flex justify-center items-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4">
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <img :src="profileImage" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ player1 }}</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ player2 }}</p>
        <img src="../../space.jpg" alt="" class=" w-25 h-25 rounded-full shadow-2xl border-2">
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