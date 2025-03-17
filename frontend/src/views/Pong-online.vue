<script setup lang="ts">
import { reactive, watch, ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import initPong from "../games/pong-online";
import { puntuation, jugadores } from "../games/pong-online";
import { Engine, Scene } from "@babylonjs/core";
import { getProfile, API_URL } from "../api";
import { useWebSocket, websocketState } from '../services/websocket';

let scene: Scene | null = null;
let engine: Engine | null = null;
const token = localStorage.getItem("token") || "";
const profileImage = ref("");
const username = ref("");
const route = useRoute();
const game = ref(route.params.game as string);
const { websocketState: { socket } } = useWebSocket(token || '');

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
    if (socket) {
      const result = initPong(game.value, socket); // Llamamos la función del juego    
      scene = result.scene;
      engine = result.engine;
    }
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
</script>

<template>
  <div class="flex flex-col m-0 p-0 h-full">
    <div class="border-b-3 border-b-gray-700 h-3/4">
      <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="flex justify-center items-center bg-gradient-to-r from-blue-700 to-amber-400 w-full h-1/4">
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <img :src="profileImage" alt="Profile Image" class=" w-25 h-25 rounded-full shadow-2xl border-2">
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">{{ jugadores.p1 }}</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">{{ jugadores.p2 }}</p>
        <img src="../assets/default-profile.png" alt="Guest Image" class=" w-25 h-25 rounded-full shadow-2xl border-2">
      </div>
    </div>
  </div>

</template>
