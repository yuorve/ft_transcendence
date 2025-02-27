<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import initPong from "../games/pong";
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
});
</script>

<template>
  <div class="flex h-full">
    <div class="w-1/6 flex flex-col bg-gradient-to-b from-blue-400 to-transparent">
      <div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
        <img src="../../space.jpg" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="bg-blue-200 border-1 border-blue-700 shadow-2xl rounded-md p-1">jugador 1</p>
      </div>
      <div class="border-3 w-full flex-1 flex justify-center"> stadistics</div>
    </div>
    <div class="flex flex-col flex-1 m-0 p-0 h-full border-l-3 border-l-blue-700 border-r-3 border-r-amber-700">
      <div class="border-b-3 border-b-gray-700 h-3/4">
        <canvas id="renderCanvas" class="w-full h-full outline-none"></canvas>
      </div>
      <div class="bg-gradient-to-b from-gray-400 to-transparent w-full h-1/4">
        contador
      </div>
    </div>
    <div class="w-1/6 flex flex-col bg-gradient-to-b from-amber-400 to-transparent ">
      <div class="w-full h-80 flex flex-col gap-10 justify-center items-center">
        <img src="../../space.jpg" alt="" class=" w-30 h-30 rounded-full shadow-2xl border-2">
        <p class="bg-amber-200 border-1 border-amber-700 shadow-2xl rounded-md p-1">Jugador 2</p>
      </div>
      <div class="border-3 w-full flex-1 flex justify-center">stadistics</div>
    </div>
  </div>
</template>

<!-- <div class="flex h-full w-full border-3 border-blue-600">
  <div class="flex flex-col w-3/4 h-full border-3 border-white">
    <div class="w-full h-1/6 border-2 border-red-200">
      jugador 1
    </div>
    <div class="border-3 border-red-900 h-3/4">
      <canvas id="renderCanvasP" class="w-full h-full outline-none"></canvas>
    </div>
    <div class="w-auto h-1/6 border-2 border-red-200">
      jugador 2
    </div>
  </div>
  <div class="border-3 border-amber-400 w-1/4 h-full">
    contador
  </div>
</div> -->
  