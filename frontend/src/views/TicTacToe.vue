<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from "vue";
import initTicTacToe from "../games/tictactoe";
import { Engine, Scene } from "@babylonjs/core";
import { getProfile, API_URL, createGame, generateId, updateGame } from "../api";
import { useRoute, useRouter } from "vue-router";
import { puntuation } from "../games/tictactoe";

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
        const result = initTicTacToe(); // Llamamos la función del juego
        scene = result.scene;
        engine = result.engine;
		if (!hasQueryParams)
			createGame(gameid, "TicTacToe", 0, player1 as string, player2 as string, "", "");
    } catch (error) {
        console.error("Error al inicializar Tic Tac Toe:", error);
    }
});

const sendrouter = useRouter();
const sendPunt = (winner: string) => {
  console.log("gameid en tictac es " + gameid);
  updateGame(gameid, String(puntuation.pl), String(puntuation.pr));
  if (hasQueryParams) {
    setTimeout(() => {
      sendrouter.push({
        path: "/Tournament",
      });
    }, 2000);
  }
};

onUnmounted(() => {
	console.log("desomantando...");
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
      sendPunt(player1 as string);
    }
  }
);

// Observa la puntuación del lado derecho
watch(
  () => puntuation.pr,
  (newVal) => {
    if (newVal >= 1) {
      console.log("¡La puntuación del jugador derecho ha llegado a 1!");
      sendPunt(player2 as string);
    }
  }
);
</script>

<template>
	<div class="flex h-full">
		<div class="w-1/6 flex flex-col bg-gradient-to-b from-blue-400 to-transparent">
			<div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
				<img :src="profileImage" alt="Profile Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-blue-200 border-1 border-blue-700 shadow-2xl rounded-md p-1">{{ username }}</p>
			</div>
			<div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
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
				<img src="../assets/default-profile.png" alt="Guest Image" class=" w-30 h-30 rounded-full shadow-2xl border-2">
				<p class="bg-amber-200 border-1 border-amber-700 shadow-2xl rounded-md p-1">Invitado</p>
			</div>
			<div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
			</div>
		</div>
</template>