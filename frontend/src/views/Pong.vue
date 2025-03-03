<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import initPong from "../games/pong";
import { puntuation } from "../games/pong";
import { Engine, Scene } from "@babylonjs/core";

let scene: Scene | null = null;
let engine: Engine | null = null;


onMounted(() => {
  try {
    const result = initPong(); // Llamamos la función del juego
    scene = result.scene;
    engine = result.engine;
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
        <img src="../../space.jpg" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="text-5xl bg-blue-200 border-1 p-2 border-blue-700 shadow-2xl rounded-md">jugador 1</p>
      </div>
      <div class="w-1/3 flex justify-around">
        <h1 class="sm:text-8xl text-6xl">{{ puntuation.pl }} - {{ puntuation.pr }}</h1>
      </div>
      <div class="w-1/3 h-full flex justify-center gap-5 items-center">
        <p class="text-5xl bg-amber-200 border-1 p-2 border-amber-700 shadow-2xl rounded-md">Jugador 2</p>
        <img src="../../space.jpg" alt="" class=" w-25 h-25 rounded-full shadow-2xl border-2">
      </div>
    </div>
  </div>

</template>
